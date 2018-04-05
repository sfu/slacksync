#!/usr/bin/env node

const dashdash = require('dashdash');
const options = require('./lib/cli_opts');
const slacksync = require('./slacksync');
const dedent = require('dedent-js');

const parser = dashdash.createParser({ options: options });
let opts;
try {
  opts = parser.parse(process.argv);
} catch (e) {
  console.error('slacksync: error: %s', e.message);
  process.exit(1);
}

function printUsageAndExit(exitCode = 0) {
  const help = parser.help({ includeEnv: true, helpWrap: false });
  const helpstr = dedent`usage: slacksync [OPTIONS]
                         options:
                         ${help}
  `;
  console.log(helpstr);
  process.exit(exitCode);
}

if (opts.all) {
  opts.create_users = true;
  opts.remove_users = true;
  opts.reactivate_users = true;
}

const requiredArgMissing =
  !opts.maillist ||
  !opts.maillist_token ||
  !opts.art_token ||
  !opts.slack_token;

if (opts.version) {
  console.log(`v${require('../package.json').version}`);
  process.exit(0);
}

if (opts.help) {
  printUsageAndExit(0);
}

if (requiredArgMissing) {
  console.log('Required option missing');
  printUsageAndExit(1);
}

slacksync(opts);
