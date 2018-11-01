const config = require('../config');
const sessionStore  = require('../lib/sessionStore');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const User = require('../models/user').User;
const debug = require('debug')('chat:socketio');
const createError = require('http-errors');

var loadUser = function(session){
    return new Promise((resolve, reject) =>{
        if (!session.user) {
            debug("Session %s is anonymous", session.id);
            reject();
        }

        debug("retrieving user ", session.user);

        User.findById(session.user).exec((err, user) => {
            if (err) return reject();
            if (!user) reject();

            debug("user findbyId result: " + user);
            resolve(user);
        });
    });
};

var checkAuth = (handshake, callback) => {
    handshake.cookies = cookie.parse(handshake.headers.cookie || '');
    var sidCookie = handshake.cookies[config.get('session:key')];
    var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));

    sessionStore.get(sid, (err, session) => {
        debug(session);
        if(!session){
            callback(createError(401, 'No session'));
        }

        handshake.session = session;
        handshake.session.sid = sid;

        loadUser(session)
            .then((user) =>{
                handshake.user = user;
                callback(null, true);
            })
            .catch((err) =>{
                if(err){
                    callback(err);
                    return;
                }
                callback(createError(403, 'Anonymous session may not connect'));
            });
    });
};

var socket = (server) =>{

    var io = require('socket.io')(server);
    //io.set('origins', 'localhost:*');

    io.use((socket, next) => {
        checkAuth(socket.handshake, (err, success) => {
            if (success) return next();
            next(createError(403, 'Anonymous session may not connect'));
        });
    });

    io.on('sessreload', (sid) => {
      io.sockets.clients((err, clients) => {
          if (err) throw err;

          clients.forEach(function(clientID){
              var client = io.sockets.sockets[clientID];

              if(client.handshake.session.sid != sid)return;

              sessionStore.get(sid, (err, session) => {
                  if (err) {
                      client.emit("error", "server error");
                      client.disconnect();
                      return;
                  }

                  if(!session) {
                      client.emit("logout");
                      client.disconnect();
                      return;
                  }

                  client.handshake.session = session;
              });
          });
      });
    });

    io.on('connection', function(socket){
        var username = socket.handshake.user.get('username');

        socket.broadcast.emit('join', username);

        socket.on('message', function (text, callback){
            socket.broadcast.emit('message', username,  text);
            callback && callback();
        });

        socket.on('disconnect', function () {
            socket.broadcast.emit('leave', username);
        });
    });

    return io;

};

module.exports = socket;


