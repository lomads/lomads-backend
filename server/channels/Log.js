//FOR TESTING PURPOSE
const Log = {
    handle: log => {
      return new Promise((resolve, reject) => {
        // introducing fake delay
        setTimeout(() => { console.info(log); resolve() }, 1000)
      })
    }
  }
  
  module.exports = Log