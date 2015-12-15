/* eslint-disable no-console, func-names */
'use strict';
// comment

module.exports = function willThrowError() {
  require('asdasd');
  return new Error('sample error');
};
