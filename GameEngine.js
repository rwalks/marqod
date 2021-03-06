var WIDTH = 800;
var HEIGHT = 600;

(function(exports) {

exports.GameEngine = function (serv, playerM, ammoM, weaponM, shitLordM, hitBoxM, terrainM, tileM, animationM){
  //support browser and server
    var server = serv;
    var playerModel = server ? require('./Player.js') : playerM;
    var ammo = server ? require('./Ammo.js') : ammoM;
    var weapon = server ? require('./Weapon.js') : weaponM;
    var shitLord = server ? require('./ShitLord.js') : shitLordM;
    var hitBox = server ? require('./HitBox.js') : hitBoxM;
    var terrain = server ? require('./Terrain.js') : terrainM;
    var tile = server ? require('./Tile.js') : tileM;
    var animation = server ? require('./Animation.js') : animationM;
    this.playerModels = {'weapon': weapon,'ammo':ammo,'hitBox':hitBox,'shitLord':shitLord}

    this.game_state = {};
    this.messageBuffer = [];
    this.clientBuffer = [];
    game_engine = this;
    var lastUpdate = +new Date;
    var latency = 0;
    var lastMessage = +new Date;
    var deleteQueue = {'players': [], 'ammos': [], 'hitBoxes':[]};
    var playerIndex = 1;
    var ammoIndex = 1;
    var animation_index = 1;
    var gameBounds = {x: WIDTH, y: HEIGHT};
    var collisions;
    this.pushData;
    var objTypes = ['ammos','players','hitBoxes'];
    this.player_img = null;
    this.tile_img = null;
    this.spawn_img = null;
    var respawn_queue = {};
    this.terrainReady=false;
    this.player_queue = [];
    this.active_players = {1:false,2:false,3:false,4:false};
    this.newPlayers = [];
    this.animations = {};

    this.levelHash = new terrain.Terrain().levelOne();
    this.tiles = {};

    this.Initialize = function () {
      for (ob in objTypes) {
        this.game_state[objTypes[ob]] = {};
      }
    }

    this.generate_level = function(){
      for(y in this.levelHash){
        for(x in this.levelHash[y]){
          var symb = this.levelHash[y][x];
          if(symb != "."){
            var t = new tile.Tile({'x':x*20,'y':y*20},symb,this.tile_img);
            if(!this.tiles[t.position.x]){
              this.tiles[t.position.x] = {};
            }
            this.tiles[t.position.x][t.position.y] = t;
          }
        }
      }
      this.terrainReady = true;
    }

    this.addPlayer = function(pid, kills, deaths, name, force) {
      if (!pid) {
        playerIndex += 1;
        pid = playerIndex;
      }
      var p = new playerModel.Player(pid, server, this.player_img, this.playerModels);
      p.name = name ? name.slice(0,9) : "NoobLord";
      p.totalKills = kills;
      p.totalDeaths = deaths;
      if(force){
        this.game_state.players[p.id] = p;
      }else{
        this.player_queue.push(p);
      }
      return pid;
    }

    this.startPlayer = function(p,pNum) {
      p.playerNum = pNum;
      this.active_players[pNum] = p.id
      p.spawn_count = 10;
      this.game_state.players[p.id] = p;
      this.newPlayers.push({id:p.id,pos:p.position});
    }

    this.spawnAnimation = function(id,pos,type,img){
      var aid = (id) ? id : nextAnimId();
      var spawn = new animation.Animation(aid,pos,type,img);
      this.animations[aid] = spawn;
    }

    this.LoadContent = function () {
        lastUpdate = +new Date;
    }

    this.queue_names = function () {
      var names = [];
      for(i in this.player_queue){
        var p = this.player_queue[i];
        names.push({name:p.name,kills:p.totalKills,deaths:p.totalDeaths,character:p.charName});
      }
      for(pid in respawn_queue){
        var p = respawn_queue[pid];
        names.push({name:p.name,kills:p.kills,deaths:p.deaths,character:''});
      }
      return names;
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
        game_state = {players: {}, ammos: {}, hitBoxes: {}};
      }
      lastMessage = this.pushData.lastMessage;

      for (ob in objTypes) {
        for (i in this.pushData[objTypes[ob]]) {
          if (this.pushData[objTypes[ob]][i] == false) {
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
        this.applyClientBuffer();
      }else {
        for(pid in respawn_queue){
          respawn_queue[pid].count -= 1;
          if(respawn_queue[pid].count <= 0){
            var pInfo = respawn_queue[pid];
            this.addPlayer(pid,pInfo.kills,pInfo.deaths,pInfo.name);
            delete respawn_queue[pid];
          }
        }
      }
      for(pid in this.active_players){
        if(this.active_players[pid] == false){
          var p = this.player_queue.shift();
          if(p){
            this.startPlayer(p,pid);
          }
        }
      }
      for(aid in this.animations){
        var done = this.animations[aid].update();
        if (done){
          delete this.animations[aid];
        }
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
              if(objTypes[ob] == 'players'){
                pl.update(lastUpdate,latency,this.tiles);
              }else{
                pl.update(lastUpdate);
              }
            } catch (e) {}
          }

         }
      }
      this.objectCleanup();
      this.checkCollisions();
      lastUpdate = +new Date;
    }

    this.objectCleanup = function(){
      for (i in this.game_state.hitBoxes){
        var obj = this.game_state.hitBoxes[i];
        if (!obj.valid){
          this.dropObject(obj.id,'hitBoxes');
        }
      }
    }

    var boxCollide = function(b1,b2){
      if(!b1 || !b2){return false;}
      var maxX = b1[0][0];
      var minX = b1[0][0];
      var maxY = b1[0][1];
      var minY = b1[0][1];
      for(p in b1){
        if(b1[p][0] > maxX){maxX = b1[p][0];}
        if(b1[p][0] < minX){minX = b1[p][0];}
        if(b1[p][1] > maxY){maxY = b1[p][1];}
        if(b1[p][1] < minY){minY = b1[p][1];}
      }
      var maxX2 = b2[0][0];
      var minX2 = b2[0][0];
      var maxY2 = b2[0][1];
      var minY2 = b2[0][1];
      for(p in b2){
        if(b2[p][0] > maxX2){maxX2 = b2[p][0];}
        if(b2[p][0] < minX2){minX2 = b2[p][0];}
        if(b2[p][1] > maxY2){maxY2 = b2[p][1];}
        if(b2[p][1] < minY2){minY2 = b2[p][1];}
      }
      var ret = !((minY > maxY2) || (maxY < minY2) || (minX > maxX2) || (maxX < minX2));
      return ret;
    }

    this.checkCollisions = function() {
      //hb on hb
      var collide = true;
      for(h in this.game_state.hitBoxes){
        var hbMain = this.game_state.hitBoxes[h];
        if(hbMain){
          for(t in this.game_state.hitBoxes){
            var hbTest = this.game_state.hitBoxes[t];
            if(hbTest){
              if (hbMain.id != hbTest.id && hbMain.pid != hbTest.pid){
                var plr1 = this.getPlayer(hbMain.pid);
                var plr2 = this.getPlayer(hbTest.pid);
                if(plr1 && plr2){
                  if(boxCollide(hbMain.poly(plr1),hbTest.poly(plr2))){
                    if(hbMain.shield && hbTest.shield){
                     //nothing?
                    }else if(hbMain.shield && !hbTest.shield){
                      plr.receive_attack(plr1,plr2,hbMain,hbTest);
                    }else {
                      
                    }
                  }
                }
              }
            }
          }
          for(p in this.game_state.players){
            var plr = this.game_state.players[p];
            if(hbMain.pid != plr.id){
              var plr2 = this.getPlayer(hbMain.pid);
              if(plr2 && plr){
                if(boxCollide(hbMain.poly(plr2),plr.poly())){
                  plr2.receive_attack(plr2,plr,hbMain);
                }
              }
            }
          }
        }
      }
      for(p in this.game_state.players){
        var plr = this.game_state.players[p];
        if(plr){
          if(plr.position.x > (gameBounds.x + 60) || plr.position.x < -60 || plr.position.y > (gameBounds.y + 60)){
            this.killPlayer(plr.id,true);
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
        if(message.disconnect){
          delete respawn_queue[message.playerId];
          for(i in this.player_queue){
            if(this.player_queue[i].id == message.playerId){
              this.player_queue.splice(i,1);
            }
          }
        }
        var p = this.getPlayer(message.playerId);
        if (p){
          if(message.kill){
            this.killPlayer(p.id,false);
          }else {
            var objs = p.update_state(message);
            if (objs) {
              for (a in objs) {
                var aid = this.nextAmmoId();
                objs[a].id = aid;
                this.game_state.hitBoxes[aid] = objs[a];
              }
            }
          }
        }
    }

    this.nextAmmoId = function() {
      ammoIndex += 1;
      return ammoIndex;
    }

    nextAnimId = function() {
      animation_index += 1;
      return animation_index;
    }

    this.addObject = function(id, type) {
      if (type == 'players'){ this.addPlayer(id,null,null,null,true); }
      if (type == 'ammos'){ this.addAmmo(id); }
      if (type == 'hitBoxes'){ this.addHitbox(id); }
    }

    this.queue_respawn = function(p){
      respawn_queue[p.id] = {count:40,kills:p.totalKills,deaths:p.totalDeaths,name:p.name};
    }

    this.killPlayer = function(pid,respawn){
      var p = this.getPlayer(pid);
      if(p){
        p.totalDeaths += 1;
        var killer_id = p.last_hit;
        var killer = this.getPlayer(killer_id);
        if(killer){
          killer.kills += 1;
          killer.totalKills += 1;
        }
        if(p.playerNum){
          this.active_players[p.playerNum] = false;
        }
        if(respawn){
          this.queue_respawn(p);
        }
        this.dropObject(pid,'players');
      }
    }

    this.dropObject = function(id, type) {
      if(type == 'players'){
      }
      if (server) {
        this.game_state[type][id] = false;
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


    this.addHitbox = function(hid) {
      if (hid == null) {
        hid = this.nextAmmoId();
      }
      var a = new hitBox.HitBox(hid);
      this.game_state.hitBoxes[hid] = a;
      return hid;
    }

  this.deleteSweep = function() {
    for (i in objTypes){
      var t = objTypes[i];
      for (j in deleteQueue[t]) {
        delete this.game_state[t][deleteQueue[t][j]];
        deleteQueue[t].splice(j,1);
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
