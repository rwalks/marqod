(function(exports) {

exports.Wall = function(id, pos, vert) {

  this.id = id;
  this.position = pos;
  this.vertical = vert;
  this.health = 10;

  this.bustup = function(dmg){
    this.health -= dmg;
    return this.health <= 0; 
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.health = data.health;
  }

  this.artAsset = function() {
    return this.vertical ? '|' : '--';
  }
}


}) (typeof exports === 'undefined'? this['wall']={}: exports);
