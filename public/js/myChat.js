/**
 * Created by Leo on 2016/3/10.
 */
//var fs = require('fs');
window.onload = function () {
  var myChat = new MyChat();
  myChat.init();
};

var MyChat = function () {
  this.socket = null;
};

MyChat.prototype = {
  getSocket: function () {
    return this.socket;
  },

  init: function () {
    var that = this;

    $(document).ready(function () {

      context.init({preventDoubleContext: false});

      context.settings({compress: true});


      context.attach('.usermenu', [
        {header: 'Chatroom Menu'},
        {
          text: 'Shake', action: function (name) {
          //e.preventDefault();
          //context.destroy('html');
          //var username = context.username;
          console.log("click shake: " + name);
          //that.socket.emit('shakeOther', name);
        }
        }
      ]);


      $(document).on('mouseover', '.me-codesta', function () {
        $('.finale h1:first').css({opacity: 0});
        $('.finale h1:last').css({opacity: 1});
      });

      $(document).on('mouseout', '.me-codesta', function () {
        $('.finale h1:last').css({opacity: 0});
        $('.finale h1:first').css({opacity: 1});
      });

    });


    this.socket = io.connect();
    this.socket.on('connect', function () {
      //if connect, show something in html
      document.getElementById('info').textContent = '设置我的昵称~';
      document.getElementById('nickWrapper').style.display = 'block';
      document.getElementById('nicknameInput').focus();
    });

    //listen 'newMsg' event, run when other user send message
    this.socket.on('newMsg', function (nickname, msg, textColor) {
      that._showMessage(nickname, msg, textColor);
    });

    //listen shake event, run when other user click shake button
    this.socket.on('shake', function () {
      $('#room').addClass('shake');
      setTimeout(function () {
        $('#room').removeClass('shake');
      }, 6500);
    });

    //listen 'newImg' event, run when other user send a picture
    //this.socket.on('newImg', function (nickname, img, textColor) {
    //    that._showImage(nickname, img, textColor);
    //});

    //listen 'nicknameinput' input and  'loginBtn' button click event
    document.getElementById('loginBtn').addEventListener('click', function () {
      var nickname = document.getElementById('nicknameInput').value;
      if (nickname.trim().length != 0) {
        //run login event
        that.socket.emit('login', nickname);
      } else {
        document.getElementById('info').textContent = '请给您自己起一个昵称~!';
        document.getElementById('nicknameInput').focus();
      }
    }, false);

    this._initialExpression();

    //listen send expression event when user click 'expressionBtn' button
    document.getElementById('expressionBtn').addEventListener('click', function (e) {
      var expressionWrapper = document.getElementById('expressionWrapper');
      expressionWrapper.style.display = 'block';
      e.stopPropagation();
    }, false);

    //listen click event when user click body expect click expression-wrapper
    document.body.addEventListener('click', function (e) {
      var expressionWrapper = document.getElementById('expressionWrapper');
      if (e.target != expressionWrapper) {
        expressionWrapper.style.display = 'none';
      }
    });

    document.getElementById('expressionWrapper').addEventListener('click', function (e) {
      var target = e.target;
      if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = document.getElementById('messageInput');
        messageInput.focus();
        that._showImageOnInput(target.src);
      }
    }, false);

    //listen send image event when user click 'sendImage' button
    document.getElementById('sendImage').addEventListener('change', function () {
      if (this.files.length != 0) {
        var file = this.files[0],
          reader = new FileReader(),
          color = document.getElementById('colorStyle').value;
        if (!reader) {
          this._showMessage('系统消息', '您的电脑不支持图片浏览', 'red');
          this.value = "";
          return;
        }
        reader.onload = function (e) {
          this.value = '';
          that._showImageOnInput(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }, false);

    //listen shake screen event when user click 'shake' button
    document.getElementById('shake').addEventListener('click', function () {
      that.socket.emit('shakeOther');
    }, false);


    //listen clear message event when user click 'clearBtn' button
    document.getElementById('clearBtn').addEventListener('click', function () {
      document.getElementById('historyMsg').innerHTML = "";
    }, false);

    //listen send message event when user click 'sendBtn' button
    document.getElementById('sendBtn').addEventListener('click', function () {
      var messageInput = document.getElementById('messageInput');
      var textColor = document.getElementById('colorStyle').value;
      //var msg = messageInput.value;
      var msg = messageInput.innerHTML;
      //messageInput.value = "";
      messageInput.innerHTML = "";
      //messageInput.focus();
      if (msg.trim().length != 0) {
        //run 'postMsg' event to broadcast
        that.socket.emit('postMsg', msg, textColor);
        that._showMessage('我 ', msg, textColor);
      }
    }, false);

    //listen send message event when user enter the keyboard
    document.getElementById('messageInput').addEventListener('keyup', function (event) {
      var messageInput = document.getElementById('messageInput');
      var textColor = document.getElementById('colorStyle').value;
      //var msg = messageInput.value;
      var msg = messageInput.innerHTML;
      if (msg.trim().length != 0 && event.keyCode == 13) {
        //run 'postMsg' event to broadcast
        that.socket.emit('postMsg', msg, textColor);
        that._showMessage('我 ', msg, textColor);
        //messageInput.value = "";
        messageInput.innerHTML = "";
        //messageInput.focus();
      }
    }, false);

    //listen 'nickNameExisted' event, run when user's nickname is exist
    this.socket.on('nickNameExisted', function () {
      document.getElementById('info').textContent = 'Sorry!~这个昵称已经给人抢了，换一个吧!';
      document.getElementById('nicknameInput').focus();
    });

    //listen 'loginSuccess' event, run when user login success
    this.socket.on('loginSuccess', function (nickname) {
      document.title = 'MyChat | ' + nickname;
      document.getElementById('chat_title').innerHTML = "<strong style='color: #1410e1'>" + nickname + "</strong>" + "<span>的聊天室</span>";
      document.getElementById('loginWrapper').style.display = 'none';
      document.getElementById('messageInput').focus();
    });

    this.socket.on('system', function (nickname, userCount, msgType) {
      var msg = msgType == 'login' ? '进入聊天室' : '离开聊天室';
      var p = document.createElement('p');
      p.innerHTML = nickname + "<span style='color: red'>" + msg + "</span>";
      document.getElementById('historyMsg').appendChild(p);
      //show user online count in top panel
      document.getElementById('status').innerHTML = "<span>共<strong style='color: #122b40'>" + userCount + "</strong>人在线</span>";
    });

  },

  //show message on the template
  _showMessage: function (nickname, msg, textColor) {
    console.log(nickname + ": " + msg);
    var msgContainer = document.getElementById('historyMsg');
    var showMsgContent = document.createElement('p');
    showMsgContent.style.color = textColor || '#000';
    var sendTime = new Date().toTimeString().substr(0, 8);
    //filter the messge, if the message have expression can show it
    //msg = this._showExpression(msg);
    showMsgContent.innerHTML = "<span class='usermenu'>" + nickname + "</span>" + "  <span class='timespan'>" + sendTime + ":</span><br>" + msg;
    msgContainer.appendChild(showMsgContent);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  },

  //_showImage: function (nickname, img, textColor) {
  //    var msgContainer = document.getElementById('historyMsg');
  //    var showMsgContent = document.createElement('p');
  //    showMsgContent.style.color = textColor || '#000';
  //    var sendTime = new Date().toTimeString().substr(0, 8);
  //    showMsgContent.innerHTML = nickname + "  <span class='timespan'>" + sendTime + ":</span><br>" + "<a href='" + img + "' target='_blank'><img src='" + img + "'/></a>";
  //    msgContainer.appendChild(showMsgContent);
  //    msgContainer.scrollTop = msgContainer.scrollHeight;
  //},

  _showImageOnInput: function (img) {
    var container = document.getElementById('messageInput');
    var p = document.createElement('p');
    p.innerHTML = "<img src='" + img + "'/>";
    container.appendChild(p);
    container.scrollTop = container.scrollHeight;
  },

  _initialExpression: function () {
    var expressionContanier = document.getElementById('expressionWrapper');
    var docFragment = document.createDocumentFragment();
    //fs.readdir('./public/img/expression', function (err, data) {
    //  var expressionCount = data.length;
    for (var i = 69; i > 0; i--) {
      var item = document.createElement('img');
      item.src = '../img/expression/' + i + '.gif';
      item.title = i;
      docFragment.appendChild(item);
    }
    expressionContanier.appendChild(docFragment);
    //});
  }
};

