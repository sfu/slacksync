import test from 'ava'
import * as slack from '../slack'
const {SLACK_TOKEN} = process.env

test.after(async () => {
  // make sure that kipling is disabled, for reals
  await slack.toggleUserActive('U0H2PR1L3', false, SLACK_TOKEN)
})

test('Get a list of slack users', async t => {
  const response = await slack.getUserList(SLACK_TOKEN)
  t.is(response.ok, true)
  t.truthy(response.members.length > 0)
})

test('Toggle a user to inactive', async t => {
  const response = await slack.toggleUserActive('U0H2PR1L3', false, SLACK_TOKEN)
  t.is(response.active, false)
})

test('Toggle a user to active', async t => {
  const response = await slack.toggleUserActive('U0H2PR1L3', true, SLACK_TOKEN)
  t.is(response.active, true)
})

test.skip('Create a user', async t => {
  const userName = `avatest${Date.now()}`
  const user = {
    userName,
    name: {
      givenName: 'Test',
      familyName: 'User'
    },
    emails: [{
      value: `hello@grahamballantyne.com`,
      primary: true
    }]
  }
  const response = await slack.createUser(user, SLACK_TOKEN)
  t.truthy(response.id) // should have a user id
  t.is(response.userName, userName)
  
  // deactivate the user
  await slack.toggleUserActive(response.id, false, SLACK_TOKEN)
  
})
