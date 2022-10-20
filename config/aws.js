var AWS = require('aws-sdk');
var config = require('@config/config');
var credentials = new AWS.SharedIniFileCredentials({ profile: 'lomads' });

AWS.config = new AWS.Config();
AWS.config.credentials = credentials;
AWS.config.region = config.aws.region;

module.exports = AWS;