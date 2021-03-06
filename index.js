/* eslint-disable no-console, func-names */
'use strict';

var fs = require('fs');
var stackTrace = require('stack-trace');
var mapAsync = require('tiny-map-async');
var errTo = require('errto');
var PrettyError = require('pretty-error');
var ejs = require('ejs');
var sep = require('path').sep;
var hljs = require('highlight.js');
var notifier = require('node-notifier');

if (process.env.NODE_ENV === 'production') {
  throw new Error('dev-error-handler shouldn\'t be used in production');
}

hljs.configure({ lineNodes: true });

var baseStyle = fs.readFileSync(__dirname + '/public/css/base-style.css', 'utf8');
var hljsStyle = fs.readFileSync(__dirname + '/public/css/hljs-molokai-sublime.css', 'utf8');
var errorTmpl = fs.readFileSync(__dirname + '/public/template.html', 'utf8');
errorTmpl = errorTmpl.replace('<%- hljsStyle %>', hljsStyle);
errorTmpl = errorTmpl.replace('<%- baseStyle %>', baseStyle);
var render = ejs.compile(errorTmpl);

/* eslint-disable no-unused-vars */
module.exports = function(err, req, res, next) {
/* eslint-enable no-unused-vars */
  var stack = stackTrace.parse(err);

  // exclude native stuff, for ex:
  // at Array.forEach (native)
  stack = stack.filter(function(line) { return !line.native; });

  mapAsync(stack, function getContentInfo(line, cb) {
    var fileName = line.fileName;
    var isNotNodeCore = (fileName.indexOf('internal' + sep) === -1) && (fileName.indexOf(sep) !== -1);
    var isNotModule = !/node_modules/.test(fileName);

    // exclude core node modules and node modules
    if (isNotNodeCore && isNotModule) {
      fs.readFile(line.fileName, 'utf-8', errTo(cb, function(data) {
        // replace \r\n with => \n for Windows compat and strip the \n from the end of the file
        // TODO: fix this inside hljs line code
        var content = hljs.getHighlighted(data.replace(/\r\n/g, '\n').replace(/\n$/, ''), 'javascript').innerHTML;

        var start = line.lineNumber - 5;
        if (start < 0) { start = 0; }
        var end = line.lineNumber + 4;
        var snippet = content.split('\n').slice(start, end);

        var errIndex = (snippet.length < 9) ? (line.lineNumber - start - 1) : (snippet.length - 5);

        // decorate the error line
        snippet[errIndex] = snippet[errIndex].replace('class="line"', 'class="error-line line"');

        line.startAt = start;
        line.content = snippet.join('\n');

        cb(null, line);
      }));
    } else {
      cb();
    }
  }, function(e, lns) {
    if (e) {
      console.error('something went bad when generating the detailed stack trace');
      console.error('please open a github issue for dev-error-handler with the following data: ');
      console.error('Error message: ' + e.message);
      console.error('Parsed stack: \n' + err.stack);
    }

    var lines = lns || [];
    // remove empty data from the array (coming from the excluded lines)
    lines = lines.filter(function(line) { return !!line; });

    // pretty print in the terminal
    console.error((new PrettyError).render(err) || err.stack);

    // bypass for e2e testing
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      // send OS notification
      notifier.notify({
        title: 'Error in ' + req.method + ' ' + req.url,
        message: err.message
      });
    }

    res.writeHead(500, { 'Content-Type': 'text/html' });

    res.end(render({
      err: err,
      lines: lines
    }));
  });
};
