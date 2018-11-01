const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const config = require('config');
const session = require('express-session');
const sessionStore = require('lib/sessionStore.js');

const index = require('./routes/index');
const login = require('./routes/login');
const logout = require('./routes/logout');
const chat = require('./routes/chat');


const app = express();


// view engine setup
app.engine('ejs', require('ejs-mate'));
app.set('views', path.join(__dirname, 'template'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser());

app.use(session({
secret:config.get('session:secret'),
    name: config.get('session:key'),
    cookie: config.get('session:cookie'),
    saveUnitialized:false,
    resave:false,
    store: sessionStore
}));

app.use(require("middleware/loadUser.js"));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/login', login);
app.use('/logout', logout);
app.use('/chat', chat);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {error: err});
});

module.exports = app;
