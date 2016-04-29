const AOBREST_BASE = 'https://rest.its.sfu.ca/cgi-bin/WebObjects/AOBRestServer.woa/rest'
const MLREST_BASE = 'https://rest.maillist.sfu.ca'
const SLACK_REST_BASE = 'https://slack.com/api'
const SLACK_SCIM_BASE = 'https://api.slack.com/scim/v1'
const IGNORE_USERS = [
  'USLACKBOT',  // slackbot
  'U0HSJ3R1V',  //itsslack
  'U0H2PR1L3',  // kipling
  'U0HV8R2JY'   // ebronte
]

export {
  AOBREST_BASE,
  MLREST_BASE,
  SLACK_REST_BASE,
  SLACK_SCIM_BASE,
  IGNORE_USERS
}
