(function(exports) {

exports.Player = function(pid,server,player_img,weapon,ammo,hitBox,shitLord) {


  if (!(typeof require === 'undefined')){
    var ammo = require('./Ammo.js');
    var hitBox = require('./HitBox.js');
    var shitLord = require('./ShitLord.js');
  }

  this.id = pid;
  this.position = {};
  this.position.x = 100;
  this.position.y = 100;
  this.velocity = {x:0,y:0};
  this.deltaV = {x:0,y:0};
  this.playerWeapon = new weapon.Weapon(this.id,ammo);
  var serverTime = server ? 0 : 0;
  this.maxHealth = 100;
  this.health = 100;
  this.animationFrame = 0;
  var animationLength = 4;
  var animationCount = 0;
  var animationInterval = 10;
  var attackAnimationInterval = 5;
  this.kills = 0;
  this.playerDirection = 0;
  this.jump_ready = false;
  this.jump_count = 0;
  this.attack1_count = 0;
  this.attack2_count = 0;
  var moveFlags = {left:false,right:false,up:false,down:false}
  var img = player_img;
  this.state = "stand";
  var attack_states = {"attack1":true,"attack2":true,"air1":true,"air2":true,"land":true}
  var used_d_jump = false;
  var used_jump = false;
  var character = shitLord.ShitLord();

  this.receive_attack = function(player, target, hitBoxFriend, hitBoxFoe){
    if(character){
      character.receive_attack(player, target, hitBoxFriend, hitBoxFoe);
    }
  }

  this.poly = function(){
    if(character){
      return character.poly(this.position);
    }
  }

  this.update_state = function(msg){
    var ret;
    switch(msg.type){
      case 'move':
        this.move(msg.val, msg.state);
        break;
      case 'click':
        ret = this.click(msg.coords, msg.which)
        break;
    }
    return ret;
  }

  this.update = function(lastUpdate){
    var interv = (attack_states[this.state]) ? attackAnimationInterval : animationInterval;
    if(animationCount == interv){
      this.animationFrame += 1;
      animationCount = 0;
    }else{
      animationCount += 1;
    }
    if (this.state == "land" && this.animationFrame == 2){
      this.state = "stand";
      this.animationFrame = 0;
    }else if (this.animationFrame == animationLength) {
      this.animationFrame = 0;
      if(attack_states[this.state]){
        if(this.jump_ready){
          this.state = "stand";
        }else{
          this.state = "jump";
        }
      }
    }
    var move_val = 20
    if (moveFlags.left){
      this.velocity.x -= move_val;
    }
    if (moveFlags.right){
      this.velocity.x += move_val;
    }
    if (moveFlags.up){
     // this.velocity.y -= val;
    }
    if (moveFlags.down){
     // this.velocity.y += val;
    }

    var deltaT = Date.now() - lastUpdate;

    this.velocity.y += 30; //GRAVITAS
    this.deltaV.x = (this.velocity.x / 1000) * (deltaT + serverTime);
    this.deltaV.y = (this.velocity.y / 1000) * (deltaT + serverTime);
    //air friction
    this.deltaV.x = this.deltaV.x * 0.9;
    this.deltaV.y = this.deltaV.y * 0.9;
    this.check_terrain();
    this.position.x += this.deltaV.x;
    this.position.y += this.deltaV.y;
    this.velocity.x = (this.deltaV.x * 1000) / (deltaT + serverTime);
    this.velocity.y = (this.deltaV.y * 1000) / (deltaT + serverTime);

     if(this.state == "land"    ||
        this.state == "attack1" ||
        this.state == "attack2" ||
        this.state == "air1"    ||
        this.state == "air2"){

    }else if (!this.jump_ready){
      this.state = "jump";
    }else if (moveFlags.left || moveFlags.right){
      this.state = "walk";
    }else{
      this.state = "stand";
    }
  }

  this.check_terrain = function(){
    var modX = this.position.x + this.deltaV.x;
    var modY = this.position.y + this.deltaV.y;
    if (modY >= 555) {
      if(!this.jump_ready){
        this.state = "land";
        this.animationFrame = 0;
        animationCount = 0;
      }
      this.jump_ready = true;
      used_d_jump = false;
      if(this.deltaV.y > 0){
        this.deltaV.y -= modY-555;
      }
    }else {
      this.jump_ready = false;
    }
  }

  this.click = function(coords,which){
    var origin = {x : this.position.x, y : this.position.y}

    var msg;
    character = shitLord;
    switch(which){
      case 1:
        if(attack_states[this.state]){break;}
        this.state = (!this.jump_ready) ? "air1" : "attack1";
        this.animationFrame = 0;
        animationCount = 0;
        msg = character.create_attack(this.state,hitBox,this);
        break;
      case 3:
        if(!this.jump_ready){
          if(!used_d_jump){
            this.state = "air2";
            this.velocity.y -= 600;
            used_d_jump = true;
            this.animationFrame = 0;
            animationCount = 0;
            msg = character.create_attack(this.state,hitBox,this);
          }
        }else{
          if(attack_states[this.state]){break;}
          this.state = "attack2";
          this.animationFrame = 0;
          animationCount = 0;
          msg = character.create_attack(this.state,hitBox,this);
        }
        break;
    }
    if(msg){
      return [msg];
    }
  }

  this.move = function(direction,state) {
    var val = (state) ? 100 : -100;
    switch(direction) {
      case "left":
        moveFlags.left = state;
        this.playerDirection = 1;
        break;
      case "right":
        moveFlags.right = state;
        this.playerDirection = 0;
        break;
      case "down":
        moveFlags.down = state;
        break;
      case "up":
        moveFlags.up = state;
        break;
      case "jump":
        if (state && this.jump_ready){
          this.velocity.y -= 800;
          this.jump_ready = false;
          this.animationFrame = 0;
          animationCount = 0;
        }
        break;
    }
  }

  this.playerColor = {
    0:'rgba(255,0,0,1.0)',
    1:'rgba(0,255,0,1.0)',
    2:'rgba(0,100,255,1.0)',
    3:'rgba(0,255,255,1.0)',
    4:'rgba(255,255,0,1.0)',
    5:'rgba(255,100,200,1.0)'
  }

  this.draw = function(context) {
    var ySpriteOffset = 720*this.playerDirection;
    switch(this.state) {
      case "stand":
        ySpriteOffset += 0;
        break;
      case "walk":
        ySpriteOffset += 90;
        break;
      case "jump":
        ySpriteOffset += 180;
        break;
      case "attack1":
        ySpriteOffset += 270;
        break;
      case "attack2":
        ySpriteOffset += 360;
        break;
      case "land":
        ySpriteOffset += 450;
        break;
      case "air1":
        ySpriteOffset += 540;
        break;
      case "air2":
        ySpriteOffset += 630;
        break;
    }
    context.drawImage(img,
		      54*this.animationFrame,ySpriteOffset,
		      54,90,
                      (this.position.x-27),(this.position.y-45),
		      54,90
	             );
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.position = data.position;
   this.health = data.health;
   this.velocity = data.velocity;

   this.playerDirection = data.playerDirection;
   this.id = data.id;
  }

  this.click_message = function(type,coords,which) {
    return {playerId: this.id, 'type':type, 'coords':coords, 'which':which}
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
      case 32:
        //up
        msg['val'] = 'jump';
        break;
      default:
        msg = null;
    }
    return msg;
  }
}


}) (typeof exports === 'undefined'? this['playerModel']={}: exports);
