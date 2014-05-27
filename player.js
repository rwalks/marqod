(function(exports) {

exports.Player = function(pid,player_img) {

  this.id = pid;
  this.position = {};
  this.position.x = 400;
  this.position.y = 150;
  this.velocity = {x:0,y:0};
  var velocity = this.velocity;
  this.maxHealth = 100;
  this.health = 100;
  this.animationFrame = 0;
  var animationLength = 7;
  this.maxSpeed = 200;
  this.acceleration = 200;
  var img = player_img;
  var playerDirection = 1;
  this.state = 'move';
  this.colSides = {up:false,down:false,right:false,left:false};

  this.update = function(lastUpdate){
    this.animationFrame += 1;
    if (this.animationFrame > animationLength * 4) {
      this.animationFrame = 0;
      if (this.state == 'attack'){
        this.state = 'move';
      }
    }
    var deltaT = Date.now() - lastUpdate;
    playerDirection = (velocity.x != 0) ? ((velocity.x > 0) ? 1 : 0) : playerDirection;
    var deltaX = (velocity.x / 1000) * deltaT;
    var deltaY = (velocity.y / 1000) * deltaT;
    this.position.x += deltaX;
    this.position.y += deltaY;
    return {x:deltaX,y:deltaY};
  }

  this.click = function(coords){
    //var origin = {x : this.position.x, y : this.position.y}
    this.state = 'attack'; 
    this.animationFrame = 0;
  }

  this.move = function(direction,state) {
    var val; 
    switch(direction) {
      case "left":
        val = (this.colSides.left) ? 0 : ((state) ? this.acceleration : this.velocity.x);
        velocity.x -= val;
        break;
      case "right":
        val = (this.colSides.right) ? 0 : ((state) ? this.acceleration : -this.velocity.x);
        velocity.x += val;
        break;
      case "down":
        val = (this.colSides.down) ? 0 : ((state) ? this.acceleration : -this.velocity.y);
        velocity.y += val;
        break;
      case "up":
        val = (this.colSides.up) ? 0 : ((state) ? this.acceleration : this.velocity.y);
        velocity.y -= val;
        break;
    }
    this.checkVelocity();
  }

  this.checkVelocity = function(){
    for (v in this.velocity){
      this.velocity[v] = (this.velocity[v] > this.maxSpeed) ? this.maxSpeed : this.velocity[v];
      this.velocity[v] = (this.velocity[v] < -this.maxSpeed) ? -this.maxSpeed : this.velocity[v];
    }
  }

  this.draw = function(context,offset) {
    var xSpriteOffset = (90*playerDirection) + ((this.state == 'attack') ? 180 : 0);
    context.drawImage(img,
		      xSpriteOffset,75*Math.round(this.animationFrame/4),
		      90,75,
                      (this.position.x-38)-offset.x,(this.position.y-10)-offset.y,
		      90,75
	             );
  }

  this.wound = function(dmg){
    this.health -= dmg;
    if (this.health <= 0){
      return true;
    }
    return false;
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
