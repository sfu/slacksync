const options = [
  {
    names: ['version', 'v'],
    type: 'bool',
    help: 'Print program version and exit'
  },
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help and exit'
  },
  {
    names: ['maillist'],
    type: 'string',
    env: 'SLACKSYNC_MAILLIST_ID',
    helpArg: '12345',
    help: 'REQUIRED Numeric ID of the source maillist'
  },
  {
    names: ['maillist-token'],
    type: 'string',
    env: 'SLACKSYNC_MLTOKEN',
    helpArg: 'MLTOKEN',
    help: 'REQUIRED Maillist API Token'
  },
  {
    names: ['art-token'],
    type: 'string',
    env: 'SLACKSYNC_ART_TOKEN',
    helpArg: 'ART_TOKEN',
    help: 'REQUIRED AOBRestServer ART Token'
  },
  {
    names: ['slack-token'],
    type: 'string',
    env: 'SLACKSYNC_SLACK_TOKEN',
    helpArg: 'SLACK_TOKEN',
    help: 'REQUIRED Slack API Token'
  },
  {
    names: ['dry-run', 'd'],
    type: 'bool',
    help: 'Show what would happen but do not send API writes to Slack'
  }
]

export default options
