(function(exports) {

exports.Wall = function(id, pos) {

  this.id = id;
  this.position = pos;
  this.health = 50;

  this.wound = function(dmg){
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
    if(this.health > 35) { 
      return '[ ]';
    }
    else if(this.health > 15) {
      return '[x]';
    }
    else {
      return '[X]';
    }
  }
}


}) (typeof exports === 'undefined'? this['wall']={}: exports);
