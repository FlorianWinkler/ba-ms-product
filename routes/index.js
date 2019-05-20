const express = require('express');
const router = express.Router();
const util = require("../src/util");

router.get('/', function(req, res, next) {
  res.send('NodeJS + Express läuft!');
});

router.get('/preparedb', function(req, res, next) {
  util.prepareDatabase();
  res.status(200).end();
});

module.exports = router;
