# dev-error-handler

Error-handling Express middleware that displays syntax highlighted source code.
To be used in development only.

![pic](https://i.cloudup.com/R-TuJQXGkE-1200x1200.jpeg)

## Usage

```js
var errorHandler = require('dev-error-handler');
var express = require('express');
var app = express();
var ENV = process.env.NODE_ENV || 'development';

app.get('*', function(req, res, next) {
  return next(new Error('oh noess!'));
});

if (ENV === 'development') {
  app.use(errorHandler);
}

app.listen(process.env.PORT || 7777);
```

## Similar modules

- [debug-errorpage](https://github.com/nzakas/debug-errorpage)
- [express-error](https://github.com/barc/express-error)

## LICENSE

MIT
