(function(exports) {

exports.Terrain = function(wBound,hBound) {

  var id = 0;
  this.surfaceMap = {};
  var widthMax = wBound;
  var heightMax = hBound;

  this.generateTerrain = function(){
    var mid = heightMax*0.8;
    var last = mid;
    for(var i=-600;i<=widthMax+600;i+=25){
      var variance = Math.random()
      if (variance < 0.98) {
        variance = 30;
      }else{
        variance = 500;
      }
      var v = Math.floor((Math.random()*variance)-(variance/2));
      v = last + v;
      if (v > (heightMax*0.98)) {v = heightMax*0.98;}
      if (v < (heightMax*0.05)) {v = heightMax*0.05;}
      this.surfaceMap[i] = v;
      last = v;
    }
  }

  this.update = function(){
  }

  this.serverPush = function (data) {
   this.surfaceMap = data.surfaceMap;
  }

}


}) (typeof exports === 'undefined'? this['terrain']={}: exports);
