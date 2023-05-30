var cron = require('node-cron');
const { onOneMinuteCron, onThirtySecondsCron } = require('@events')

const schedule = () => {
    cron.schedule('* * * * *', () => {
        onOneMinuteCron.emit()
    });
    cron.schedule('*/30 * * * * *', () => {
        onThirtySecondsCron.emit()
    });
}

module.exports = schedule