module.exports = {
    name: 'discord:GuildRoleMemberUpdated',
    emit: $data => {
      require('@config/events').emitter.emit('discord:GuildRoleMemberUpdated', $data)
    }
}