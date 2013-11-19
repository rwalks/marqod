var WIDTH = 800000;
var HEIGHT = 1000;

(function(exports) {

exports.GameEngine = function (serv, playerM, ammoM, weaponM, beastM, terrainM, playerImg){
    game_engine = this;
    var server = serv;
    var playerModel = server ? require('./Player.js') : playerM;
    var ammo = server ? require('./Ammo.js') : ammoM;
    var weapon = server ? require('./Weapon.js') : weaponM;
    var beast = server ? require('./Beast.js') : beastM;
    var terrain = server ? require('./Terrain.js') : terrainM;

    this.game_state = {};
    this.messageBuffer = [];
    this.clientBuffer = [];

    this.player_img = playerImg;
    var lastUpdate = +new Date;
    var lastMessage = +new Date;
    var deleteQueue = {'players': [], 'ammos': [], 'beasts': [], 'walls': []};
    var playerIndex = 1;
    var ammoIndex = 1;
    var beastIndex = 1;
    var wallIndex = 1;
    this.waveCount = 1;
    var gameBounds = {x: WIDTH, y: HEIGHT};
    var collisions;
    this.pushData;
    this.terrain = new terrain.Terrain(WIDTH,HEIGHT);
    var objTypes = ['ammos','players', 'beasts', 'walls'];

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
      var p = new playerModel.Player(pid, server, weapon, ammo, this.player_img);
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
        game_state = {players: {}, ammos: {}, beasts: {}, walls : {}};
      }
      lastMessage = this.pushData.lastMessage;
      this.waveCount = this.pushData.waveCount;

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

    this.setTerrain = function(terrainM){
      this.terrain.surfaceMap = terrainM;
      this.terrain.generateBG();
    }

    this.Update = function () {
      if (!server) {
        this.serverPush();
        this.applyClientBuffer();
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
        for (index in this.game_state[objTypes[ob]]){
          var pl = this.game_state[objTypes[ob]][index];
          if (pl){
            try{
              (objTypes[ob] == 'players') ? pl.update(lastUpdate,this.terrain,[]) :
                                           pl.update(lastUpdate);
            } catch (e) {}
          }

         }
      }
      this.checkCollisions();
      lastUpdate = +new Date;
      this.game_state['waveCount'] = this.waveCount;
    }

    // aka THE BEAST LOOP
    this.checkCollisions = function() {
      for (var b in this.game_state.beasts) {
        var beast = this.game_state.beasts[b];
        for (var p in this.game_state.players) {
          //distance check for now
          var d = this.distance(beast,this.game_state.players[p]);
          if (d < 50){
            var dmg = beast.attack(d);
            if (dmg) {
              if (this.game_state.players[p].wound(dmg)){
                this.dropObject(p,'players');
              }
            }
          }
        }
        for (var w in this.game_state.walls) {
          var wall = this.game_state.walls[w];
          var d = this.distance(beast, wall);
          if(d < 50) {
            var dmg = beast.attack(d);
            if(dmg) {
              if(wall.wound(dmg)) {
                this.dropObject(w,'walls');
              }
            }
          }
        }
        for (var a in this.game_state.ammos) {
          //distance check for now
          var d = this.distance(this.game_state.beasts[b],this.game_state.ammos[a]);
          if (d < 10){
            var dmg = this.game_state.ammos[a].damage();
            if (dmg) {
              if (this.game_state.beasts[b].wound(dmg[0])){
                this.game_state.players[this.game_state.ammos[a].playerId].kills += 1;
                this.dropObject(b,'beasts');
              }
              if (dmg[1]) {
                this.dropObject(a,'ammos');
              }
            }
          }
        }
      }
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
      if (type === 'walls') {this.addWall(id); }
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
      var b = new beast.Beast(id,origin,this.waveCount);
      this.game_state.beasts[id] = b;
      return id;
    }

  this.deleteSweep = function() {
    for (i in objTypes){
      var t = objTypes[i];
      for (j in deleteQueue[t]) {
        delete this.game_state[t][deleteQueue[t][j]];
      }
    }
  }

  this.distance = function(obj1, obj2) {
    if (obj1 && obj2){
      return Math.sqrt(Math.pow((obj2.position.x - obj1.position.x),2)+Math.pow((obj2.position.y-obj1.position.y),2));
    }
  }
}

}) (typeof exports === 'undefined'? this['engine']={}: exports);
