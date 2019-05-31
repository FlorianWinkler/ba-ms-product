const express = require('express');
const router = express.Router();
const util = require("../src/util");

router.get('/', function(req, res, next) {
  res.send('NodeJS + Express läuft!');
});


module.exports = router;
