var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cluster = require('cluster');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let requestCount = 0;

app.use((req, res, next) => {
  next();
  console.log(`${(new Date().toISOString())} (PID ${process.pid}) ${req.hostname} ${req.method} ${req.originalUrl}`);

  // notifica al master de del número de peticiones recibidas
  requestCount++;
  const mem = process.memoryUsage().heapTotal / 1024 / 1024 + 'mb';
  if (cluster.isWorker) {
    process.send({cmd: 'info', data: {requestCount, mem}});
  }
});

app.use('/', require('./routes/index'));

if (cluster.isWorker) {
  app.use('/local', require('./routes/local'));
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
