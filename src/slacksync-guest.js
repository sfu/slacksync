/* eslint no-console: 0 */

const { getUserBio } = require('./lib/amaint');
const { getMaillist, getMaillistMembers } = require('./lib/maillist');
const slack = require('./lib/slack');
const { IGNORE_USERS } = require('./lib/constants');
const { SlackGuestReporter } = require('./lib/slackreporter');
const slacksyncGuest = async opts => {
  let results = {
    date: new Date(),
    invitedTo: opts.invite_channel,
    invited: null,
    warnings: null,
    excludeMaillist: opts.exclude_maillist || null,
    maillistsUsed: opts.maillist
  };
  if (opts.dry_run) {
    results.DRY_RUN = true;
  }

  /* 
    - get maillist members
    - get slack members
    - get pending invitations

    - users to invite:
      - in maillist,
      - not in slack members
      - not in pending invitations
  */

  try {
    // get slack members
    const allSlackUsers = await slack.getUserList(opts.slack_token);
    const activeSlackUsers = allSlackUsers.members.filter(u => {
      return (
        !u.is_bot &&
        !IGNORE_USERS.includes(u.id) &&
        !IGNORE_USERS.includes(u.profile.email.split('@')[0])
      );
    });
    const activeSlackUsersEmails = activeSlackUsers.map(u => u.profile.email);

    // get pending slack invitations
    const pendingInvitations = await slack.getPendingInvitations(
      opts.slack_admin_user,
      opts.slack_admin_password
    );

    // Get info for each of the maillists specified in opts.
    let maillists = {};
    for (let promise of opts.maillist.map(m =>
      getMaillist(m, opts.maillist_token)
    )) {
      const maillist = await promise;
      maillists[maillist.id.toString()] = maillist;
    }

    // get maillist members
    // we only want local (3) and optionally external addresses (4)
    const allowed_types = [3];
    if (!opts.sfu_only) {
      allowed_types.push(4);
    }
    const promises = opts.maillist.map(m =>
      getMaillistMembers(m, opts.maillist_token)
    );
    const maillistMembers = [
      ...new Set(
        (await Promise.all(promises))
          .reduce((a, b) => a.concat(b))
          .filter(u => allowed_types.includes(u.type))
          .map(
            ({ canonicalAddress }) =>
              canonicalAddress.includes('@')
                ? canonicalAddress
                : `${canonicalAddress}@sfu.ca`
          )
      )
    ];
    results.maillistsUsed = Object.keys(maillists).map(m => maillists[m].name);

    /*
      - users to invite:
      - in maillist,
      - not in slack members
      - not in pending invitations
    */

    let usersToInvite = maillistMembers.filter(
      u =>
        !activeSlackUsersEmails.includes(u) &&
        !pendingInvitations.map(p => p.email).includes(u)
    );

    usersToInvite = await Promise.all(
      usersToInvite.map(async u => {
        const data = {
          email: u
        };
        if (u.includes('@sfu.ca')) {
          const bio = await getUserBio(u, opts.art_token);
          data.real_name = bio.commonname
            ? `${bio.commonname} ${bio.lastname}`
            : `${bio.firstnames} ${bio.lastname}`;
        }
        return data;
      })
    );

    let singleChannelGuestsToPromote = activeSlackUsers.filter(
      u => u.is_ultra_restricted && maillistMembers.includes(u.profile.email)
    );

    // existing multi-channel guests who are on the invite list may need to be added to the invite_channel(s)
    // find those users, get their existing channel memberships, diff with invite_channel
    // and add to the necessary channels
    const multiChannelGuests = activeSlackUsers.filter(
      u =>
        u.is_restricted &&
        !u.is_ultra_restricted &&
        maillistMembers.includes(u.profile.email)
    );

    const channelAdds = await Promise.all(
      multiChannelGuests.map(async u => {
        const memberOf = await slack.getUserChannelIds(u.id, opts.slack_token);
        const inviteTo = opts.invite_channel.filter(
          ic => !memberOf.includes(ic)
        );
        return { user: u, inviteTo };
      })
    );

    // get tokens so we can do the things
    const tokens = await slack.getSlackTokens(
      opts.slack_admin_user,
      opts.slack_admin_password
    );

    const invitations = usersToInvite.map(u =>
      slack.generateInviteDataForUser(
        u,
        opts.invite_channel,
        tokens.apiToken,
        opts.invite_message
      )
    );

    const invitationRequests = invitations.map(i =>
      slack.generateInvitationRequest(i, tokens)
    );

    let promotionRequestData, promotionRequests, promotionResponses;
    if (opts.invite_channel.length > 1) {
      promotionRequestData = singleChannelGuestsToPromote.map(u =>
        slack.generatePromotionRequestDataForUser(
          u,
          opts.invite_channel,
          tokens.apiToken
        )
      );

      promotionRequests = promotionRequestData.map(i =>
        slack.convertSingleChannelGuestToMultiChannel(i, tokens)
      );
    }

    let invitationResponses = (await Promise.all(invitationRequests)).map(
      (result, i) => {
        return {
          ...JSON.parse(result),
          email: invitations[i].email,
          name: invitations[i].hasOwnProperty('full_name')
            ? invitations[i].full_name
            : null
        };
      }
    );

    if (opts.invite_channel.length > 1 && promotionRequests) {
      promotionResponses = (await Promise.all(promotionRequests)).map(
        (result, i) => {
          return {
            ...JSON.parse(result),
            username: singleChannelGuestsToPromote[i].name,
            name: singleChannelGuestsToPromote[i].real_name
          };
        }
      );
    }

    const channelAddRequests = (await Promise.all(
      await channelAdds.map(x =>
        slack.inviteUserToChannels(x, opts.slack_token)
      )
    )).reduce((acc, val) => acc.concat(val), []);

    results.invited = invitationResponses.filter(r => r.ok);
    results.promoted = promotionResponses.filter(r => r.ok);
    results.promotionWarnings = promotionResponses.filter(
      r => !r.ok && r.error
    );

    results.addedToChannels = {};

    channelAddRequests.filter(r => r.ok).forEach(({ user, channel }) => {
      if (results.addedToChannels.hasOwnProperty(user.id)) {
        results.addedToChannels[user.id]['channels'].push(channel);
      } else {
        results.addedToChannels[user.id] = { user, channels: [channel] };
      }
    });

    results.inviteWarnings = invitationResponses.filter(r => !r.ok && r.error);

    console.log(results);

    if (
      opts.reporter_token &&
      opts.reporter_channel &&
      (results.invited.length ||
        results.inviteWarnings.length ||
        results.promoted.length ||
        results.promotionWarnings.length ||
        Object.keys(results.addedToChannels).length)
    ) {
      const reporter = new SlackGuestReporter(
        opts.reporter_channel,
        opts.reporter_token,
        results
      );
      try {
        await reporter.post();
      } catch (e) {
        console.error(e);
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      console.error(e.stack);
    } else {
      console.log(e);
    }
    if (opts.reporter_token && opts.reporter_channel) {
      results.error = e;
      console.log(results);

      const reporter = new SlackGuestReporter(
        opts.reporter_channel,
        opts.reporter_token,
        results
      );
      try {
        await reporter.post();
      } catch (slackError) {
        console.log('***** ERROR POSTING TO SLACK');
        console.error(slackError.stack);
      }
    }
  }
};

module.exports = slacksyncGuest;
