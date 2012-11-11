(function(exports) {

exports.Ammo = function(id,origin,targ) {

  var id
  this.position = origin;
  this.target = targ;
  this.velocity = {};
  var maxSpeed = 200;
  this.attackVal = 10;
  var angle = (this.target && this.position) ?
    Math.atan2((this.position.y-this.target.y) , (this.target.x-this.position.x)) + (Math.PI / 2) :
    0;

  this.setVelocity = function(){
    this.velocity.x = Math.sin(angle) * maxSpeed;
    this.velocity.y = Math.cos(angle) * maxSpeed;
  }

  this.damage = function(){
    return [this.attackVal,true];
  }

  this.update = function(lastUpdate){
    var deltaT = Date.now() - lastUpdate;
    this.position.x += (this.velocity.x / 1000) * deltaT;
    this.position.y += (this.velocity.y / 1000) * deltaT;
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.position = data.position;
   this.velocity = data.velocity;
  }

  this.setVelocity();
}


}) (typeof exports === 'undefined'? this['ammo']={}: exports);
