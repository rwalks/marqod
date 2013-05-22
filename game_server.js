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
var wall = require('./Wall.js');
var account = require('./Account.js');
var players = {};
var nonces = {};
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
  check_cookie(socket);
  sendNonce(socket);

  socket.on('join', function(data){
    if (players[socket.id]) {
      var pid = engine.addPlayer(false);
      players[socket.id].playerId = pid;
      socket.emit('init',{'playerId' : pid})
      if (firstConnect){
        engine.spawnWave(1);
        firstConnect = false;
      }
    }
  });

  socket.on('msg', function(data) {
    handle_message(socket, data);
  });

  socket.on('inventory', function(data){
    //fart
  });

  socket.on('logout', function(){
    dropPlayer(socket, true);
  });

  socket.on('disconnect', function(){
    dropPlayer(socket, false);
  });

  socket.on('auth', function(data){
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

function sendNonce(socket){
  var nonce = parseInt(Math.random() * 1000);
  nonces[socket.id] = nonce;
  socket.emit('handshake',{n:nonce});
}

function check_cookie(socket){
  if (socket.handshake.headers.cookie){
    cookieArray = socket.handshake.headers.cookie.split(/;\ |;/);
    cookieHash = {};
    for(c in cookieArray) {
      kv = cookieArray[c].split('=');
      cookieHash[kv[0]] = kv[1];
    }
    if (cookieHash['marqod']){
     db.collection('marqod', function(err, collection){
       collection.find({session:decodeURIComponent(cookieHash['marqod'])}).toArray(function(err, items) {
         if (!err && items[0]){
           var acc = new account.Account(items[0]);
           if (acc.valid_session()){
             players[socket.id] = acc;
             socket.emit('login', acc.sendData())
           }
         }else{
  //no session
         }
       });
     });
    }
  }
}

function unhashPassword(socket,hash){
  pw = "";
  var n = nonces[socket.id];
  for (i in hash){
    var c = hash[i] ^ n;
    c = String.fromCharCode(c);
    pw += c;
  }
  pw = pw.split(n)[0];
  return pw;
}

function handle_login(socket, msg) {
  if (msg) {
    if (msg.action == 'login'){
        loginAccount(msg.username, msg.password, socket);
    }else{
        createAccount(msg.username, msg.password, socket);
      }
  }
}

function loginAccount(username,password,socket){
    var pw = unhashPassword(socket,password);
    db.collection('marqod', function(err, collection) {
      collection.find({login:username}).toArray(function(err, items) {
        if (!err && items[0]){
          bcrypt.hash(pw,items[0].salt, function(err, hash){
            if (!err) {
              if(hash == items[0].hash){
                var acc = new account.Account(items[0]);
                generate_session(acc);
                collection.find({login:acc.login}).toArray(function(err, items) {
                  if (items[0]) {
                    collection.update({login:acc.login}, acc, function(err,result){
                            if (!err) {
                              players[socket.id] = acc;
                              socket.emit('login',acc.sendData())
                            }
                    });
                  }
                });
              }
            }
          });
        }
      });
    });
                socket.emit('login',false)
}

function createAccount(login,password,socket){
    var pw = unhashPassword(socket,password);
      db.collection('marqod', function(err, collection) {
        collection.find({login:login}).toArray(function(err, items) {
          if (!err && items.length == 0){
            bcrypt.genSalt(10, function(err, salt) {
              if (!err) {
                bcrypt.hash(pw,salt,function(err, hash){
                  if (!err){
                    var data = new account.Account({login:login,salt:salt,hash:hash});
                    generate_session(data);
                    collection.insert(data, {safe:false}, function(err,result){
                      if (!err) {
                        players[socket.id] = data;
                        socket.emit('login',data.sendData())
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
  socket.emit('login',false)
}

function validatePlayer(socket, id) {
  return (id == players[socket.id].playerId)
}

function generate_session(account) {
  ts = new Date().getTime();
  bcrypt.genSalt(10, function(err,salt){
    account.session = '' + ts + salt;
  });
}

function dropPlayer(socket, drop_session) {
  try {
    var accountData = players[socket.id];
    if (drop_session){
      accountData.session = null;
    }
    if(players[socket.id] && players[socket.id].playerId){
      var highWave = engine.game_state.players[accountData.playerId].highWave;
      accountData.maxWave = (highWave > accountData.maxWave) ? highWave : accountData.maxWave;
      var kills = engine.game_state.players[accountData.playerId].kills;
      accountData.maxKills = (kills > accountData.maxKills) ? kills : accountData.maxKills;
      engine.dropObject(players[socket.id].playerId,'players');
      delete players[socket.id].playerId;
    }
    delete players[socket.id];
    db.collection('marqod', function(err, collection) {
      collection.find({login:accountData.login}).toArray(function(err, items) {
        if (items[0]) {
          collection.update({login:accountData.login}, accountData, function(){});
        }
      });
    });
  } catch (e) {}
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


