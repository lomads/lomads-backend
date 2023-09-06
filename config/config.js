const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();
const { SupportedChainId } = require('@config/constants');
// define validation for all the env vars
const envVarsSchema = Joi.object({
  BASE_URL: Joi.string().default('https://app.lomads.xyz/api'),
  NODE_ENV: Joi.string()
    .allow('development', 'production', 'test', 'provision', 'local')
    .default('development'),
  PORT: Joi.number()
    .default(8080),
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  JWT_SECRET: Joi.string().required()
    .description('JWT Secret required to sign'),
  MONGO_HOST: Joi.string().required()
    .description('Mongo DB host url'),
  MONGO_PORT: Joi.number()
    .default(27017),
  AWS_REGION: Joi.string()
    .default('eu-west-3'),
  S3_BUCKET_URL: Joi.string()
    .default('https://lomads-dao-development.s3.eu-west-3.amazonaws.com/'),
  S3_BUCKET: Joi.string()
    .default('lomads-dao-development'),
  AES_PASS_PHRASE: Joi.string()
    .default('lomads-dao'),
  STRIPE_SECRET_KEY: Joi.string()
    .default('sk_test_51IygwuJ1UZBlZwFTScX5uBfPeiMlWp8WJ9mBPGYabjlSlqXkxVDsFZnbchNWjnrtViBJiloUNy82mZDxjOFky0EP00m4vAFi1t')
}).unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongooseDebug: envVars.MONGOOSE_DEBUG,
  jwtSecret: envVars.JWT_SECRET,
  aesPassPhrase: envVars.AES_PASS_PHRASE,
  mongo: {
    host: envVars.MONGO_HOST,
    port: envVars.MONGO_PORT
  },
  aws: {
    region: envVars.AWS_REGION,
    s3BucketUrl: envVars.S3_BUCKET_URL,
    s3Bucket: envVars.S3_BUCKET
  },
  notion: {
    email: envVars.NOTION_ADMIN_EMAIL,
    password: envVars.NOTION_ADMIN_PASSWORD,
  },
  safe: {
    [`${SupportedChainId.POLYGON}`]: 'https://safe-transaction-polygon.safe.global',
    [`${SupportedChainId.GOERLI}`]: 'https://safe-transaction-goerli.safe.global'
  },
  discordBotToken: envVars.DISCORD_BOT_TOKEN,
  baseUrl: envVars.BASE_URL,
  baseUrlWithExt: envVars.BASE_URL_WITH_EXT,
  githubClientId: envVars.GITHUB_CLIENT_ID,
  githubClientSecret: envVars.GITHUB_CLIENT_SECRET,
  walletPrivateKey: envVars.WALLET_PRIVATE_KEY,
  walletPublicKey: envVars.WALLET_PUBLIC_KEY,
  infuraKey: envVars.INFURA_KEY,
  nftStorage: envVars.NFT_STORAGE,
  trelloApiKey: envVars.TRELLO_API_KEY,
  trelloSecret: envVars.TRELLO_SECRET,
  etherScanKey: envVars.ETHERSCAN_KEY,
  polyScanKey: envVars.POLYSCAN_KEY,
  celoScanKey: envVars.CELOSCAN_KEY,
  baseScanKey: envVars.BASESCAN_KEY,
  optScanKey: envVars.OPTSCAN_KEY,
  arbScanKey: envVars.ARBSCAN_KEY,
  avaxScanKey: envVars.AVAXSCAN_KEY,
  transakApiKey: envVars.TRANSAK_API_KEY,
  transakApiSecret: envVars.TRANSAK_API_SECRET,
  transakBaseUrl: envVars.TRANSAK_BASE_URL,
  bankPrivateKey: envVars.BANK_PRIVATE_KEY,
  bankPublicKey: envVars.BANK_PUBLIC_KEY,
  stripeSecretKey: envVars.STRIPE_SECRET_KEY
};

module.exports = config;
