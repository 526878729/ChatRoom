/**
 * Created by Leo on 2016/2/17.
 */
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

//users array[], for save username
var users = [];
var userSocket = [];

app.use('/', express.static(__dirname + '/public'));
server.listen(3000);

io.sockets.on('connection', function (socket) {

  //listen 'login' event
  socket.on('login', function (nickname) {
    if (users.indexOf(nickname) > -1) {
      socket.emit('nickNameExisted');
    } else {
      //record users length before login success
      socket.userIndex = users.length;
      socket.nickname = nickname;
      users.push(nickname);

      userSocket.push(socket);

      console.log('有人登陆： ' + socket.nickname);
      //login success and run 'loginSuccess' event
      socket.emit('loginSuccess', nickname);
      //run system event to every clients for notice user login and records users online number
      io.sockets.emit('system', nickname, users.length, 'login');
    }
  });

  //broadcast user message
  socket.on('postMsg', function (msg, textColor) {
    console.log(socket.nickname + ": " + msg);
    socket.broadcast.emit('newMsg', socket.nickname, msg, textColor);
  });

  socket.on('shakeOther', function (name) {
    //console.log('=================' + name);
    //socket.broadcast.emit('shake');
    var sockets = userSocket;
    for (var i = 0; i < sockets.length; i++) {
      var s = sockets[i];
      if (s.nickname == name) {
        s.emit('shake');
      }
    }
  });
  //broadcast user image
  //socket.on('postImg', function (img, textColor){
  //    socket.broadcast.emit('newImg', socket.nickname, img, textColor);
  //});

  //when user leaves
  socket.on('disconnect', function () {
    //remove user's nickname
    users.splice(socket.userIndex, 1);
    console.log(socket.nickname + '离开了');
    socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
  });
});

