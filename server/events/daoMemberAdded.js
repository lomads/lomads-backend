module.exports = {
    name: 'dao:member.added',
    emit: $data => {
      require('@config/events').emitter.emit('dao:member.added', $data)
    }
}