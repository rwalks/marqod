﻿var WIDTH = 800;
var HEIGHT = 700;

(function(exports) {

exports.GameEngine = function (serv, playerM, ammoM, weaponM, beastM){
  //support browser and server
    var server = serv;
    var playerModel = server ? require('./Player.js') : playerM;
    var ammo = server ? require('./Ammo.js') : ammoM;
    var weapon = server ? require('./Weapon.js') : weaponM;
    var beast = server ? require('./Beast.js') : beastM;

    this.game_state = {};
    this.messageBuffer = [];
    this.clientBuffer = [];
    game_engine = this;
    var lastUpdate = +new Date;
    var lastMessage = +new Date;
    var deleteQueue = {'players': [], 'ammos': [], 'beasts': []};
    var playerIndex = 1;
    var ammoIndex = 1;
    var beastIndex = 1;
    var waveCount = 1;
    var gameBounds = {x: WIDTH, y: HEIGHT};
    var collisions;
    this.pushData;
    var objTypes = ['ammos','players', 'beasts'];

    this.Initialize = function () {
      for (ob in objTypes) {
        this.game_state[objTypes[ob]] = {};
      }
    }

    this.addPlayer = function(pid) {
      if (!pid) {
        playerIndex += 1;
        pid = playerIndex;
      }
      var p = new playerModel.Player(pid, server, weapon, ammo);
      this.game_state.players[pid] = p;
      return pid;
    }

    this.LoadContent = function () {
        lastUpdate = +new Date;
    }

    this.Run = function () {
      if (this.Initialize()) {
        // if initialization was succesfull, load content
        this.LoadContent();
      }
    }

    this.serverPush = function() {
      if (!this.pushData) {return;}
      if (typeof game_state === 'undefined'){
        game_state = {players: {}, ammos: {}, beasts: {}};
      }
      lastMessage = this.pushData.lastMessage;
      for (ob in objTypes) {
        for (i in this.pushData[objTypes[ob]]) {
          if (this.pushData[objTypes[ob]][i] == null) {
            this.dropObject(i,objTypes[ob]);
          }else {
            if (!this.game_state[objTypes[ob]][i]) {
              this.addObject(i,objTypes[ob]);
            }
            this.game_state[objTypes[ob]][i].serverPush(this.pushData[objTypes[ob]][i]);
          }
        }
      }
    }

    this.applyClientBuffer = function(){
      while (message = this.clientBuffer.pop()){
        if (message.time >= this.lastMessage){
          this.apply_player_message(message);
        }
      }
    }

    this.Update = function () {
      if (!server) {
        this.serverPush();
        //this.applyClientBuffer();
      }

      while (message = this.messageBuffer.pop()){
//might have to limit this loop
        if (!server){
          this.clientBuffer.unshift(message);
        } else {
          if (this.messageBuffer.length == 0) {
            lastMessage = message.time;
          }
        }
        this.apply_player_message(message);
      }
      //update objects
      
      for (ob in objTypes) {
        for (i in this.game_state[objTypes[ob]]){
          var pl = this.game_state[objTypes[ob]][i];
          if (pl){
            try{
              (objTypes[ob] == 'beasts') ? pl.update(lastUpdate,this.game_state) :
                                           pl.update(lastUpdate);
              if (objTypes[ob] != 'beasts' && this.checkBounds(pl)){
                this.dropObject(i,objTypes[ob]);
              }
            } catch (e) {}
          }

         }
      }
      this.checkCollisions();
      lastUpdate = +new Date;
    }


    this.checkCollisions = function() {
      for (b in this.game_state.beasts) {
        for (p in this.game_state.players) {
          //distance check for now
          var d = this.distance(this.game_state.beasts[b],this.game_state.players[p]);
          if (d < 50){
            var dmg = this.game_state.beasts[b].attack(d);
            if (dmg) {
              if (this.game_state.players[p].wound(dmg)){
                this.dropObject(p,'players');
              }
            }
          }
        }
        for (a in this.game_state.ammos) {
          //distance check for now
          var d = this.distance(this.game_state.beasts[b],this.game_state.ammos[a]);
          if (d < 10){
            var dmg = this.game_state.ammos[a].damage();
            if (dmg) {
              if (dmg[1]) {
                this.dropObject(a,'ammos');
              }
              if (this.game_state.beasts[b].wound(dmg[0])){
                this.dropObject(b,'beasts');
              }
            }
          }
        }
      }
    }

    this.checkBounds = function(position){
      for (i in position){
        if (position[i] < 0 || position[i] > gameBounds[i]){
          return true;
        }
      }
      return false;
    }

    this.getPlayer = function(player_id) {
      return this.game_state.players[player_id];
    }

    this.queue_message = function(message) {
        this.messageBuffer.unshift(message);
    }

    this.apply_player_message = function(message) {
      //  changle player state based upon message
        player = this.getPlayer(message.playerId);
        if (player){
          var objs = player.update_state(message);
          if (objs) {
          for (a in objs) {
            var aid = this.nextAmmoId();
            objs[a].id = aid;
            this.game_state.ammos[aid] = objs[a];
          }
          }
        }
    }

    this.nextAmmoId = function() {
      ammoIndex += 1;
      return ammoIndex;
    }

    this.nextBeastId = function() {
      beastIndex += 1;
      return beastIndex;
    }

    this.addObject = function(id, type) {
      if (type == 'players'){ this.addPlayer(id); }
      if (type == 'ammos'){ this.addAmmo(id); }
      if (type == 'beasts'){ this.addBeast(id); }
    }

    this.dropObject = function(id, type) {
      if (server) {
        this.game_state[type][id] = null;
        deleteQueue[type].push(id);
      }else {
        delete this.game_state[type][id];
      }
    }

    this.addAmmo = function(aid, origin, target) {
      if (aid == null) {
        aid = this.nextAmmoId();
      }
      var a = new ammo.Ammo(aid,origin,target);
      this.game_state.ammos[aid] = a;
      return aid;
    }

    this.addBeast = function(id, origin) {
      if (id == null) {
        id = this.nextBeastId();
      }
      var b = new beast.Beast(id,origin);
      this.game_state.beasts[id] = b;
      return id;
    }

  this.spawnWave = function(level) {
    var spawnNo = level*10;
    for (var i=0; i<spawnNo; i++){
      var position = {};
      if (i % 2 == 0){
        position.x = randomNumber(0,WIDTH);
        position.y = (i % 3 == 0) ? HEIGHT + 10 : -10;
      }else {
        position.x = (i % 3 == 0) ? WIDTH + 10 : -10;
        position.y = randomNumber(0,HEIGHT);
      }
      this.addBeast(null,position);
    }
  }

  this.deleteSweep = function() {
    for (i in objTypes){
      var t = objTypes[i];
      for (j in deleteQueue[t]) {
        delete this.game_state[t][deleteQueue[t][j]];
      }
    }
  }

  this.waveCheck = function(hold){
    if (!hold && Object.keys(this.game_state.players).length > 0){
      if (Object.keys(this.game_state.beasts).length <= 0){
        this.waveCount += 1;
        this.spawnWave(waveCount);
      }
    }
  }

  this.distance = function(obj1, obj2) {
    if (obj1 && obj2){
      return Math.sqrt(Math.pow((obj2.position.x - obj1.position.x),2)+Math.pow((obj2.position.y-obj1.position.y),2));
    }
  }
}

function point_in_polygon(cx,cy,points) {
  within = false;
  for (i=0;i<points.length;i++){
    p1 = points.shift();
    p2 = points[0];
    if (((p1.y <= cy && cy < p2.y) || (p2.y <= cy && cy < p1.y))
    && (cx < (p2.x - p1.x) * (cy - p1.y) / (p2.y - p1.y) + p1.x))
     {within = !within;}
    points.push(p1);
  }
  return within;
}


function randomNumber(min,max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

}) (typeof exports === 'undefined'? this['engine']={}: exports);
