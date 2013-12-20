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
  var moveFlags = {left:false,right:false,up:false,down:false}
  var airTime = 5;

  var jumpCount = 0;

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
    if (jumpCount > 0) {jumpCount -= 1;}
    var val = 20;
    if (moveFlags.left){
      this.velocity.x -= (walkMode ? val : 0);
    }
    if (moveFlags.right){
      this.velocity.x += (walkMode ? val : 0);
    }
    if (moveFlags.up){
     // this.velocity.y -= val;
    }
    if (moveFlags.down){
     // this.velocity.y += val;
    }

    var deltaT = Date.now() - lastUpdate;
    //playerDirection = (this.velocity.x != 0) ? ((this.velocity.x > 0) ? 1 : 0) : playerDirection;
    //this.checkVelocity();
      this.velocity.y += 9; //GRAVITAS
    this.deltaV.x = (this.velocity.x / 1000) * (deltaT + serverTime);
    this.deltaV.y = (this.velocity.y / 1000) * (deltaT + serverTime);
    this.checkTerrain(terrain);
    //air friction
    this.deltaV.x = this.deltaV.x * 0.99;
    this.deltaV.y = this.deltaV.y * 0.94;
    this.position.x += this.deltaV.x;
    this.position.y += this.deltaV.y;
    this.velocity.x = (this.deltaV.x * 1000) / (deltaT + serverTime);
    this.velocity.y = (this.deltaV.y * 1000) / (deltaT + serverTime);
  }

  this.click = function(coords){
    var origin = {x : this.position.x, y : this.position.y}
    return this.playerWeapon.fire(origin,coords,this.velocity);
  }

  this.move = function(direction,state) {
    switch(direction) {
      case "left":
        moveFlags.left = state;
        playerDirection = 0;
        break;
      case "right":
        moveFlags.right = state;
        playerDirection = 1;
        break;
      case "down":
        moveFlags.down = state;
        break;
      case "up":
        moveFlags.up = state;
        break;
      case "jump":
        if (airTime < 3 && jumpCount == 0){
          jumpCount = 10;
          this.velocity.y -= 120;
          break;
        }
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
    var baseX = this.position.x + colis.bm.x;
    var baseY = this.position.y + colis.bm.y;
      var modX = baseX + this.deltaV.x;
      var modY = baseY + this.deltaV.y;
      if((modX > terrain.widthMax) || (modX < 0)){

      }else{
        var colLoop = true;
        while(colLoop){
          this.tPol = this.terrainPoly(modX,modY,terrain);
          var intPair = intersectPoly([baseX,baseY],[modX,modY],this.tPol);
          if (intPair){
            var vMag = this.lineLength([baseX,baseY],[modX,modY]);
            var adjNorm = this.normal(intPair[0],intPair[1],vMag, modY);
            var negSlope = (intPair[0][1] > intPair[1][1]) ? -1 : 1;
            this.deltaV.x += negSlope * (adjNorm[1][0] - adjNorm[0][0]);
            this.deltaV.y += negSlope * (adjNorm[1][1] - adjNorm[0][1]);
  
            this.deltaV.x = this.deltaV.x * 0.8;
            this.deltaV.y = this.deltaV.y * 0.8;
            modX = baseX + this.deltaV.x;
            modY = baseY + this.deltaV.y;
            if(pointInside(modX,modY,this.tPol)){
              //this.deltaV.x = 0;
             // this.deltaV.y = 0;
            }else{
              colLoop = false;
            }
  
            walkMode = true;
            airTime = 0;
          }else{
            walkMode = false;
            airTime += 1;
            colLoop = false;
          }
        }
      }
  }

this.lineLength = function(p1,p2){
  var retX = p2[0] - p1[0];
  retX = retX * retX;
  var retY = p2[1] - p1[1];
  retY = retY * retY;
  return Math.sqrt(retX + retY); 
}

this.normal = function(p1,p2,mag,targetY){
  var m = (p1[1] - p2[1]) / (p1[0] - p2[0]);
  var l = Math.abs(mag);
  m = -1 / m;
  var midX = (p1[0] + p2[0]) / 2;
  var midY = (p1[1] + p2[1]) / 2;
  var normX = midX + (l * (1/Math.sqrt(1+(m*m))));
  var normY = midY + (l * (m/Math.sqrt(1+(m*m))));
  if(!normY){ normY = midY + (midY-targetY); }
  return [[midX,midY], [normX,normY]];
}

  this.terrainPoly = function(cX,cY,terrain){
    var leftX = cX-(cX%terrain.terrainInterval);
    var polyPoints = [];
    for (var i = leftX-(terrain.terrainInterval*2); i <= leftX+(terrain.terrainInterval*3); i += terrain.terrainInterval){
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
    if(this.tPol){
      bufferContext.fillStyle = 'rgba(0,250,0,1.0)';
      bufferContext.beginPath();
      bufferContext.moveTo(this.tPol[0][0]-offset.x,this.tPol[0][1]-offset.y);
      var slicePoints = this.tPol.slice(1);
      for(var i in slicePoints){
        bufferContext.lineTo(slicePoints[i][0]-offset.x,slicePoints[i][1]-offset.y);
      }
      bufferContext.closePath();
      bufferContext.fill();
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
      case 32:
        //up
        msg['val'] = 'jump';
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
   // if(p1[0] == orig[0]){ console.log("oops");}
   // if(p1[0] == targ[0]){ console.log("oops");}
   // if(p2[0] == orig[0]){ console.log("oops");}
   // if(p2[0] == targ[0]){ console.log("oops");}
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


