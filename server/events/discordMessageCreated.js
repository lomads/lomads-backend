module.exports = {
    name: 'discord:MessageCreated',
    emit: $data => {
      require('@config/events').emitter.emit('discord:MessageCreated', $data)
    }
}