(function(exports) {

exports.Account = function(login,salt,hash) {

  this.login = login;
  this.salt = salt;
  this.hash = hash;
  this.inventory = {};
  this.highWave = 0;
  this.mostKills = 0;
  this.sendData = function(){
    return {
      login:this.login,
      inventory:this.inventory,
      highWave:this.highWave,
      mostKills:this.mostKills
    }
  }

}

}) (typeof exports === 'undefined'? this['account']={}: exports);
