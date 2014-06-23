(function(exports) {

exports.Player = function(pid,server,player_img,models) {


  if (!(typeof require === 'undefined')){
    var ammo = require('./Ammo.js');
    var hitBox = require('./HitBox.js');
    var shitLord = require('./ShitLord.js');
  }

  var ammo = models.ammo;
  var hitBox = models.hitBox;
  var shitLord = models.shitLord;
  this.id = pid;
  this.position = {};
  this.position.x = [390,120,550][Math.floor(Math.random() * 3)];
  this.position.y = 85;
  this.velocity = {x:0,y:0};
  this.deltaV = {x:0,y:0};
  this.maxHealth = 100;
  this.health = 100;
  this.animationFrame = 0;
  var animationLength = 4;
  var animationCount = 0;
  var animationInterval = 10;
  var attackAnimationInterval = 5;
  this.kills = 0;
  this.totalKills;
  this.totalDeaths;
  this.playerDirection = 0;
  this.jump_ready = false;
  this.walking = false;
  this.jump_count = 0;
  this.attack1_count = 0;
  this.attack2_count = 0;
  var moveFlags = {left:false,right:false,up:false,down:false}
  var img = player_img;
  this.state = "jump";
  var attack_states = {"attack1":true,"attack2":true,"air1":true,"air2":true,"land":true}
  var used_d_jump = false;
  var used_jump = false;
  var character = shitLord.ShitLord();
  this.name;
  this.playerNum;
  this.spawn_count=0;
  character = shitLord;
  var groundCol = 0;
  this.charName = "shitLord";

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

  this.update = function(lastUpdate,latency,tiles){
    if(this.spawn_count > 0){ this.spawn_count -= 1;}
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
        if(this.walking){
          this.state = "stand";
        }else{
          this.state = "jump";
        }
      }
    }
    if(this.spawn_count <= 0){
      var move_val = character.mov_val;
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

      this.velocity.y += character.grav_val; //GRAVITAS
      this.deltaV.x = (this.velocity.x / 1000) * (deltaT + latency);
      this.deltaV.y = (this.velocity.y / 1000) * (deltaT + latency);
      //air friction
      this.deltaV.x = this.deltaV.x * 0.9;
      this.deltaV.y = this.deltaV.y * 0.9;
      this.check_terrain(tiles);

      this.position.x += this.deltaV.x;
      this.position.y += this.deltaV.y;
      this.velocity.x = (this.deltaV.x * 1000) / (deltaT + latency);
      this.velocity.y = (this.deltaV.y * 1000) / (deltaT + latency);

    }
     if(this.state == "land"    ||
        this.state == "attack1" ||
        this.state == "attack2" ||
        this.state == "air1"    ||
        this.state == "air2"){

    }else if (!this.walking){
      this.state = "jump";
    }else if (moveFlags.left || moveFlags.right){
      this.state = "walk";
    }else{
      this.state = "stand";
    }
    // console.log(this.state+" :: " +this.walking);
  }

  this.check_terrain = function(tiles){
    var modX = this.position.x + this.deltaV.x;
    var modY = this.position.y + this.deltaV.y;
    var pol = this.poly();
    var maxX = pol[0][0];
    var minX = pol[0][0];
    var maxY = pol[0][1];
    var minY = pol[0][1];
    for(p in pol){
      if(pol[p][0] > maxX){maxX = pol[p][0];}
      if(pol[p][0] < minX){minX = pol[p][0];}
      if(pol[p][1] > maxY){maxY = pol[p][1];}
      if(pol[p][1] < minY){minY = pol[p][1];}
    }
    //find range of motion
    var minTileX = (this.deltaV.x >= 0) ? minX : minX + this.deltaV.x;
    minTileX = minTileX - (minTileX % 20);
    var minTileY = (this.deltaV.y >= 0) ? minY : minY + this.deltaV.y;
    minTileY = minTileY - (minTileY % 20);
    var maxTileX = (this.deltaV.x >= 0) ? maxX + this.deltaV.x : maxX;
    maxTileX = maxTileX - (maxTileX % 20);
    var maxTileY = (this.deltaV.y >= 0) ? maxY + this.deltaV.y : maxY;
    maxTileY = maxTileY - (maxTileY % 20);
    var futurePoly = [[minTileX,minTileY],[minTileX,maxTileY],[maxTileX,maxTileY],[maxTileX,minTileY]];

    //
    //scan tiles in range of motion
    for(var y = minTileY; y <= maxTileY; y += 20){
      for(var x = minTileX; x <= maxTileX; x += 20){
        var til = tiles[x] ? tiles[x][y] : false;
        if(til){

          if (boxCollide(futurePoly,til.poly())){
            if(pointInTile([modX+27, modY],til.position)){
              //right
              this.deltaV.x = 0;
            }else if(pointInTile([modX-12, modY],til.position)){
              //left
              this.deltaV.x = 0;
            }else if(pointInTile([modX, modY+45],til.position)){
              //down
              this.deltaV.y = 0;
              groundCol = 5;
            }else if(pointInTile([modX, modY-45],til.position)){
              //up
              if(this.deltaV.y < 0){this.deltaV.y = 0;}
            }else if(pointInTile([modX+15,modY+35],til.position)){
              //bottom R
              if(this.deltaV.y > 0 && this.deltaV.x < 0){
                this.deltaV.y = 0;
                groundCol = 5;
              }
              if(this.deltaV.x > 0){this.deltaV.x = 0;}
            }else if(pointInTile([modX+22,modY-40],til.position)){
              //top R
              if(this.deltaV.y < 0){this.deltaV.y = 0;}
              if(this.deltaV.x > 0){this.deltaV.x = 0;}
            }else if(pointInTile([modX-12,modY-35],til.position)){
              //top L
              if(this.deltaV.y < 0){this.deltaV.y = 0;}
              if(this.deltaV.x < 0){this.deltaV.x = 0;}
            }else if(pointInTile([modX-12,modY+35],til.position)){
              //bottom L
              if(this.deltaV.y > 0 && this.deltaV.x > 0){
                this.deltaV.y = 0;
                groundCol = 5;
              }
              if(this.deltaV.x < 0){this.deltaV.x = 0;}
            }
            if(Math.abs(modX - til.position.x+10) < 10 && Math.abs(modY - til.position.y+10) < 10){
              this.deltaV.x = -0.5 * this.deltaV.x;
              this.deltaV.y = -0.5 * this.deltaV.y;
            }
          }
        }
      }
    }
    if(groundCol > 0){
      if(groundCol >= 5){
        this.jump_ready = true;
        used_d_jump = false;
        if(this.state == "jump"){
          this.state = "land";
          this.animationFrame = 0;
          animationCount = 0;
        }
      }
      this.walking = true;
    }else{
      this.walking = false;
    }
    groundCol = (groundCol > 0) ? groundCol - 1 : 0;
  }

  var distance = function(p1, p2) {
    if (p1 && p2){
      return Math.sqrt(Math.pow((p2[0] - p1[0]),2)+Math.pow((p2[1]-p1[1]),2));
    }
  }

  var pointInTile = function(point,tileP){
    var ret = !(point[0] < tileP.x || point[0] > (tileP.x + 20) || point[1] < tileP.y || point[1] > (tileP.y + 20));
    return ret;
  }

  this.click = function(coords,which){
    var origin = {x : this.position.x, y : this.position.y}

    var msg;
    character = shitLord;
    switch(which){
      case 1:
        if(attack_states[this.state]){break;}
        this.state = (!this.walking) ? "air1" : "attack1";
        this.animationFrame = 0;
        animationCount = 0;
        msg = character.create_attack(this.state,hitBox,this);
        break;
      case 3:
        if(!this.walking){
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
    if(this.spawn_count <= 0){
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
        if (this.jump_ready){
          this.velocity.y -= 800;
          this.jump_ready = false;
          this.walking = false;
          this.animationFrame = 0;
          animationCount = 0;
        }
        break;
    }
    }
  }

  this.playerColor = function(){
    var c;
    switch(parseInt(this.playerNum)){
      case 0:
        c = 'rgba(255,0,0,1.0)';
        break;
      case 1:
        c = 'rgba(0,255,0,1.0)';
        break;
      case 2:
        c ='rgba(0,100,255,1.0)';
        break;
      case 3:
        c = 'rgba(0,255,255,1.0)';
        break;
      case 4:
        c = 'rgba(255,255,0,1.0)';
        break;
      default:
        c = 'rgba(255,100,200,1.0)';
        break;
    }
    return c;
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
    context.font = '20px Georgia';
    context.fillStyle = this.playerColor();
    if(this.name){
      context.fillText(this.name,this.position.x-(this.name.length/2)-10,this.position.y-55);
    }
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
   this.name = data.name;
   this.playerNum = data.playerNum;
   this.spawn_count = data.spawn_count;
   this.kills = data.kills;
   this.totalKills = data.totalKills;
   this.totalDeaths = data.totalDeaths;
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

    var boxCollide = function(b1,b2){
      if(!b1 || !b2){return false;}
      var maxX = b1[0][0];
      var minX = b1[0][0];
      var maxY = b1[0][1];
      var minY = b1[0][1];
      for(p in b1){
        if(b1[p][0] > maxX){maxX = b1[p][0];}
        if(b1[p][0] < minX){minX = b1[p][0];}
        if(b1[p][1] > maxY){maxY = b1[p][1];}
        if(b1[p][1] < minY){minY = b1[p][1];}
      }
      var maxX2 = b2[0][0];
      var minX2 = b2[0][0];
      var maxY2 = b2[0][1];
      var minY2 = b2[0][1];
      for(p in b2){
        if(b2[p][0] > maxX2){maxX2 = b2[p][0];}
        if(b2[p][0] < minX2){minX2 = b2[p][0];}
        if(b2[p][1] > maxY2){maxY2 = b2[p][1];}
        if(b2[p][1] < minY2){minY2 = b2[p][1];}
      }
      var ret = !((minY > maxY2) || (maxY < minY2) || (minX > maxX2) || (maxX < minX2));
      return ret;
    }

}


}) (typeof exports === 'undefined'? this['playerModel']={}: exports);
