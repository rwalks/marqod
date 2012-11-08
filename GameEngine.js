(function(exports) {

exports.GameEngine = function (serv, playerM, ammoM, weaponM){
  //support browser and server
    var server = serv;
    var playerModel = server ? require('./Player.js') : playerM;
    var ammo = server ? require('./Ammo.js') : ammoM;
    var weapon = server ? require('./Weapon.js') : weaponM;

    this.game_state = {};
    this.messageBuffer = [];
    game_engine = this;
    var lastUpdate = +new Date;

    this.Initialize = function () {
      this.game_state.players = {};
      this.game_state.ammos = {};
    }

    this.addPlayer = function(pid) {
      if (!pid) {
        pid = Object.keys(this.game_state.players).length + 1;
      }
      var p = new playerModel.Player(pid, server, weapon, ammo);
      this.game_state.players[pid] = p;
      return pid;
    }

    this.dropPlayer = function(id) {
      this.game_state.players[id] = null;
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

    this.serverPush = function(data) {
      if (typeof game_state === 'undefined'){
        game_state = {players: {}, ammos: {}};
      }
      for (p in data.players) {
        if (data.players[p] == null){
          game_state.players[p] = null;
        }else {
          if (!this.game_state.players[p]) {
            this.addPlayer(p);
          }
          this.game_state.players[p].serverPush(data.players[p]);
        }
      }
      for (a in data.ammos) {
        if (data.ammos[a] == null){
          game_state.ammos[a] = null;
        }else {
          if (!this.game_state.ammos[a]) {
            console.log(data.ammos[a])
            this.addAmmo(a,data.ammos[a].position,data.ammos[a].target);
          }
          this.game_state.ammos[a].serverPush(data.ammos[a]);
        }
      }
    }

    this.Update = function () {
      while (message = this.messageBuffer.pop()){
//might have to limit this loop
        this.apply_player_message(message);
      }
      //update players
      for (p in this.game_state.players){
        if (this.game_state.players[p]){
          try{
            this.game_state.players[p].update(lastUpdate);
          } catch (e) {}
        }
      }
      for (a in this.game_state.ammos){
        if (this.game_state.ammos[a] != null){
          try{
            this.game_state.ammos[a].update(lastUpdate);
          } catch (e) {}
        }
      }

      lastUpdate = +new Date;
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
      return Object.keys(this.game_state.ammos).length + 1;
    }

    this.addAmmo = function(aid, origin, target) {
      if (aid == null) {
        aid = this.nextAmmoId();
      }
      var a = new ammo.Ammo(aid,origin,target);
      this.game_state.ammos[aid] = a;
      return aid;
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
