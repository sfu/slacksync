/* eslint no-console: 0 */

import {getUserBio} from './lib/amaint'
import {getMaillist, getMaillistMembers} from './lib/maillist'
import * as slack from './lib/slack'
import {IGNORE_USERS} from './lib/constants'
import SlackReporter from './lib/slackreporter'

export default async function slacksync(opts) {
  let results = {
    date: new Date(),
    created: null,
    removed: null,
    reactivated: null,
    excludeMaillist: opts.exclude_maillist || null,
    maillistsUsed: opts.maillist
  }
  if (opts.dry_run) {
    results.DRY_RUN = true
  }

  try {
    const excludeUsers = opts.exclude_maillist ? (await getMaillistMembers(opts.exclude_maillist, opts.maillist_token)).map(u => `${u.username}@sfu.ca`) : []
    const allSlackUsers = await slack.getUserList(opts.slack_token)
    const activeSlackUsers = allSlackUsers.members.filter(u => {
      return !u.deleted &&
             !u.is_bot &&
             !IGNORE_USERS.includes(u.id) &&
             !IGNORE_USERS.includes(u.profile.email.split('@')[0]) &&
             !u.is_restricted &&
             !u.is_ultra_restricted
    })
    const activeSlackUsersEmails = activeSlackUsers.map(u => u.profile.email)
    const deletedSlackUsers = allSlackUsers.members.filter(u => u.deleted && !u.is_bot)

    // Get info for each of the maillists specified in opts.
    // Specifically, we need to know the `type` param, which defines if the list
    // is static (0), dynamic (1), courselist(2), acadplan(3) or grouper(4).
    // Really all we care about is static or dynamic, to decide if we should
    // only autoGenerated members
    let maillists = {}
    for (let promise of opts.maillist.map(m => getMaillist(m, opts.maillist_token))) {
      const maillist = await promise
      maillists[maillist.id.toString()] = maillist
    }

    // Get the membership of each list
    let maillistMembers = []
    for (let promise of opts.maillist.map(m => getMaillistMembers(m, opts.maillist_token))) {
      maillistMembers.push(await promise)
    }

    // Filter out non-autoGenerated members for `dynamic (1)` lists, and
    // flatten into one array of email addresses.
    maillistMembers = maillistMembers.map((members, idx) => {
      const maillistId = opts.maillist[idx]
      const maillistType = maillists[maillistId].type
      return maillistType === 1 ? members.filter(u => u.autoGenerated) : members
    }).reduce((a,b) => a.concat(b)).filter(u => u.username).map(u => `${u.username}@sfu.ca`)

    // Unique the array of addresses
    // (https://twitter.com/alex_gibson/status/554745380005765120)
    const maillistMembersAddresses = [...new Set(maillistMembers)]

    results.maillistsUsed = Object.keys(maillists).map(m => maillists[m].name)

    const usersToRemoveFromSlack = activeSlackUsers.filter(u =>
      !maillistMembersAddresses.includes(u.profile.email) ||
      excludeUsers.includes(u.profile.email)
    )
    if (usersToRemoveFromSlack.length > 0 && opts.remove_users) {
      results.removed = await toggleUsersInSlack(usersToRemoveFromSlack, false, opts)
    }

    const usersToReactivate = deletedSlackUsers.filter(u =>
      maillistMembersAddresses.includes(u.profile.email) &&
      !IGNORE_USERS.includes(u.profile.email.split('@')[0]) &&
      !excludeUsers.includes(u.profile.email)
    )
    if (usersToReactivate.length > 0 && opts.reactivate_users) {
      results.reactivated = await toggleUsersInSlack(usersToReactivate, true, opts)
    }

    const usersToCreate = maillistMembersAddresses.filter(
      u => !(activeSlackUsersEmails.includes(u)) &&
           !(usersToReactivate.map(u => u.profile.email).includes(u)) &&
           !IGNORE_USERS.includes(u.split('@')[0]) &&
           !excludeUsers.includes(u)
      )
    if (usersToCreate.length > 0 && opts.create_users) {
      results.created = await createUsersInSlack(usersToCreate, opts)
    }

    console.log(results)

    if ((opts.reporter_token && opts.reporter_channel) && (results.created || results.removed || results.reactivated)) {
      const reporter = new SlackReporter(opts.reporter_channel, opts.reporter_token, results)
      try {
        await reporter.post()
      } catch(e) {
        console.error(e)
      }
    }

  } catch(e) {
    if (e instanceof Error) {
      console.error(e.message)
      console.error(e.stack)
    } else {
      console.log(e)
    }
    if ((opts.reporter_token && opts.reporter_channel)) {
      results.error = e
      console.log(results)

      const reporter = new SlackReporter(opts.reporter_channel, opts.reporter_token, results)
      try {
        await reporter.post()
      } catch(slackError) {
        console.log('***** ERROR POSTING TO SLACK')
        console.error(slackError.stack)
      }
    }
  }
}

async function toggleUsersInSlack(users, state, opts) {
  // users is an array of Slack API user objects
  // (https://api.slack.com/types/user)
  const userIds = users.map(u => u.id)
  if (opts.dry_run) {
    return users
  }
  const targets = userIds.map(id => slack.toggleUserActive(id, state, opts.slack_token))
  let responses = []
  for (let cmd of targets) {
    responses.push(await cmd)
  }
  return responses
}

async function createUsersInSlack(users, opts) {
  // users is an array of SFU email addresses

  // Fetch user bio data from AOBRestServer
  let userBios = []
  for (let promise of users.map(u => getUserBio(u, opts.art_token))) {
    userBios.push(await promise)
  }

  // Create user objects in the format expected by the
  // Slack SCIM API (https://api.slack.com/scim)
  const newSlackUsers = userBios.map(u => {
    return {
      userName: u.username,
      name: {
        familyName: u.lastname,
        givenName: u.commonname || u.firstnames
      },
      emails: [{
        value: `${u.username}@sfu.ca`,
        primary: true
      }]
    }
  })

  if (opts.dry_run) {
    return newSlackUsers
  }

  const targets = newSlackUsers.map(u => slack.createUser(u, opts.slack_token))
  let responses = []
  for (let cmd of targets) {
    responses.push(await cmd)
  }

  return responses
}
