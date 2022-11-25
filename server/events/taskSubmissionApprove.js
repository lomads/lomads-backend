module.exports = {
    name: 'task:member.submission.approve',
    emit: $data => {
      require('@config/events').emitter.emit('task:member.submission.approve', $data)
    }
}