module.exports = {
    name: 'project:created',
    emit: $data => {
      require('@config/events').emitter.emit('project:created', $data)
    }
}