"use strict";

var express = require('express');
var app = express();

var errorHandler = require('../');

var getSampleError = require('./sample-error');

app.use(function(req, res, next) {
  if (req.url === '/favicon.ico') { return res.end(); }

  next(getSampleError());
});

app.use(errorHandler);

app.listen(7777);
console.log('Awesome, now open %s in the browser for a demo!', 'http://localhost:7777')
