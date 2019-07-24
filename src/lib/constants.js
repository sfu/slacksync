const AOBREST_BASE =
  'https://rest.its.sfu.ca/cgi-bin/WebObjects/AOBRestServer.woa/rest';
const MLREST_BASE = 'https://rest.maillist.sfu.ca';
const SLACK_REST_BASE = 'https://slack.com/api';
const SLACK_SCIM_BASE = 'https://api.slack.com/scim/v1';
const SLACK_ADMIN_URL = 'https://sfuits.slack.com/?redir=%2Fadmin';
const SLACK_USER_INVITE_API = 'https://sfuits.slack.com/api/users.admin.invite';
const SLACK_USER_SET_RESTRICTED_API =
  'https://sfuits.slack.com/api/users.admin.setRestricted';
const SLACK_USER_SET_REGULAR_API =
  'https://sfuits.slack.com/api/users.admin.setRegular';
const IGNORE_USERS = ['USLACKBOT', 'itsslack'];
const SLACK_INVITE_ERRORS = {
  already_invited:
    'Has already been invited to Slack but has not yet accepted the invitation',
  already_in_team:
    'Already exists in Slack; they should be removed from the maillist'
};

module.exports = {
  AOBREST_BASE,
  MLREST_BASE,
  SLACK_REST_BASE,
  SLACK_SCIM_BASE,
  IGNORE_USERS,
  SLACK_ADMIN_URL,
  SLACK_USER_INVITE_API,
  SLACK_USER_SET_RESTRICTED_API,
  SLACK_USER_SET_REGULAR_API,
  SLACK_INVITE_ERRORS
};
