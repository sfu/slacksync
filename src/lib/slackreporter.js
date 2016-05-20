/* global dedent */

import moment from 'moment'
import pluralize from 'pluralize'
import postMessage from 'slack/methods/chat.postMessage'

const waswere = (int, dryrun) => {
  if (dryrun) {
    return 'would have been'
  }
  return int === 1 ? 'was' : 'were'
}

export default class SlackReporter {
  constructor(channel, token, report) {
    this.channel = channel
    this.token = token
    this.report = report
  }

  async post() {
    return new Promise((resolve, reject) => {
      const {text, attachments} = this.formatMessage()
      postMessage({
        token: this.token,
        channel: this.channel,
        text,
        attachments: JSON.stringify(attachments),
        as_user: true
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }


  formatMessage() {
    const {DRY_RUN, created, removed, reactivated, maillistsUsed, date} = this.report
    let {error} = this.report
    const dryrun = DRY_RUN ? `*:rotating_light: The script was run in \`dry-run\` mode. No changes were propagated to Slack. :rotating_light:*` : ''
    let message = {
      text: dedent`\`slacksync\` report for ${moment(date).format('MMMM Do, YYYY')} at ${moment(date).format('HH:mm')}
                   ${pluralize('Maillist', maillistsUsed.length)} used: ${maillistsUsed.map(m => `\`${m}\``).join(', ')}
                   ${dryrun}
                  `,
      attachments: []
    }

    if (created) {
      message.attachments.push({
        title: `${pluralize('user', created.length, true)} ${waswere(created.length, DRY_RUN)} added:`,
        "color": "#36a64f",
        fields: [
          {
            title: 'Name',
            value: created.map(u => `${u.name.givenName} ${u.name.familyName}`).join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: created.map(u => u.userName).join('\n'),
            short: true
          }
        ]
      })
    }

    if (reactivated) {
      message.attachments.push({
        title: `${pluralize('user', reactivated.length, true)} ${waswere(reactivated.length, DRY_RUN)} re-activated:`,
        "color": "#439FE0",
        fields: [
          {
            title: 'Name',
            value: reactivated.map(u => {
              if (DRY_RUN) {
                // u is an array of SLACK API user objects
                // https://api.slack.com/methods/users.info
                return u.profile.real_name
              } else {
                // u is an array of SLACK SCIM API user objects
                // https://api.slack.com/scim
                return `${u.name.givenName} ${u.name.familyName}`
              }
            }).join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: reactivated.map(u => {
              if (DRY_RUN) {
                // u is an array of SLACK API user objects
                // https://api.slack.com/methods/users.info
                return u.name
              } else {
                // u is an array of SLACK SCIM API user objects
                // https://api.slack.com/scim
                return u.userName
              }
            }).join('\n'),
            short: true
          }
        ]
      })
    }

    if (removed) {
      message.attachments.push({
        title: `${pluralize('user', removed.length, true)} ${waswere(removed.length, DRY_RUN)} removed:`,
        "color": "#663399",
        fields: [
          {
            title: 'Name',
            value: removed.map(u => {
              if (DRY_RUN) {
                // u is an array of SLACK API user objects
                // https://api.slack.com/methods/users.info
                return u.profile.real_name
              } else {
                // u is an array of SLACK SCIM API user objects
                // https://api.slack.com/scim
                return `${u.name.givenName} ${u.name.familyName}`
              }
            }).join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: removed.map(u => {
              if (DRY_RUN) {
                // u is an array of SLACK API user objects
                // https://api.slack.com/methods/users.info
                return u.name
              } else {
                // u is an array of SLACK SCIM API user objects
                // https://api.slack.com/scim
                return u.userName
              }
            }).join('\n'),
            short: true
          }
        ]
      })
    }

    if (error) {
      if (!(error instanceof Error)) {
        error = error.data ? new Error(JSON.stringify({
          url: `${error.config.method.toUpperCase()} ${error.config.url}`,
          data: error.config.data,
          error: error.data
        })) : new Error(error)
      }
      message.attachments.push({
        title: `An error occurred while processing the script:`,
        color: 'danger',
        text: `${error.message}`
      })
    }

    return message
  }
}
