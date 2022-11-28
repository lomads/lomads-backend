module.exports = {
    name: 'task:deleted',
    emit: $data => {
      require('@config/events').emitter.emit('task:deleted', $data)
    }
}