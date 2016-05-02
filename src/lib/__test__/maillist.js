import test from 'ava'
import {getMaillist, getMaillistMembers} from '../maillist'

const {ML_TOKEN} = process.env

test('getting info about a valid list should succeed', async t => {
  const response = await getMaillist('65704', ML_TOKEN)
  t.is(response.id, 65704)
})

test('getting info for an invalid list should throw', async t => {
  const response = getMaillist('0000000', ML_TOKEN)
  t.throws(response)
})

test('getting members of valid list should succeed', async t => {
  const response = await getMaillistMembers('65704', ML_TOKEN)
  t.truthy(response.length > 0)
})

test('getting members of an invalid list should throw', async t => {
  const response = getMaillistMembers('0000000', ML_TOKEN)
  t.throws(response)
})
