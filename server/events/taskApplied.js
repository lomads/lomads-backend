module.exports = {
    name: 'task:member.applied',
    emit: $data => {
      require('@config/events').emitter.emit('task:member.applied', $data)
    }
}