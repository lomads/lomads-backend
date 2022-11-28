module.exports = {
    name: 'task:member.submission.rejected',
    emit: $data => {
      require('@config/events').emitter.emit('task:member.submission.rejected', $data)
    }
}