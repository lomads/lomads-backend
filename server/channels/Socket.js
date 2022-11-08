const Socket = {
    handle: $data => {
      return new Promise((resolve, reject) => {
        setTimeout(() => { console.info(log); resolve() }, 1000)
      })
    }
  }
  
  module.exports = Socket