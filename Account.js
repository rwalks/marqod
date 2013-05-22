(function(exports) {

exports.Account = function(params) {

  this.login = params.login;
  this.salt = params.salt;
  this.hash = params.hash;
  this.inventory = params.inventory;
  this.maxWave = params.maxWave ? params.maxWave : 0;
  this.maxKills = params.maxKills ? params.maxKills : 0;
  this.session = params.session;
  this.sendData = function(){
    return {
      login:this.login,
      inventory:this.inventory,
      maxWave:this.maxWave,
      maxKills:this.maxKills,
      session:this.session
    }
  }
  this.valid_session = function(){
    if (this.session) {
      ts = this.session.substr(0,13);
      date = new Date(parseInt(ts));
      //three day timeout?
      if ((new Date() - date) < 259200000){
        return true;
      }
    }
    return false;
  }

function generate_session() {
  ts = new Date().getTime();
  bcrypt.genSalt(10, function(err,salt){
    var sal = salt;
  });
  return '' + ts + sal;
}
}

}) (typeof exports === 'undefined'? this['account']={}: exports);
