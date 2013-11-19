(function(exports) {

exports.Terrain = function(wBound,hBound) {

  var id = 0;
  this.surfaceMap = {};
  this.bgMaps = {};
  this.widthMax = wBound;
  this.heightMax = hBound;
  this.terrainInterval = 25;
  this.starField = {};
  this.starScale = 10;
  this.bgInterval = 25;

  this.generateTerrain = function(){
    this.surfaceMap = this.generateMap(0,this.widthMax,this.terrainInterval,false);
  }

  this.generateBG = function(){
    this.generateStars();
    this.bgMaps[5] = this.generateMap(0,this.widthMax/5,this.bgInterval,5);
    this.bgMaps[10] = this.generateMap(0,this.widthMax/10,this.bgInterval,10);
  }

  this.generateStars = function(){
    this.starField = {};
    var w = ((this.widthMax/this.starScale) > 800) ? this.widthMax/this.starScale : 800;
    for(var i = 0; i < w; i++){
      if(Math.random()<0.7){
       this.starField[i] = Math.floor(Math.random() * (this.heightMax*4))-(this.heightMax*3);
      }
    }
  }

  this.generateMap = function(yOffset,width,interv,bgInt){
    if(this.bgInt && !this.surfaceMap){return {};}
    var tMap = {};
    var interval = interv || this.terrainInterval
    var mid = (this.heightMax*0.8) + yOffset;
    var last = mid;
    for(var i=-600;i<=width+600;i+= interval){
      var variance = Math.random()
      if (variance < 0.98) {
        variance = bgInt ? 15 : 30;
      }else{
        variance = bgInt ? 40 : 500;
      }
      var v = Math.floor((Math.random()*variance)-(variance/2));
      v = last + v;
      if (v > (this.heightMax*0.98)) {v = this.heightMax*0.98;}
      if (v < (this.heightMax*0.05)) {v = this.heightMax*0.05;}
      if(bgInt){
        var sMapY = 0;
        for(var j = i*bgInt;j<(i*bgInt)+(bgInt*this.terrainInterval);j+=this.terrainInterval){
         sMapY += this.surfaceMap[j];
        }
        sMapY = sMapY/bgInt;
        v = (v > sMapY - bgInt) ? sMapY - (Math.random() * bgInt) - bgInt : v;
        v = (v > (sMapY - (bgInt * 25))) ? v : sMapY - (Math.random() * 75);
        tMap[i] = v;
        last = tMap[i];
      }else{
        tMap[i] = v;
        last = v;
      }
    }
    return tMap;
  }

  this.update = function(){
  }

  this.draw = function(bufferContext,offset){
    //terrain
    bufferContext.fillStyle = 'rgba(200,10,50,1.0)';
    bufferContext.beginPath();
    bufferContext.moveTo(0,1000);
    for(var x = (offset.x - (offset.x % this.terrainInterval)); x <= (offset.x + 825); x += this.terrainInterval){
      bufferContext.lineTo(x-offset.x,this.surfaceMap[x]-offset.y);
    }
    bufferContext.lineTo(1000,1000);
    bufferContext.closePath();
    bufferContext.fill();
  }

  this.drawBG = function(bufferContext,offset){
  //drawStars
    for(var x = Math.floor(offset.x/this.starScale)-1; x <= ((offset.x/this.starScale) + 801); x++){
      if(this.starField[x]){
        bufferContext.font = '20px georgia';
        bufferContext.fillStyle = 'rgba(250,250,250,1.0)';
        bufferContext.fillText('.',x-(offset.x/this.starScale),this.starField[x]-offset.y);
      }
    }
    //drawBgs
    for(var i in Object.keys(this.bgMaps)){
      var bgScale = Object.keys(this.bgMaps).reverse()[i];
      var pMap = this.bgMaps[bgScale];
      bufferContext.fillStyle = 'rgba('+(200-(bgScale*15))+',10,50,1.0)';
      bufferContext.beginPath();
      bufferContext.moveTo(0,1000);
      for(var x = ((offset.x/bgScale) - ((offset.x/bgScale) % this.bgInterval)); x <= ((offset.x/bgScale) + 825); x += this.bgInterval){
        bufferContext.lineTo(x-(offset.x/bgScale),pMap[x]-offset.y);
      }
      bufferContext.lineTo(1000,1000);
      bufferContext.closePath();
      bufferContext.fill();
    }
  }

  this.drawBorders = function(bufferContext,offset){
  }

  this.serverPush = function (data) {
   this.surfaceMap = data.surfaceMap;
  }

}


}) (typeof exports === 'undefined'? this['terrain']={}: exports);
