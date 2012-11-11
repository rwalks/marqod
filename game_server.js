var request = require('request');
var util = require('util');
var http = require('http');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var eng = require('./GameEngine.js');
var playerModel = require('./Player.js');
var weapon = require('./Weapon.js');
var ammo = require('./Ammo.js');
var players = {};
var firstConnect = true;


var app = http.createServer(handler),
    io  = require('socket.io').listen(app)
    app.listen(80);

io.set('log level', 1); //reduce lawg)

var engine = new eng.GameEngine(true,false);
engine.Run();

function handler (req, res) {
    console.log('request starting...');
    var basepath = './';
    var filePath = '.' + req.url;
    if (req.method !== 'GET') {
	res.writeHead(400);
	res.end();
	return;
	}
    if (filePath == './')
        filePath = './game.html';
    if (filePath == './game')
        filePath = './game.html';
    if (filePath == './game_server.js')
        filePath = './game.html';
    if (filePath == './reset'){
        world.reset();
        filePath = './game.html';
    }
    console.log(filePath);
    var s = fs.createReadStream(filePath);
    s.on('error', function () {
      console.log("ERROR!");
      console.log(filePath);
      res.writeHead(404);
      res.end();
    })
    s.once('fd', function () {res.writeHead(200);});
    s.pipe(res);
}


io.sockets.on('connection', function (socket) {
  var pid = engine.addPlayer(false);
  players[pid] = socket;
  socket.emit('init',{'playerId' : pid})
  if (firstConnect){
    engine.spawnWave(1);
    firstConnect = false;
  }

  socket.on('msg', function(data) {
    handle_message(socket, data);
  });

  socket.on('disconnect', function(){
    dropPlayer(socket);
  });
});

console.log('MARQOD LIVES');

function handle_message(socket, msg) {
    if (msg){
      if (validatePlayer(socket, msg.playerId)){
        engine.queue_message(msg);
      }
   }
}

function validatePlayer(socket, id) {
  return (socket.id == players[id].id)
}

function dropPlayer(socket) {
  var match;
  for (p in players){
    try {
      match = (players[p].id == socket.id);
    } catch (e) {}
    if (match){
      engine.dropObject(p,'players');
      players[p] = null;
    }
  }
}

function tick() {
  engine.deleteSweep();
  engine.waveCheck(firstConnect);
  engine.Update();
  io.sockets.emit('push',engine.game_state);
}

function distance(obj1, obj2) {
  return Math.sqrt(Math.pow((obj2.position.x - obj1.position.x),2)+Math.pow((obj2.position.y-obj1.position.y),2));
}

setInterval(function() {tick()}, 1000 / 20);


