import test from 'ava'
import {getUserBio} from '../amaint'

test('get bio for a valid user should succeed', async t => {
  const response = await getUserBio('kipling', process.env.ART_TOKEN)
  t.is(response.username, 'kipling')
})

test('get bio for an invalid user should throw', async t => {
  const response = getUserBio('fakefakefake', process.env.ART_TOKEN)
  t.throws(response)
})
