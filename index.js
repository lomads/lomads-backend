require('module-alias/register');
const mongoose = require('mongoose')
const util = require('util')

// config should be imported before importing any other file
const config = require('@config/config');
const events = require('@config/events');
const app = require('@config/express');

const schedule = require('@config/cron')

const debug = require('debug');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

//const discordConnect = require('./config/discord-ws');
const { discordConnect } = require('./config/discord');

// connect to mongo db
const mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, keepAlive: 1, useFindAndModify: true });
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env
if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug('lomads-dao:backend:index')(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
  });
}

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.port
  app.listen(config.port, () => {
    events.boot();
    discordConnect();
    //schedule();
    console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
  });
}

module.exports = app;
