const express = require('express');
const web3Auth = require('@server/services/web3Auth');
const router = express.Router(); // eslint-disable-line new-cap
const authCtrl = require('./auth.controller');

router.get('/me', web3Auth, (req, res) => {
  return res.status(200).json(req.user)
});

router.patch('/me', web3Auth, authCtrl.update);



module.exports = router;
