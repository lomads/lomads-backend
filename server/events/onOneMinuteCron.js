module.exports = {
    name: 'cron:one-minute',
    emit: $data => {
      require('@config/events').emitter.emit('cron:one-minute', $data)
    }
}