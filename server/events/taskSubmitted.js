module.exports = {
    name: 'task:submitted',
    emit: $data => {
      require('@config/events').emitter.emit('task:submitted', $data)
    }
}