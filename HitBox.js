(function(exports) {

exports.HitBox = function(id,points,force,type,owner,duration,shield,rOffset,force_vector) {
  this.id = id;
  this.points = points;
  this.type = type;
  this.pid = owner;
  this.valid = true;
  this.step = 0;
  this.shield = shield;
  var rOffset = rOffset;
  this.force = force;
  this.force_vector = force_vector;

  this.update = function(lastUpdate){
    this.step += 1;
    if (this.step > duration){
      this.valid = false;
    }
  }

  this.poly = function(player){
    x = player.position.x;
    y = player.position.y;
    var xMod = (player.playerDirection == 0) ? 1 : -1;
    var offset = (player.playerDirection == 0) ? 0 : rOffset;
    return [[(x+this.points[0]*xMod)+offset,y+this.points[1]],
            [x+(this.points[2]*xMod),y+this.points[3]],
            [x+(this.points[4]*xMod),y+this.points[5]],
            [(x+this.points[6]*xMod)+offset,y+this.points[7]]];
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.steps = data.steps;
   this.valid = data.valid;
   this.player = data.pid;
   this.force = data.force;
   this.force_vector = data.force_vector;
   this.shield = data.shield;
  }
}


}) (typeof exports === 'undefined'? this['hitBox']={}: exports);
