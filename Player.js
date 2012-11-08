(function(exports) {

exports.Player = function(pid,server,weapon,ammo) {


  if (!(typeof require === 'undefined')){
    var weapon = require('./Weapon.js');
  }

  this.id = pid;
  this.position = {};
  this.position.x = 100;
  this.position.y = 100;
  this.velocity = {x:0,y:0};
  var velocity = this.velocity;
  this.playerWeapon = new weapon.Weapon(ammo);
  var serverTime = server ? 25 : 0;

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

  this.update = function(lastUpdate){
    var deltaT = Date.now() - lastUpdate;
    this.position.x += (velocity.x / 1000) * (deltaT + serverTime);
    this.position.y += (velocity.y / 1000) * (deltaT + serverTime);
  }

  this.click = function(coords){
    var origin = {x : this.position.x, y : this.position.y}
    return this.playerWeapon.fire(origin,coords);
  }

  this.move = function(direction,state) {
    var val = (state) ? 100 : -100;
    switch(direction) {
      case "left":
        velocity.x -= val;
        break;
      case "right":
        velocity.x += val;
        break;
      case "down":
        velocity.y += val;
        break;
      case "up":
        velocity.y -= val;
        break;
    }
    this.checkVelocity();
  }

  this.checkVelocity = function(){
    for (v in this.velocity){
      this.velocity[v] = (this.velocity[v] > 100) ? 100 : this.velocity[v];
      this.velocity[v] = (this.velocity[v] < -100) ? -100 : this.velocity[v];
    }
  }

  this.playerColor = {
    1:'rgba(255,0,0,1.0)',
    1:'rgba(0,255,0,1.0)',
    1:'rgba(0,100,255,1.0)',
    1:'rgba(0,255,255,1.0)',
    1:'rgba(255,255,0,1.0)',
    1:'rgba(255,0,255,1.0)'
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.position = data.position;
  }

  this.click_message = function(type,coords) {
    return {playerId: this.id, 'type':type, 'coords':coords}
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
