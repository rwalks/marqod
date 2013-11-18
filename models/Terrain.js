(function(exports) {

exports.Terrain = function(wBound,hBound) {

  var id = 0;
  this.surfaceMap = {};
  this.widthMax = wBound;
  this.heightMax = hBound;
  this.terrainInterval = 25;

  this.generateTerrain = function(){
    var mid = this.heightMax*0.8;
    var last = mid;
    for(var i=-600;i<=this.widthMax+600;i+= this.terrainInterval){
      var variance = Math.random()
      if (variance < 0.98) {
        variance = 30;
      }else{
        variance = 500;
      }
      var v = Math.floor((Math.random()*variance)-(variance/2));
      v = last + v;
      if (v > (this.heightMax*0.98)) {v = this.heightMax*0.98;}
      if (v < (this.heightMax*0.05)) {v = this.heightMax*0.05;}
      this.surfaceMap[i] = v;
      last = v;
    }
  }

  this.update = function(){
  }

  this.draw = function(bufferContext,offset){
    bufferContext.fillStyle = 'rgba(200,10,50,0.6)';
    bufferContext.beginPath();
    bufferContext.moveTo(0,1000);
    for(var x = (offset.x - (offset.x % this.terrainInterval))-425; x <= (offset.x + 825); x += this.terrainInterval){
      bufferContext.lineTo(x-offset.x,this.surfaceMap[x]-offset.y);
    }
    bufferContext.lineTo(1000,1000);
    bufferContext.closePath();
    bufferContext.fill();
  }

  this.drawBorders = function(bufferContext,offset){
  }

  this.serverPush = function (data) {
   this.surfaceMap = data.surfaceMap;
  }

}


}) (typeof exports === 'undefined'? this['terrain']={}: exports);
