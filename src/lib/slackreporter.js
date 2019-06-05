const dedent = require('dedent-js');
const moment = require('moment');
const pluralize = require('pluralize');
const slack = require('slack');
const { SLACK_INVITE_ERRORS } = require('./constants');

const GREEN = '#36a64f';

const waswere = (int, dryrun) => {
  if (dryrun) {
    return 'would have been';
  }
  return int === 1 ? 'was' : 'were';
};

class SlackReporter {
  constructor(channel, token, report) {
    this.channel = channel;
    this.token = token;
    this.report = report;
  }

  async post() {
    return new Promise((resolve, reject) => {
      const { text, attachments } = this.formatMessage();
      slack.chat.postMessage(
        {
          token: this.token,
          channel: this.channel,
          text,
          attachments: JSON.stringify(attachments),
          as_user: true
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    });
  }

  formatMessage() {
    const {
      DRY_RUN,
      created,
      removed,
      reactivated,
      maillistsUsed,
      date
    } = this.report;
    let { error } = this.report;
    const dryrun = DRY_RUN
      ? `*:rotating_light: The script was run in \`dry-run\` mode. No changes were propagated to Slack. :rotating_light:*`
      : '';
    let message = {
      text: dedent`\`slacksync\` report for ${moment(date).format(
        'MMMM Do, YYYY'
      )} at ${moment(date).format('HH:mm')}
                   ${pluralize(
                     'Maillist',
                     maillistsUsed.length
                   )} used: ${maillistsUsed.map(m => `\`${m}\``).join(', ')}
                   ${dryrun}
                  `,
      attachments: []
    };

    if (created) {
      message.attachments.push({
        title: `${pluralize('user', created.length, true)} ${waswere(
          created.length,
          DRY_RUN
        )} added:`,
        color: GREEN,
        fields: [
          {
            title: 'Name',
            value: created
              .map(u => `${u.name.givenName} ${u.name.familyName}`)
              .join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: created.map(u => u.userName).join('\n'),
            short: true
          }
        ]
      });
    }

    if (reactivated) {
      message.attachments.push({
        title: `${pluralize('user', reactivated.length, true)} ${waswere(
          reactivated.length,
          DRY_RUN
        )} re-activated:`,
        color: '#439FE0',
        fields: [
          {
            title: 'Name',
            value: reactivated
              .map(u => {
                if (DRY_RUN) {
                  // u is an array of SLACK API user objects
                  // https://api.slack.com/methods/users.info
                  return u.profile.real_name;
                } else {
                  // u is an array of SLACK SCIM API user objects
                  // https://api.slack.com/scim
                  return `${u.name.givenName} ${u.name.familyName}`;
                }
              })
              .join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: reactivated
              .map(u => {
                if (DRY_RUN) {
                  // u is an array of SLACK API user objects
                  // https://api.slack.com/methods/users.info
                  return u.name;
                } else {
                  // u is an array of SLACK SCIM API user objects
                  // https://api.slack.com/scim
                  return u.userName;
                }
              })
              .join('\n'),
            short: true
          }
        ]
      });
    }

    if (removed) {
      message.attachments.push({
        title: `${pluralize('user', removed.length, true)} ${waswere(
          removed.length,
          DRY_RUN
        )} removed:`,
        color: '#663399',
        fields: [
          {
            title: 'Name',
            value: removed
              .map(u => {
                if (DRY_RUN) {
                  // u is an array of SLACK API user objects
                  // https://api.slack.com/methods/users.info
                  return u.profile.real_name;
                } else {
                  // u is an array of SLACK SCIM API user objects
                  // https://api.slack.com/scim
                  return `${u.name.givenName} ${u.name.familyName}`;
                }
              })
              .join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: removed
              .map(u => {
                if (DRY_RUN) {
                  // u is an array of SLACK API user objects
                  // https://api.slack.com/methods/users.info
                  return u.name;
                } else {
                  // u is an array of SLACK SCIM API user objects
                  // https://api.slack.com/scim
                  return u.userName;
                }
              })
              .join('\n'),
            short: true
          }
        ]
      });
    }

    if (error) {
      if (!(error instanceof Error)) {
        error = error.data
          ? new Error(
              JSON.stringify({
                url: `${error.config.method.toUpperCase()} ${error.config.url}`,
                data: error.config.data,
                error: error.data
              })
            )
          : new Error(error);
      }
      message.attachments.push({
        title: `An error occurred while processing the script:`,
        color: 'danger',
        text: `${error.message}`
      });
    }

    return message;
  }
}

class SlackGuestReporter {
  constructor(channel, token, report) {
    this.channel = channel;
    this.token = token;
    this.report = report;
  }

  async post() {
    return new Promise(async (resolve, reject) => {
      const { text, attachments } = this.formatMessage();
      postMessage(
        {
          token: this.token,
          channel: this.channel,
          text,
          attachments: JSON.stringify(attachments),
          as_user: true
        },
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        }
      );
    });
  }

  formatMessage() {
    const {
      DRY_RUN,
      invited,
      inviteWarnings,
      promoted,
      promotionWarnings,
      addedToChannels,
      maillistsUsed,
      date,
      invitedTo
    } = this.report;
    let { error } = this.report;
    const dryrun = DRY_RUN
      ? `*:rotating_light: The script was run in \`dry-run\` mode. No changes were propagated to Slack. :rotating_light:*`
      : '';
    let message = {
      text: dedent`\`slacksync-guest\` report for ${moment(date).format(
        'MMMM Do, YYYY'
      )} at ${moment(date).format('HH:mm')}
                   ${pluralize(
                     'Maillist',
                     maillistsUsed.length
                   )} used: ${maillistsUsed.map(m => `\`${m}\``).join(', ')}
                   ${dryrun}
                  `,
      attachments: []
    };

    if (invited && invited.length) {
      const channelList = invitedTo.map(i => `<#${i}>`).join('\n');
      message.attachments.push({
        title: `${pluralize('user', invited.length, true)} ${waswere(
          invited.length,
          DRY_RUN
        )} invited to ${pluralize(
          'channel',
          invitedTo.length,
          true
        )}:\n${channelList}`,
        color: GREEN,
        fields: [
          {
            title: 'Email Address',
            value: invited.map(u => u.email).join('\n'),
            short: true
          },
          {
            title: 'Name',
            value: invited
              .map(u => (u.full_name ? u.full_name : '_no name provided_'))
              .join('\n'),
            short: true
          }
        ]
      });
    }

