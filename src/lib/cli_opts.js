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
    type: 'arrayOfString',
    env: 'SLACKSYNC_MAILLIST_ID',
    helpArg: '12345',
    help: 'REQUIRED Numeric ID of the source maillist. May be repeated.'
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
    names: ['all', 'a'],
    type: 'bool',
    help: 'DEFAULT Run all operations (create, reactivate, delete). Same as -cdr'
  },
  {
    names: ['create-users', 'c'],
    type: 'bool',
    help: 'Create users in Slack'
  },
  {
    names: ['remove-users', 'd'],
    type: 'bool',
    help: 'Delete users from Slack'
  },
  {
    names: ['reactivate-users', 'r'],
    type: 'bool',
    help: 'Reactivate deleted users'
  },
  {
    names: ['dry-run', 'x'],
    type: 'bool',
    help: 'Dry run.'
  }
]

export default options
