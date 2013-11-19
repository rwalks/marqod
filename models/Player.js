(function(exports) {

exports.Player = function(pid,server,weapon,ammo,player_img) {


  if (!(typeof require === 'undefined')){
    var weapon = require('./Weapon.js');
  }
  this.id = pid;
  this.position = {};
  this.position.x = 400;
  this.position.y = 100;
  this.velocity = {x:0,y:0};
  this.deltaV = {x:0,y:0};
  this.playerWeapon = new weapon.Weapon(this.id,ammo);
  var serverTime = server ? 0 : 0;
  this.maxHealth = 100;
  this.health = 100;
  this.highWave;
  this.kills = 0;
  this.maxSpeed = 200;
  this.dVec;
  var playerDirection = 0;
  var img = player_img;
  this.tPol;
  var testFlag = true;
  var walkMode = false;
  var flying = true;

  this.update_state = function(msg){
    var ret;
    switch(msg.type){
      case 'move':
        this.move(msg.val, msg.state);
        break;
      case 'click':
        ret = this.click(msg.coords)
        break;
    }
    return ret;
  }

  this.update = function(lastUpdate,terrain,objects){
    var deltaT = Date.now() - lastUpdate;
    //playerDirection = (this.velocity.x != 0) ? ((this.velocity.x > 0) ? 1 : 0) : playerDirection;
    //this.checkVelocity();
    if(flying){
      this.velocity.y += 3; //GRAVITAS
    }
    this.deltaV.x = (this.velocity.x / 1000) * (deltaT + serverTime);
    this.deltaV.y = (this.velocity.y / 1000) * (deltaT + serverTime);
    this.checkTerrain(terrain);
    this.velocity.x = (this.deltaV.x * 1000) / (deltaT + serverTime);
    this.velocity.y = (this.deltaV.y * 1000) / (deltaT + serverTime);
    this.position.x += this.deltaV.x;
    this.position.y += this.deltaV.y;
  }

  this.click = function(coords){
    var origin = {x : this.position.x, y : this.position.y}
    return this.playerWeapon.fire(origin,coords,this.velocity);
  }

  this.move = function(direction,state) {
    var dir = state ? 1 : -1;
    var val;
    if(walkMode == false){
      val = 10 * state;
    }else if(walkMode){
      val = 5 * state;
    }
    switch(direction) {
      case "left":
        this.velocity.x -= val;
        playerDirection = 0;
        break;
      case "right":
        playerDirection = 1;
        this.velocity.x += val;
        break;
      case "down":
        this.velocity.y += val;
        break;
      case "up":
        this.velocity.y -= val;
        break;
    }
  }

  this.checkVelocity = function(){
    for (v in this.velocity){
      this.velocity[v] = (this.velocity[v] > this.maxSpeed) ? this.maxSpeed : this.velocity[v];
      this.velocity[v] = (this.velocity[v] < -this.maxSpeed) ? -this.maxSpeed : this.velocity[v];
    }
  }

  this.checkTerrain = function(terrain){
    var colis = {br:{x:45,y:45},bm:{x:0,y:20},bl:{x:-45,y:45}};
    var vScale; var colAngle;
    var baseX = this.position.x + colis.bm.x;
    var baseY = this.position.y + colis.bm.y;
    for (var scale = 0;scale <= 1;scale+=0.1){
      var modX = baseX + (this.deltaV.x * scale);
      var modY = baseY + (this.deltaV.y * scale);
      this.dVec = [modX,modY];
      this.tPol = this.terrainPoly(modX,modY,terrain);
      if((modX > terrain.widthMax) || (modX < 0)){
        colAngle = 10.0 * ((this.deltaV.x > 0) ? -1 : 1);
        break;
      }
      var col = intersectPoly([baseX,baseY],[modX,modY],this.tPol);
      if (col){
        colAngle = slope(col[0],col[1]);
        break;
      }else {
       vScale = scale;
      }
    }
    if(colAngle){
      var oldX = this.deltaV.x;
      var oldY = this.deltaV.y;
      if(this.deltaV.x < 0 && colAngle > 0){
        if(colAngle > 2.0){
          this.deltaV.y = (this.deltaV.y > 0) ? 0 : this.deltaV.y;
          this.deltaV.x = 0;
        }else{
            var modX = oldX * (colAngle/10);
            this.deltaV.x = (this.deltaV.x - modX) * 0.4;
            this.deltaV.y = (this.deltaV.y + (25*(colAngle/10))) * 0.4;
            if (this.deltaV.y > 0){
              this.deltaV.y = 0;
            }
        }
      }else if(this.deltaV.x > 0 && colAngle < 0){
        if(colAngle < -2.0){
          this.deltaV.y = (this.deltaV.y > 0) ? 0 : this.deltaV.y;
          this.deltaV.x = 0;
        }else{
            var modX = oldX * (colAngle/10);
            this.deltaV.x = (this.deltaV.x - modX) * 0.4;
            this.deltaV.y = (this.deltaV.y + (25*(colAngle/10))) * 0.4;
            if (this.deltaV.y > 0){
              this.deltaV.y = 0;
            }
        }
      }else{
          this.deltaV.y = 0;
      }
      var xDif = Math.abs(this.deltaV.x/oldX);
      if(xDif > 1.0){this.deltaV.x = this.deltaV.x / xDif;}
      var yDif = Math.abs(this.deltaV.y/oldY);
      if(yDif > 1.0){this.deltaV.y = this.deltaV.y / xDif;}
      if(pointInside(baseX+this.deltaV.x,baseY+this.deltaV.y,this.tPol)){
        this.deltaV.x = 0;
        this.velocity.x = 0;
        this.deltaV.y = 0;
        this.velocity.y = 0;
      }
      flying = false;
    }else{
      flying = true;
      this.deltaV.x = this.deltaV.x * (vScale ? vScale : 0);
      this.deltaV.y = this.deltaV.y * (vScale ? vScale : 0);
    }
  }

  this.terrainPoly = function(cX,cY,terrain){
    var leftX = cX-(cX%terrain.terrainInterval);
    var polyPoints = [];
    for (var i = leftX-(terrain.terrainInterval*6); i <= leftX+(terrain.terrainInterval*6); i += terrain.terrainInterval){
      polyPoints.push([i,terrain.surfaceMap[i]]);
    }
    polyPoints.push([leftX,terrain.heightMax*10]);
    return polyPoints;
  }

  function checkObjects(objects){
  }

  this.playerColor = {
    0:'rgba(255,0,0,1.0)',
    1:'rgba(0,255,0,1.0)',
    2:'rgba(0,100,255,1.0)',
    3:'rgba(0,255,255,1.0)',
    4:'rgba(255,255,0,1.0)',
    5:'rgba(255,100,200,1.0)'
  }

  this.serverPush = function (data) {
    //for (field in data) {
    //  this[field] = data[field];
   // }
   this.position = data.position;
   this.health = data.health;
   this.kills = data.kills;
   this.velocity = data.velocity;
  }

  this.drawCollis = function(bufferContext,offset){
    if(this.tPol && this.dVec){
      bufferContext.fillStyle = 'rgba(250,0,0,1.0)';
      bufferContext.beginPath();
      bufferContext.moveTo(this.tPol[0][0]-offset.x,this.tPol[0][1]-offset.y);
      var slicePoints = this.tPol.slice(1);
      for(var i in slicePoints){
        bufferContext.lineTo(slicePoints[i][0]-offset.x,slicePoints[i][1]-offset.y);
      }
      bufferContext.closePath();
      bufferContext.fill();
      bufferContext.fillStyle = 'rgba(0,0,250,1.0)';
      bufferContext.fillRect(this.dVec[0]-1-offset.x,this.dVec[1]-1-offset.y,2,2);
    }
  }

  this.draw = function(context,offset) {
    if (img){
    var xSpriteOffset = (30*playerDirection);
    context.drawImage(img,
           xSpriteOffset,0,
           30,40,
          (this.position.x-15)-offset.x,(this.position.y-20)-offset.y,
           30,40);
   }
  }


  this.click_message = function(type,coords) {
    return {playerId: this.id, 'type':type, 'coords':coords}
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

function intersectPoly(orig,targ,polyPoints){
  var intersect = false;
  var intersectPair;
  var p1; var p2; var p3;
  for(var i=0;i<polyPoints.length;i++){
    p1 = polyPoints[i];
    p2 = polyPoints[i+1];
    if (!p2){ p2 = polyPoints[0];}
    if (intersectPoints(p1,p2,orig,targ)){
      intersect = !intersect;
      intersectPair = [p1,p2];
    }
  }
    if (intersect && intersectPair) {
      return intersectPair;
    }
    return false;
}

function CCW(p1,p2,p3){
  var a = p1[0]; var b = p1[1];
  var c = p2[0]; var d = p2[1];
  var e = p3[0]; var f = p3[1];
  return (f - b) * (c - a) > (d - b) * (e - a);
}

function intersectPoints(p1,p2,p3,p4){
  return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
}

function slope(p1,p2){
  return (p1[1] - p2[1]) / (p1[0] - p2[0]);
}

function pointInside(x,y,vs) {
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) {
          inside = !inside;
        }
    }
    return inside;
};

}


}) (typeof exports === 'undefined'? this['playerModel']={}: exports);


