module.exports = {
    name: 'discord:GuildMemberAdded',
    emit: $data => {
      require('@config/events').emitter.emit('discord:GuildMemberAdded', $data)
    }
}