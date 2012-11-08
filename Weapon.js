(function(exports) {

exports.Weapon = function(ammoM) {
  var ammo = ammoM;
  if (!(typeof require === 'undefined')){
    ammo = require('./Ammo.js');
  }

  var type;
  var lastFire = +new Date;
  var refireRate = 00;

  this.fire = function(pos, coords) {
    if ((Date.now() - lastFire) > refireRate){
      var am = new ammo.Ammo(0, pos, coords);
      lastFire = Date.now();
      return [am];
    }
    return [];
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.lastFire = data.lastFire;
  }

}


}) (typeof exports === 'undefined'? this['weapon']={}: exports);
