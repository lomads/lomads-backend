module.exports = {
    name: 'alert:mintSuccess',
    emit: $data => {
      require('@config/events').emitter.emit('alert:mintSuccess', $data)
    }
}