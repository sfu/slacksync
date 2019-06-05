/**
 * handles keeping a slack channel in sync with a set of maillists
 * needs to determine if the channel is public or private
 *    public: channel.invite, channel.kick
 *    private: groups.invite, groups.kick
 * if the channel is private then the account belonging to the token has to be in it to win it
 */

const Slack = require('slack');
const { getMaillistMembers } = require('./lib/maillist');

const getChannelType = async (client, channel) => {
  try {
    // try for public channel first
    await client.channels.info({ channel });
    return 'PUBLIC';
  } catch (error) {
    // try for private channel first:
    if (error.message === 'method_not_supported_for_channel_type') {
      try {
        await client.groups.info({ channel });
        return 'PRIVATE';
      } catch (error) {
        throw error;
      }
    } else {
      // otherwise throw the error
      throw error;
    }
  }
};

const getChannelMembers = async (client, channel) => {
  try {
    const channelType = await getChannelType(client, channel);
    if (channelType === 'PUBLIC') {
      const info = await client.channels.info({ channel });
      return info.channel.members;
    } else {
      const info = await client.groups.info({ channel });
      return info.group.members;
    }
  } catch (error) {
    throw error;
  }
};

const getSlackUsers = async client => {
  try {
    const result = await client.users.list();
    return result.members;
  } catch (error) {
    throw error;
  }
};

const inviteUser = async (client, user, channel) => {
  try {
    const channelType = await getChannelType(client, channel);
    const subject = channelType === 'PUBLIC' ? 'channels' : 'groups';
    const result = await client[subject].invite({ channel, user });
    return result;
  } catch (error) {
    throw error;
  }
};

const kickUser = async (client, user, channel) => {
  try {
    const channelType = await getChannelType(client, channel);
    const subject = channelType === 'PUBLIC' ? 'channels' : 'groups';
    const result = await client[subject].kick({ channel, user });
    return result;
  } catch (error) {
    throw error;
  }
};

const channelsync = async opts => {
  try {
    const {
      slack_token: token,
      slack_token_owner: botUser,
      channel,
      maillist: maillists
    } = opts;
    const slackClient = new Slack({ token });

    // get all slack users
    const slackUsers = await getSlackUsers(slackClient);

    // get channel members -- array of user IDs
    const channelMembersIds = await getChannelMembers(slackClient, channel);
    // convert to array of user objects
    const channelMembers = channelMembersIds.map(id =>
      slackUsers.find(u => u.id === id)
    );
    const channelMembersEmailAddresses = channelMembers.map(
      m => m.profile.email
    );

    // get consolidated, uniq'd list of maillist members
    const listMembersRaw = [];
    for (const list of maillists) {
      const result = await getMaillistMembers(list, opts.maillist_token);
      listMembersRaw.push(
        result
          .filter(m => m.type === 3)
          .map(m => `${m.canonicalAddress}@sfu.ca`)
      );
    }
    const maillistMembersAddresses = [
      ...new Set([].concat.apply([], listMembersRaw))
    ];

    // users to add to channel
    // maillist members who are not in the channel list
    const usersToInvite = maillistMembersAddresses
      .filter(address => !channelMembersEmailAddresses.includes(address))
      .map(address => slackUsers.find(u => u.profile.email === address))
      .filter(Boolean);

    // users to kick from the channel
    // channel members who are not in the maillist members list
    // need to handle the token user's account
    const usersToKick = channelMembers.filter(member => {
      // don't kick out the bot user -- necessary for private channels
      if (botUser && member.id === botUser) return false;
      if (!maillistMembersAddresses.includes(member.profile.email)) {
        return true;
      } else {
        return false;
      }
    });

    console.log({ usersToInvite });
    console.log({ usersToKick });
    // invite users
    for (const { id } of usersToInvite) {
      console.log(`Inviting user ${id} to channel ${channel}`);
      const result = await inviteUser(slackClient, id, channel);
      console.log(result);
    }

    // kick users
    for (const { id } of usersToKick) {
      console.log(`Kicking user ${id} from channel ${channel}`);
      const result = await kickUser(slackClient, id, channel);
      console.log(result);
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = channelsync;