    if (inviteWarnings && inviteWarnings.length) {
      message.attachments.push({
        title: `${pluralize('warnings', inviteWarnings.length, true)} ${waswere(
          inviteWarnings.length,
          DRY_RUN
        )} received when inviting users:`,
        color: 'warning',
        fields: [
          {
            title: '',
            value: inviteWarnings
              .map(
                ({ email, error }) =>
                  `${email}: ${
                    SLACK_INVITE_ERRORS.hasOwnProperty(error)
                      ? SLACK_INVITE_ERRORS[error]
                      : error
                  }`
              )
              .join('\n'),
            short: false
          }
        ]
      });
    }

    if (promoted && promoted.length) {
      const channelList = invitedTo.map(i => `<#${i}>`).join('\n');
      message.attachments.push({
        title: `${pluralize('user', promoted.length, true)} ${waswere(
          promoted.length,
          DRY_RUN
        )} converted to multi-channel guest and added to ${pluralize(
          'channel',
          invitedTo.length,
          true
        )}:\n${channelList}`,
        color: GREEN,
        fields: [
          {
            title: 'Name',
            value: promoted.map(u => u.name).join('\n'),
            short: true
          },
          {
            title: 'Username',
            value: promoted.map(u => u.username).join('\n'),
            short: true
          }
        ]
      });
    }

    if (promotionWarnings && promotionWarnings.length) {
      message.attachments.push({
        title: `${pluralize(
          'warnings',
          promotionWarnings.length,
          true
        )} ${waswere(
          promotionWarnings.length,
          DRY_RUN
        )} received when converting single-channel guests to multi-channel guests:`,
        color: 'warning',
        fields: [
          {
            title: '',
            value: promotionWarnings
              .map(
                ({ email, error }) =>
                  `${email}: ${
                    SLACK_INVITE_ERRORS.hasOwnProperty(error)
                      ? SLACK_INVITE_ERRORS[error]
                      : error
                  }`
              )
              .join('\n'),
            short: false
          }
        ]
      });
    }

    if (addedToChannels && Object.keys(addedToChannels).length) {
      const numAdded = Object.keys(addedToChannels).length;
      message.attachments.push({
        title: `${numAdded} existing multi-channel ${pluralize(
          'guests',
          numAdded
        )} ${waswere(numAdded, DRY_RUN)} added to channels:`,
        color: GREEN,
        fields: [
          {
            name: 'Username',
            value: Object.keys(addedToChannels)
              .map(u => addedToChannels[u].user.name)
              .join('\n'),
            short: true
          },
          {
            name: 'Channels',
            value: Object.keys(addedToChannels)
              .map(u =>
                addedToChannels[u].channels.map(c => `<#${c}>`).join(', ')
              )
              .join('\n'),
            short: true
          }
        ]
      });
    }

    if (error) {
      if (!(error instanceof Error)) {
        error = error.data
          ? new Error(
              JSON.stringify({
                url: `${error.config.method.toUpperCase()} ${error.config.url}`,
                data: error.config.data,
                error: error.data
              })
            )
          : new Error(error);
      }
      message.attachments.push({
        title: `An error occurred while processing the script:`,
        color: 'danger',
        text: `${error.message}`
      });
    }

    return message;
  }
}

module.exports = {
  SlackReporter,
  SlackGuestReporter
};
