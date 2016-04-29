#!/usr/bin/env node
/* eslint no-console: 0 */

import dashdash from 'dashdash'
import options from './lib/cli_opts'
import slacksync from './slacksync'

const parser = dashdash.createParser({options: options})
let opts
try {
  opts = parser.parse(process.argv)
} catch (e) {
  console.error('slacksync: error: %s', e.message)
  process.exit(1)
}
const requiredArgMissing = !opts.maillist || !opts.maillist_token || !opts.art_token || !opts.slack_token

if (opts.help || requiredArgMissing) {
  const help = parser.help({includeEnv: true}).trimRight()
  console.log('usage: slacksync [OPTIONS]\n'
            + 'options:\n'
            + help)
  process.exit(0)
}

if (opts.version) {
  console.log(`v${require('../package.json').version}`)
}

slacksync(opts)
