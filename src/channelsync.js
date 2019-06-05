/**
 * handles keeping a slack channel in sync with a set of maillists
 * needs to determine if the channel is public or private
 *    public: channel.invite, channel.kick
 *    private: groups.invite, groups.kick
 * if the channel is private then the account belonging to the token has to be in it to win it
 */

const channelsInfo = require('slack/methods/channels.info');
const groupsInfo = require('slack/methods/groups.info');
const channelsInvite = require('slack/methods/channels.invite');
const groupsInvite = require('slack/methods/groups.invite');
const channelsKick = require('slack/methods/channels.kick');
const groupsKick = require('slack/methods/groups.kick');
