const express = require('express');
const path = require('path');
var router = express.Router();
const _ = require('lodash');
var {Employee} = require(path.join('../','models','Employee'));
var {authenticate} = require('./middleware');
var bcrypt = require('bcryptjs');



module.exports = router;