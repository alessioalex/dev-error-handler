/* eslint-disable no-console, func-names */
'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var get = require('simple-get').concat;
var cheerio = require('cheerio');
var assert = require('assert');

var testsRan = false;
var childProc = spawn('node', [path.resolve(__dirname, '../examples/http')]);
var childErr = '';

childProc.stderr.on('data', function(d) { childErr += d; });
childProc.on('close', function(code) {
  if (!testsRan) {
    var errMsg = 'child process exited with code ' + code + '\n\n';
    errMsg += 'child process stderr: \n' + childErr;

    throw new Error(errMsg);
  }
});

var timeout = setTimeout(function() {
  throw new Error('timeout of 10 seconds exceeded');
}, 10000);

var test = function test() {
  get('http://127.0.0.1:7777/', function(err, data, res) {
    if (err) { throw err; }

    testsRan = true;
    clearTimeout(timeout);

    var $ = cheerio.load(data.toString('utf8'));

    assert(res.statusCode === 500, 'it should have a status code of 500');
    assert($('.detailed-stack li').length === 2, 'it should show the detailed stack');
    assert($('.full-stack li').length >= 10, 'it should show the full stack');

    clearTimeout(timeout);
    childProc.kill();

    console.log('all good');
  });
};

childProc.stdout.once('data', test);
