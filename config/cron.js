var cron = require('node-cron');
const { onOneMinuteCron } = require('@events')

const schedule = () => {
    cron.schedule('* * * * *', () => {
        onOneMinuteCron.emit()
    });
}

module.exports = schedule