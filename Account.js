(function(exports) {

exports.Account = function(params) {

  this.login = params.login;
  this.salt = params.salt;
  this.hash = params.hash;
  this.inventory = params.inventory;
  this.maxWave = params.maxWave ? params.maxWave : 0;
  this.maxKills = params.maxKills ? params.maxKills : 0;
  this.maxDeaths = params.maxDeaths ? params.maxDeaths : 0;
  this.sendData = function(){
    return {
      login:this.login,
      inventory:this.inventory,
      maxWave:this.maxWave,
      maxKills:this.maxKills,
      maxDeaths:this.maxDeaths
    }
  }

}

}) (typeof exports === 'undefined'? this['account']={}: exports);
