const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path')
const cookieParser = require('cookie-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const httpStatus = require('http-status');
const expressWinston = require('express-winston');
const expressValidation = require('express-validation');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit')
const perfectExpressSanitizer = require("perfect-express-sanitizer");
const winstonInstance = require('./winston');
const shareRoutes = require('@root/server/modules/share/share.route');
const routes = require('@root/index.route');
const config = require('@config/config');
const APIError = require('@server/helpers/APIError');
var cron = require('node-cron');

const limiter = rateLimit({
	windowMs: 1000, // 1 second
	max: 15, // Limit each IP to 15 requests per `window` (here, per 1 second)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const app = express();

app.set('view engine', 'ejs');
//app.set('views', path.join(__dirname, 'views'));

if (config.env === 'development') {
  app.use(logger('dev'));
}

app.use(function (req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'"
  );
  next();
});

app.use(perfectExpressSanitizer.clean({ xss: true,  noSql: true,  sql: true, level: 2 }));

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(compress());
app.use(methodOverride());
app.use(limiter)

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());
app.options('*', cors())

// enable detailed API logging in dev env
// if (config.env === 'development') {
//   expressWinston.requestWhitelist.push('body');
//   expressWinston.responseWhitelist.push('body');
//   app.use(expressWinston.logger({
//     winstonInstance,
//     meta: true, // optional: log meta data about request (defaults to true)
//     msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
//     colorStatus: true // Color the status code (default green, 3XX cyan, 4XX yellow, 5XX red).
//   }));
// }

app.use('/', shareRoutes)

// mount all routes on /api path
app.use('/v1', routes);

app.use(express.static('public'))

// if error is not an instanceOf APIError, convert it.
app.use((err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    // validation error contains errors which is an array of error each containing message[]
    const unifiedErrorMessage = err.errors.map(error => error.messages.join('. ')).join(' and ');
    const error = new APIError(unifiedErrorMessage, err.status, true);
    return next(error);
  } else if (!(err instanceof APIError)) {
    const apiError = new APIError(err.message, err.status, err.isPublic);
    return next(apiError);
  }
  return next(err);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new APIError('API not found', httpStatus.NOT_FOUND);
  return next(err);
});

// log error in winston transports except when executing test suite
// if (config.env !== 'test') {
//   app.use(expressWinston.errorLogger({
//     winstonInstance
//   }));
// }

// error handler, send stacktrace only during development
app.use((err, req, res, next) => // eslint-disable-line no-unused-vars
  res.status(err.status).json({
    message: err.isPublic ? err.message : httpStatus[err.status],
    stack: config.env === 'development' ? err.stack : {}
  })
);

module.exports = app;
