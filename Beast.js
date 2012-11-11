(function(exports) {

exports.Beast = function(bid,origin) {

  this.id = bid;
  this.position = origin;
  this.target = {'x':500,'y':500};
  this.velocity = {'x':0,'y':0};
  var maxSpeed = 100;
  this.angle;
  this.health = 10;
  this.attackTimer = 0;
  this.attackCooldown = 10;
  this.damage = 5;
  this.range = 15;
  this.animationFrame = 0;

  this.setVelocity = function(){
    this.angle = Math.atan2((this.position.y-this.target.y) , (this.target.x-this.position.x)) + (Math.PI / 2);
    this.velocity.x = Math.sin(this.angle) * maxSpeed;
    this.velocity.y = Math.cos(this.angle) * maxSpeed;
  }

  this.update = function(lastUpdate, game_state){
    this.attackTimer += 1;
    this.animationFrame += 1;
    this.updateBehavior(game_state);
    var deltaT = Date.now() - lastUpdate;
    this.position.x += (this.velocity.x / 1000) * deltaT;
    this.position.y += (this.velocity.y / 1000) * deltaT;
  }

  this.wound = function(dmg){
    this.health -= dmg;
    if (this.health <= 0){
      return true;
    }
    return false;
  }

  this.attack = function(d){
    if (d <= this.range && this.attackTimer >= this.attackCooldown){
      this.attackTimer = 0;
      return this.damage;
    }
  }

  this.updateBehavior = function(game_state) {
    var min_dist=999999;
    for (p in game_state.players){
      var d = this.dist(this, game_state.players[p]);
        if (d < min_dist){
          this.target.x = game_state.players[p].position.x;
          this.target.y = game_state.players[p].position.y;
          min_dist = d;
        }
    if (Math.floor(Math.random()*2)){
      this.flock(game_state.beasts);
    }
    this.setVelocity();
    }
  }

  this.flock = function(beasts){
    for (b in beasts){
      if (b == this.id) {continue;}
      var d = this.dist(this, beasts[b]);
      if (d < 70) {
          this.target.x += 2000 / (beasts[b].velocity.x+40);
          this.target.y += 2000 / (beasts[b].velocity.y+40);
      }
    }
  }

  this.serverPush = function(data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.position = data.position;
   this.velocity = data.velocity;
   this.target = data.target;
  }

  this.artAsset = function() {
    if (this.animationFrame > 20) {
      if (this.animationFrame > 40) {
        this.animationFrame = 0;
      }
      return ":!";
    }
    return ":V";
  }

  this.dist = function(obj1, obj2) {
    if (obj1 && obj2){
      return Math.sqrt(Math.pow((obj2.position.x - obj1.position.x),2)+Math.pow((obj2.position.y-obj1.position.y),2));
    }
  }
}


}) (typeof exports === 'undefined'? this['beast']={}: exports);
