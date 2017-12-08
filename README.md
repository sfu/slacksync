# `slacksync`

Sync SFU Maillists with a Slack team.

## Install :package:

With `npm`:

```
npm -g i slacksync
```

Or, with `yarn`:

```
yarn global add slacksync
```

## Usage 🚀

```
slacksync --maillist 12345 --slack-token xxxxx --art-token yyyyy --maillist-token zzzzz -a
```

## Options :star2:

The `slacksync` command accepts a number of options:

### `--dry-run, -x`
Print out what *would* happen, but don't actually write any changes to Slack.

### `--maillist` (REQUIRED)
You can pass an arbitrary number of maillists to use as sources of users. Pass the numeric ID of each list on their own `--maillist` option:

`slacksync --maillist 12345 --maillist 98765`

### Authentication Tokens
Three different authentication tokens are required to make this whole bundle of duct tape work:

#### `--slack-token` (REQUIRED)
A token for an admin user in your Slack team with the ability to create/modify/delete accounts. This token must be generated from the [Slack Test Token Generator Page](https://api.slack.com/docs/oauth-test-tokens).

The token may also be passed in an environment variable: `SLACKSYNC_SLACK_TOKEN`

#### `--maillist-token` (REQUIRED)
A permanent maillist token with rights to query information about the list(s) provided in the `--maillist` argument(s).

The token may also be passed in an environment variable: `SLACKSYNC_MLTOKEN`

#### `--art-token` (REQUIRED)
An ART token with the ability to query `/rest/datastore2/global/userBio`.

The token may also be passed in an environment variable `SLACKSYNC_ART_TOKEN`

### Run Modes
`slacksync` can run in three modes. You must provide at least one of these, or pass `-a | --all` to run all three.

#### `--create_users, -c`
Create new Slack users based on the membership of the maillist(s) specified in `--maillist`.

#### `--remove-users, -d`
Remove (deactivate) Slack users who no longer appear in the membership of the maillist(s) specified in `--maillist`.

#### `--reactivate-users, -r`
Reactivate deleted users who have re-appeared in the membership of the maillist(s) specified in `--maillist`.

#### `--all, -a`
Same as passing `-cdr` or `--create-users --remove-users, --reactivate-users`.

### Reporting

![Image of slacksync reporting into a Slack channel](http://i.imgur.com/XHWNLeh.png)

`slacksync` prints JSON output to stdout. You can also have it post a summary into a Slack channel by passing the following two options:

#### `--reporter-channel`
The name of the Slack channel to post into.

#### `--reporter-token`
A token for a bot user to post as. Create a bot user, and configure it to post into your channel.


## A note about maillists :envelope:

`slacksync` determines what members should be added to Slack by getting the membership of any maillists that you pass to it. It uses the following criteria to determine if a maillist member is eligible for a Slack account:

* Lists are not expanded. That is, only direct members of the parent list are eligible. Members of child lists are ignored.
* If the list is a standard, static list (members are manually managed by the owner/manager), any SFU member is eligible. Non-SFU members are ignored.
* If the list is a dynamically-generated list (but not a courselist or academic plan list), **only SFU auto-added members of the list** are eligible. Members who were manually added are ignored.
* If the list is a courselist or academic plan list: good luck. This hasn't been tested.

If you pass multiple maillists to `slacksync`, it will fetch the members of each list, apply the above criteria, and then unique the membership lists.

## Programmatic Usage :computer:

You can use `slacksync` programmatically in another program by installing it within your project, requiring it and calling the `slacksync()` function with an options object. The keys of the options object are similar to the long-form CLI arguments, with dashes (`-`) replaced with underscores (`_`)

```
npm i --save slacksync

// in your project
import slacksync from 'slacksync'

slacksync({
  slack_token: 'xxxx',
  art_token: 'yyyy',
  maillist_token: 'zzzz',
  maillist: [12345, 98765],
  all: true,
  dry_run: true
})
```
