"use strict";

var fs = require('fs');
var stackTrace = require('stack-trace');
var asyncEach = require('async-each');
var errTo = require('errto');
var prettifyError = require('prettify-error');
var ejs = require('ejs');
var sep = require('path').sep;
var hljs = require('highlight.js');

hljs.configure({ lineNodes: true });

var baseStyle = fs.readFileSync(__dirname + '/public/css/base-style.css', 'utf8');
var hljsStyle = fs.readFileSync(__dirname + '/public/css/hljs-molokai-sublime.css', 'utf8');
var errorTmpl = fs.readFileSync(__dirname + '/public/template.html', 'utf8');
errorTmpl = errorTmpl.replace('<%- hljsStyle %>', hljsStyle);
errorTmpl = errorTmpl.replace('<%- baseStyle %>', baseStyle);
var render = ejs.compile(errorTmpl);

module.exports = function(err, req, res, next) {
  var stack = stackTrace.parse(err);

  asyncEach(stack, function getContentInfo(line, cb) {
    // exclude core node modules and node modules
    if ((line.fileName.indexOf(sep) !== -1) && !/node_modules/.test(line.fileName)) {
      fs.readFile(line.fileName, 'utf-8', errTo(cb, function(content) {
        // replace \r\n with => \n for Windows compat and strip the \n from the end of the file
        // TODO: fix this inside hljs line code
        content = hljs.getHighlighted(content.replace(/\r\n/g, '\n').replace(/\n$/, ''), 'javascript').innerHTML;

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
  }, function(e, lines) {
    // remove empty data from the array (coming from the excluded lines)
    lines = lines.filter(function(line) { return !!line; });

    console.error(prettifyError(err) || err.stack);

    res.send(render({
      err: err,
      lines: lines
    }));
  });
};
