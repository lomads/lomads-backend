//const Emittery = require('emittery');
const { EventEmitter } = require('events');
const mapper = require('@events/mapper')

const emitter = new EventEmitter();

const boot = () => {
  for (let $event in mapper) {
    let listeners = mapper[$event]
    for (let index = 0; index < listeners.length; index++) {
      const ev = require($event)
      const listener = require(listeners[index]);
      emitter.on(ev.name, listener.handle);
    }
  }
}

module.exports =  { boot, emitter }