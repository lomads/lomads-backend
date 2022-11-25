module.exports = {
    name: 'project:deleted',
    emit: $data => {
      require('@config/events').emitter.emit('project:deleted', $data)
    }
}