const { client } = require('@config/discord');
const { ChannelType } = require("discord.js");
const _ = require('lodash')

const getMissingPermissions = (bot) => [
    {
      name: "VIEW_CHANNEL",
      value: bot.permissions.has("ViewChannel"),
    },
    {
      name: "MANAGE_CHANNELS",
      value: bot.permissions.has("ManageChannels"),
    },
    {
      name: "MANAGE_ROLES",
      value: bot.permissions.has("ManageRoles"),
    },
    {
      name: "CREATE_INSTANT_INVITE",
      value: bot.permissions.has("CreateInstantInvite"),
    },
    {
      name: "SEND_MESSAGES",
      value: bot.permissions.has("SendMessages"),
    },
    {
      name: "EMBED_LINKS",
      value: bot.permissions.has("EmbedLinks"),
    },
    {
      name: "ADD_REACTIONS",
      value: bot.permissions.has("AddReactions"),
    },
    {
      name: "USE_EXTERNAL_EMOJIS",
      value: bot.permissions.has("UseExternalEmojis"),
    },
    {
      name: "Read Message History",
      value: bot.permissions.has("ReadMessageHistory"),
    },
  ];

const hasNecessaryPermissions = async (guildId) => {
    const guild = await getGuild(guildId)
    const bot = guild.members.me;
    console.log(bot)
    const botPermissions = getMissingPermissions(bot);
    if (botPermissions.some((bp) => !bp.value)) {
      const errorMessage = botPermissions
        .filter((p) => !p.value)
        .map((p) => p.name)
        .join(", ");
      throw new Error(
        `Missing permissions! You should grant the following permission(s) for our bot to work properly: ${errorMessage}`
      );
    }
    return true;
  };

  const createChannelInvite = async (guildId, channelId) => {
    const guild = await getGuild(guildId)
    const invite = await guild.invites.create(channelId, { maxAge: 0 });
    return invite.code;
  }

  const checkInviteChannel = async (server, inviteChannelId) => {
    let channelId;
    const channels = await server.channels.fetch();
    if (
      inviteChannelId &&
      channels
        .filter(
          (c) =>
            c.type === ChannelType.GuildText ||
            c.type === ChannelType.GuildAnnouncement
        )
        .find((c) => c.id === inviteChannelId)
    ) {
      channelId = inviteChannelId;
    } else {
      // find the first channel which is visible to everyone
      const publicChannel = server.channels.cache.find(
        (c) =>
          c.isTextBased() &&
          !c.permissionOverwrites?.cache.some(
            (po) =>
              po.id === server.roles.everyone.id && po.deny.any("ViewChannel")
          )
      );
  
      if (publicChannel) {
        channelId = publicChannel.id;
      } else {
        // if there are no visible channels, throwing an error
        throw new Error(
          `Cannot find public channel in the ${server.name} discord server. Guild.xyz bot needs at least one channel for creating invites. `
        );
      }
    }
  
    return channelId;
  };

const getGuild = async (guildId) => {
    let guild = null;
    guild = client.guilds.cache.get(guildId);
    if(!guild)
        guild = await client.guilds.fetch(guildId);
    return guild
}

const getGuildRoles = async (guildId) => {
    const guild = await client.guilds.fetch(guildId);
    const roles = guild.roles.cache.map(r => r)
    return roles
}

const getGuildMembers = async (guildId) => {
  const guild = await client.guilds.fetch(guildId);
  const members = guild.members.cache.map(m => m)
  return members
}

const getGuildMember = async (guildId, memberId) => {
  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(memberId)
  return member
}

const createGuildRole = async (guildId, name) => {
    const guild = await client.guilds.fetch(guildId);
    return await guild.roles.create({ name })
}

const attachRole = async (guildId, roleId, member) => {
  const roles = await getGuildRoles(guildId)
  const role = _.find(roles, r => r.id === roleId)
  if(role)
    return await member.roles.add(roleId)
}

const memberHasRole = async (guildId, memberId, roleId) => {
  const member = await getGuildMember(guildId, memberId)
  console.log(member)
  if(member)
    return await member.roles.cache.has(roleId)
}

const attachGuildMemberRole = async (guildId, memberId, roleId) => {
  const member = await getGuildMember(guildId, memberId)
  if(member)
    return await member.roles.add(roleId)
}

module.exports = {
    hasNecessaryPermissions,
    getGuild,
    getGuildRoles,
    createChannelInvite,
    createGuildRole,
    attachRole,
    memberHasRole,
    attachGuildMemberRole,
    getGuildMembers
}