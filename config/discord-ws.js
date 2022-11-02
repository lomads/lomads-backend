
const WebSocket = require('ws'); // npmjs.org/ws
const zlib = require('zlib-sync'); // npmjs.org/zlib-sync
const erlpack = require('erlpack'); // github.com/discordapp/erlpack
const os = require('os') // from node "standard library"
const { discordMessageCreated } = require('@events')

const connect = () => {
// https://discordapi.com/topics/gateway#gateway-opcodespayloads
const OPCodes = {
    HEARTBEAT: 1,
    IDENTIFY: 2,
    HELLO: 10,
    HEARTBEAT_ACK: 11,
  };
  
  // zlib inflate context for zlib-stream
  const inflate = new zlib.Inflate({
    chunkSize: 65535,
    flush: zlib.Z_SYNC_FLUSH,
  });
  
  // create websocket (technically you should perform a GET to /api/gateway and use the response)
  const ws = new WebSocket('wss://gateway.discord.gg/?v=6&encoding=etf&compress=zlib-stream');
  
  // sequence used for sessions and heartbeats
  let sequence = 0;
  
  function send(op, d) {
    ws.send(erlpack.pack({ op, d }));
  }
  
  ws.onmessage = ({ data }) => {
    const l = data.length;
    // if data.length >= 4 and data ends with Z_SYNC_FLUSH constant
    const flush = l >= 4 &&
      data[l - 4] === 0x00 &&
      data[l - 3] === 0x00 &&
      data[l - 2] === 0xFF &&
      data[l - 1] === 0xFF;
  
    inflate.push(data, flush && zlib.Z_SYNC_FLUSH);
  
    if (!flush) return;
  
    // parse packet with erlpack after its inflated
    const packet = erlpack.unpack(inflate.result);
  
    // keep track of sequence for heartbeats
    if (packet.s) sequence = packet.s;
  
    // handle gateway ops
    switch (packet.op) {
      case OPCodes.HELLO:
        // set heartbeat interval
        setInterval(() => send(OPCodes.HEARTBEAT, sequence), packet.d.heartbeat_interval);
        // https://discordapi.com/topics/gateway#gateway-identify
        send(OPCodes.IDENTIFY, {
          // you should put your token here _without_ the "Bot" prefix
          token: `MTAzNjUxMDA0MTI4NjYzOTY1Ng.G0uJ7N.ufvt5XOLRq4RKG_caFGcAhvAqe4ehqQjxHdtW0`,
          properties: {
            $os: process.platform,
            $browser: 'node.js',
            $device: os.type(),
          },
          compress: false,
        });
    }
  
    // handle gateway packet types
    if (!packet.t) return;
    switch (packet.t) {
      // we should get this after we send identify
      case 'READY':
          console.log('discord-ws:ready');
          break;
      case 'MESSAGE_CREATE':
          const { guild_id, channel_id } = packet.d;
          discordMessageCreated.emit({ guild_id, channel_id })
          break;
    }
  };
  
  ws.onopen = () => console.log('websocket opened!');
  ws.onclose = ws.onerror = (e) => {
    console.log(e);
    connect();
  };
}

module.exports = connect;