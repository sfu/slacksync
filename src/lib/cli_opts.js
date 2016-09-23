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
    names: ['dry-run', 'x'],
    type: 'bool',
    help: 'Report what *would* happen, but make no changes to Slack.'
  },
  {
    names: ['maillist'],
    type: 'arrayOfString',
    helpArg: 'LIST_ID',
    help: 'REQUIRED Numeric ID of the source maillist. May be repeated.'
  },
  {
    names: ['exclude-maillist'],
    type: 'string',
    env: 'SLACKSYNC_EXCLUDE_MAILLIST',
    helpArg: 'LIST_ID',
    help: 'A maillist containing users who should not be added to Slack'
  },
  {
    group: 'Authentication Tokens'
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
    group: 'Run Modes'
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
    group: 'Slack Reporter'
  },
  {
    names: ['reporter-channel'],
    type: 'string',
    help: 'Post results of the script to this slack channel'
  },
  {
    names: ['reporter-token'],
    type: 'string',
    help: 'Post to --reporter-channel using this token'
  }
]

export default options
