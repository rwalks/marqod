var WIDTH = 800;
var HEIGHT = 700;

(function(exports) {

exports.GameEngine = function (serv, playerM, ammoM, weaponM){
  //support browser and server
    var server = serv;
    var playerModel = server ? require('./Player.js') : playerM;
    var ammo = server ? require('./Ammo.js') : ammoM;
    var weapon = server ? require('./Weapon.js') : weaponM;

    this.game_state = {};
    this.messageBuffer = [];
    this.clientBuffer = [];
    game_engine = this;
    var lastUpdate = +new Date;
    var deleteQueue = {players: [], ammos: []};
    var playerIndex = 1;
    var ammoIndex = 1;
    var gameBounds = {x: WIDTH, y: HEIGHT};
    this.pushData;

    this.Initialize = function () {
      this.game_state.players = {};
      this.game_state.ammos = {};
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

    this.dropPlayer = function(id) {
      if (server == true) {
        this.game_state.players[id] = null;
        deleteQueue.players.push(id);
      }else {
        delete this.game_state.players[id];
      }
    }

    this.LoadContent = function () {
        var gamePro = this;
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
        game_state = {players: {}, ammos: {}};
      }
      for (p in this.pushData.players) {
        if (this.pushData.players[p] == null){
          this.dropPlayer(p);
        }else {
          if (!this.game_state.players[p]) {
            this.addPlayer(p);
          }
          this.game_state.players[p].serverPush(this.pushData.players[p]);
        }
      }
      for (a in this.pushData.ammos) {
        if (this.pushData.ammos[a] == null){
          this.dropAmmo(a);
        }else {
          if (!this.game_state.ammos[a]) {
            this.addAmmo(a,this.pushData.ammos[a].position,this.pushData.ammos[a].target);
          }
          this.game_state.ammos[a].serverPush(this.pushData.ammos[a]);
        }
      }
    }

    this.Update = function () {
      if (!server) {this.serverPush();}
      while (message = this.messageBuffer.pop()){
//might have to limit this loop
        if (!server){
          this.clientBuffer.push(message);
        }
        this.apply_player_message(message);
      }
      //update players
      var resp;
      for (p in this.game_state.players){
        var pl = this.game_state.players[p];
        if (pl){
          try{
            pl.update(lastUpdate);
            if (this.checkBounds(pl.position)){
              this.dropPlayer(p);
            }
          } catch (e) {}
        }
      }
      for (a in this.game_state.ammos){
        var am = this.game_state.ammos[a];
        if (am != null){
          try{
            am.update(lastUpdate);
            if (this.checkBounds(am.position)){
              this.dropAmmo(a);
            }
          } catch (e) {}
        }
      }

      lastUpdate = +new Date;
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

    this.addAmmo = function(aid, origin, target) {
      if (aid == null) {
        aid = this.nextAmmoId();
      }
      var a = new ammo.Ammo(aid,origin,target);
      this.game_state.ammos[aid] = a;
      return aid;
    }

    this.dropAmmo = function(id) {
      if (server == true) {
        this.game_state.ammos[id] = null;
        deleteQueue.ammos.push(id);
      }else {
        delete this.game_state.ammos[id];
      }
    }

  this.deleteSweep = function() {
    var objTypes = ['ammos','players'];
    for (i in objTypes){
      var t = objTypes[i];
      for (j in deleteQueue[t]) {
        delete this.game_state[t][deleteQueue[t][j]];
      }
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

function distance(obj1, obj2) {
  return Math.sqrt(Math.pow((obj2.x - obj1.x),2)+Math.pow((obj2.y-obj1.y),2));
}
}) (typeof exports === 'undefined'? this['engine']={}: exports);
