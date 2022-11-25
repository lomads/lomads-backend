module.exports = {
    name: 'task:created',
    emit: $data => {
      require('@config/events').emitter.emit('task:created', $data)
    }
}