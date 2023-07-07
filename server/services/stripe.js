var config = require('../../config/config');
const stripe = require('stripe')(config.stripeSecretKey);
module.exports = stripe;
