var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mouse = require("mac-vhid");

app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){

  var x = 0;
  var y = 0;

  var speedCoeff = 1.2;

  var threshold = 0.5;

  var refreshRate = 15;
  var slowDownRate = 1 + (0.18 / refreshRate);

  socket.on('mouseMoveRelative', function(data){
    // console.log('mouseMoveRelative received: ' + data.ax + ', ' + data.ay);

    // Smooth out abrupt movements.
    x = (x + parseFloat(data.ax) * speedCoeff) / 2;
    y = (y + parseFloat(data.ay) * speedCoeff) / 2;

  });

  socket.on('tap', function(data){
    console.log('tap received' + data.msg);
    mouse.mouseBtnDown(0);
    mouse.mouseBtnUp(0);
  });

  socket.on('twoFingerTap', function(data){
    console.log('twoFingerTap received' + data.msg);
    mouse.mouseBtnDown(1);
    mouse.mouseBtnUp(1);
  });

  socket.on('disconnectCommand', function(data){
    console.log('disconnectCommand received');
    socket.disconnect();
    console.log('user has disconnected.');

    x = 0;
    y = 0;

  });

  socket.on('pauseControl', function(){
    console.log('pauseControl received');
    clearInterval(intervalId);
  });

  socket.on('resumeControl', function(){
    console.log('resumeControl received');
    intervalId = setInterval(function(){myTimer()}, refreshRate);
  });

  socket.on('killServer', function(){
    console.log('killServer received, bye-bye');
    process.exit(0);
  });

  var intervalId = setInterval(function(){myTimer()}, refreshRate);

  function myTimer() {
    if ((x < threshold && x > -threshold) && (y < threshold && y > -threshold)) {
      x = 0;
      y = 0;
    } else {
      // mouse.mouseMoveDelta( parseFloat(x), parseFloat(y) );
      mouse.mouseMoveDelta( x, y );
      x = x / slowDownRate;
      y = y / slowDownRate;
    }
  }

  console.log('user has connected.');
});

var port = process.env.PORT || 8080;
http.listen(port, function(){
  require('dns').lookup(require('os').hostname(), function (err, addr, fam) {
    console.log('go to ' + addr + ':' + port);
  })
});
