const channel = require('@channels')

const notify = notification => {
  return new Promise(async (resolve, reject) => {
    let results = []
    for (let index = 0; index < notification.via.length; index++) {
      const via = notification.via[index];
      if(!channel[via].handle){
        console.error(`${via} must implement handle method`)
        continue;
      }
      const response = await channel[via].handle(notification[via]())
      results.push({ [via]: response })
    }
    resolve(results)
  })
}

module.exports = notify