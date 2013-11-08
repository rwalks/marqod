(function(exports) {

exports.Player = function(pid,server,weapon,ammo,player_img) {


  if (!(typeof require === 'undefined')){
    var weapon = require('./Weapon.js');
  }

  this.id = pid;
  this.position = {};
  this.position.x = 400;
  this.position.y = 100;
  this.velocity = {x:0,y:0};
  this.playerWeapon = new weapon.Weapon(this.id,ammo);
  var serverTime = server ? 0 : 0;
  this.maxHealth = 100;
  this.health = 100;
  this.highWave;
  this.kills = 0;
  this.maxSpeed = 200;
  var playerDirection = 0;
  var img = player_img;

  this.update_state = function(msg){
    var ret;
    switch(msg.type){
      case 'move':
        this.move(msg.val, msg.state);
        break;
      case 'click':
        ret = this.click(msg.coords)
        break;
    }
    return ret;
  }

  this.update = function(lastUpdate,terrainHash,objects){
    var deltaT = Date.now() - lastUpdate;
    //playerDirection = (this.velocity.x != 0) ? ((this.velocity.x > 0) ? 1 : 0) : playerDirection;
    //this.checkVelocity();
    //this.velocity.y += 2; //GRAVITAS
    this.checkTerrain(terrainHash);
    this.checkObjects(objects);
    this.position.x += (this.velocity.x / 1000) * (deltaT + serverTime);
    this.position.y += (this.velocity.y / 1000) * (deltaT + serverTime);
  }

  this.click = function(coords){
    var origin = {x : this.position.x, y : this.position.y}
    return this.playerWeapon.fire(origin,coords);
  }

  this.move = function(direction,state) {
    var val = (state) ? 10 : -10;
    switch(direction) {
      case "left":
        this.velocity.x -= val;
        playerDirection = 0;
        break;
      case "right":
        playerDirection = 1;
        this.velocity.x += val;
        break;
      case "down":
        this.velocity.y += val;
        break;
      case "up":
        this.velocity.y -= val;
        break;
    }
  }

  this.checkVelocity = function(){
    for (v in this.velocity){
      this.velocity[v] = (this.velocity[v] > this.maxSpeed) ? this.maxSpeed : this.velocity[v];
      this.velocity[v] = (this.velocity[v] < -this.maxSpeed) ? -this.maxSpeed : this.velocity[v];
    }
  }

  this.checkTerrain = function(terrainHash){

  }

  this.checkObjects = function(objects){

  }

  this.playerColor = {
    0:'rgba(255,0,0,1.0)',
    1:'rgba(0,255,0,1.0)',
    2:'rgba(0,100,255,1.0)',
    3:'rgba(0,255,255,1.0)',
    4:'rgba(255,255,0,1.0)',
    5:'rgba(255,100,200,1.0)'
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.position = data.position;
   this.health = data.health;
   this.kills = data.kills;
  }

  this.draw = function(context,offset) {
    if (img){
    var xSpriteOffset = (30*playerDirection);
    context.drawImage(img,
           xSpriteOffset,0,
           30,40,
          (this.position.x-15)-offset.x,(this.position.y-20)-offset.y,
           30,40);
   }
  }


  this.click_message = function(type,coords) {
    return {playerId: this.id, 'type':type, 'coords':coords}
  }

  this.wound = function(dmg){
    this.health -= dmg;
    if (this.health <= 0){
      return true;
    }
    return false;
  }

  this.action_message = function (key_id, state){
    var msg = {playerId : this.id, 'type': 'move', 'state':state};
    switch(key_id) {
      case 65:
        //left
        msg['val'] = 'left';
        break;
      case 68:
        //right
        msg['val'] = 'right';
        break;
      case 83:
        //down
        msg['val'] = 'down';
        break;
      case 87:
        //up
        msg['val'] = 'up';
        break;
      default:
        msg = null;
    }
    return msg;
  }
}


}) (typeof exports === 'undefined'? this['playerModel']={}: exports);
