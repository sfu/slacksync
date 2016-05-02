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

function printUsageAndExit(exitCode=0) {
  /* global dedent */
  const help = parser.help({includeEnv: true, helpWrap: false})
  const helpstr = dedent`usage: slacksync [OPTIONS]
                         options:
                         ${help}
  `
  console.log(helpstr)
  process.exit(exitCode)
}

if (opts.all) {
  opts.create_users = true
  opts.delete_users = true
  opts.reactivate_users = true
}

const requiredArgMissing =  !opts.maillist ||
                            !opts.maillist_token ||
                            !opts.art_token ||
                            !opts.slack_token

if (opts.help) {
  printUsageAndExit(0)
}

if (requiredArgMissing) {
  console.log('Required option missing')
  printUsageAndExit(1)
}

if (opts.version) {
  console.log(`v${require('../package.json').version}`)
  process.exit(0)
}

slacksync(opts)
