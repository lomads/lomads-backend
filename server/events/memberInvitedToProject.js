module.exports = {
    name: 'project:member.invited',
    emit: $data => {
      require('@config/events').emitter.emit('project:member.invited', $data)
    }
}