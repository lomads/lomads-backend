module.exports = {
    name: 'project:member:removed',
    emit: $data => {
      require('@config/events').emitter.emit('project:member:removed', $data)
    }
}