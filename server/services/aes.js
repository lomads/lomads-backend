const AES = require('crypto-js/aes');
const Utf8 = require('crypto-js/enc-utf8');
const config = require('@config/config');

const encrypt = (text) => {
  return AES.encrypt(text, config.aesPassPhrase).toString();
};

const decrypt = (ciphertext) => {
  const bytes = AES.decrypt(ciphertext, config.aesPassPhrase);
  const originalText = bytes.toString(Utf8);
  return originalText;
};

module.exports = { encrypt, decrypt }