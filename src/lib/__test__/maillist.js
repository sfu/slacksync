import test from 'ava'
import {getMaillistMembers} from '../maillist'

const {ML_TOKEN} = process.env

test('getting members of valid list should succeed', async t => {
  const response = await getMaillistMembers('65704', ML_TOKEN)
  t.truthy(response.length > 0)
})

test('getting members of an invalid list should throw', async t => {
  const response = getMaillistMembers('0000000', ML_TOKEN)
  t.throws(response)
})
