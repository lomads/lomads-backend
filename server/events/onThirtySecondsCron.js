module.exports = {
    name: 'cron:thirty-seconds',
    emit: $data => {
      require('@config/events').emitter.emit('cron:thirty-seconds', $data)
    }
}