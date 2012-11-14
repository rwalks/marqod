var request = require('request');
var util = require('util');
var http = require('http');
var fs = require('fs');
var path = require('path');
var bcrypt = require('bcrypt');
var exec = require('child_process').exec;
var eng = require('./GameEngine.js');
var playerModel = require('./Player.js');
var weapon = require('./Weapon.js');
var ammo = require('./Ammo.js');
var account = require('./Account.js');
var players = {};
var firstConnect = true;

var mongo = require('mongodb'),
      Server = mongo.Server,
        Db = mongo.Db;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('marqod', server, {safe:false});

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
  players[socket.id] = {'playerId': pid};
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

  socket.on('login', function(data){
    handle_login(socket, data);
  });
});

db.open(function(err, db) {
    if(!err) {
      db.createCollection('marqod', function(err, collection) {});
      console.log('MARQOD LIVES');
            }
});

function handle_message(socket, msg) {
    if (msg){
      if (validatePlayer(socket, msg.playerId)){
        engine.queue_message(msg);
      }
   }
}

function handle_login(socket, msg) {
  if (msg) {
    switch(msg.action){
      case 'login':
        var res = loginAccount(msg.name, msg.hash);
        break;
      case 'create':
        var res = createAccount(msg.name, msg.hash);
        break;
      }
      if (res){
        socket.emit('login',{'resp':res});
      }
  }
}

function loginAccount(username,password){
    db.collection('marqod', function(err, collection) {
      collection.find({login:username}).toArray(function(err, items) {
        if (!err && items[0]){
          bcrypt.hash(password,items[0].salt, function(err, hash){
            if (!err) {
              return (hash == items[0].hash)
            }
            return false;
          });
        }
      });
    });
}

function createAccount(login,password){
      db.collection('marqod', function(err, collection) {
        collection.find({login:login}).toArray(function(err, items) {
          if (!err && items.length == 0){
            bcrypt.genSalt(10, function(err, salt) {
              if (!err) {
                bcrypt.hash(password,salt,function(err, hash){
                  if (!err){
                    var data = new account.Account(login,salt,hash);
                    collection.insert(data, {safe:true}, function(err,result){
                      if (!err) {
                        return data;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
          return false;
}

function validatePlayer(socket, id) {
  return (id == players[socket.id].playerId)
}

function dropPlayer(socket) {
  var match;
  for (p in players){
    try {
      match = (p == socket.id);
    } catch (e) {}
    if (match){
      engine.dropObject(players[p].playerId,'players');
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


