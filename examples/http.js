/* eslint-disable no-console, func-names */
'use strict';

var http = require('http');
var errorHandler = require('../');

var getSampleError = require('./sample-error');

http.createServer(function onRequest(req, res) {
  if (req.url === '/favicon.ico') { return res.end(); }

  try {
    getSampleError();
  } catch (err) {
    errorHandler(err, req, res);
  }
}).listen(7777);

console.log('Awesome, now open %s in the browser for a demo!', 'http://localhost:7777');
