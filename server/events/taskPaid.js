module.exports = {
    name: 'task:paid',
    emit: $data => {
      require('@config/events').emitter.emit('task:paid', $data)
    }
}