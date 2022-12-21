const Discord = require('discord.js');
const _ = require('lodash');
const wait = require("timers/promises").setTimeout;
const { memberJoinedDiscordServer, discordMessageCreated } = require('@events')

const {
    IntentsBitField,
    Partials,
  } = require("discord.js")

const client = new Discord.Client({
    shardCount: 3,
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildInvites,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.GuildMessageReactions,
      IntentsBitField.Flags.GuildPresences,
      IntentsBitField.Flags.DirectMessages,
      IntentsBitField.Flags.DirectMessageReactions,
      IntentsBitField.Flags.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    rest: {
      retries: 3,
      globalRequestsPerSecond: 50,
    },
  });

  
let invites = {};

const connect = () => {
    client.on('ready', async () => {
      console.log('The Bot is ready!')
      await wait(1000);
      client.guilds.cache.forEach(async (guild) => {
        const firstInvites = await guild.invites.fetch();
        invites[guild.id] = firstInvites.map(({ code, uses }) => { return { code, uses } })
      });
     });
     client.on("inviteDelete", (invite) => {
      //invites.get(invite.guild.id).delete(invite.code);
      if(invites[invite.guild.id]) {
        invites[invite.guild.id] = invites[invite.guild.id].filter(i => i.code !== invite.code)
      }
    });
    client.on("inviteCreate", (invite) => {
      if(invites[invite.guild.id])
        invites[invite.guild.id].push({ code: invite.code , uses: invite.uses })
      else
        invites[invite.guild.id] = [{ code: invite.code , uses: invite.uses }]
    });
    client.on("guildCreate", async (guild) => {
      const firstInvites = await guild.invites.fetch();
      invites[guild.id] = firstInvites.map(({ code, uses }) => { return { code, uses } })
    });
    
    client.on("guildDelete", (guild) => {
      delete invites[guild.id]
    });
    client.on('guildMemberAdd', async member => {
      const newInvites = await member.guild.invites.fetch()
      const oldInvites = invites[member.guild.id]
      const invite = newInvites.find(i => {
        return i.uses > _.get(_.find(oldInvites, oi => oi.code === i.code), 'uses', 0)
      });
      console.log("invite", invite)
      memberJoinedDiscordServer.emit({
        member, invite
      })
    });
    client.on("messageCreate", message => {
      const { guild_id, channel_id } = message;
      discordMessageCreated.emit({ guild_id, channel_id })
    })
    client.login(`MTA0OTcyNDc0MTMwNjU2NDY2OQ.Gy0JHN.NSofSPV53mR53X1m-zvd9IOkEQm7x05p3Iakg4`);
}

module.exports = { discordConnect: connect, client };