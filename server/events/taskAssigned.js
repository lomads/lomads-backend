module.exports = {
    name: 'task:member.assigned',
    emit: $data => {
      require('@config/events').emitter.emit('task:member.assigned', $data)
    }
}