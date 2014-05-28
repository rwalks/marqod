(function(exports) {

exports.Animation = function(aid,position,type,img) {

  this.id = aid;
  this.position = position;
  var animationCount = 0;
  var interv = 5;
  var animationFrame = 0;
  var animationLength = 8;

  this.update = function(){
    if(animationCount == interv){
      animationFrame += 1;
      animationCount = 0;
    }else{
      animationCount += 1;
    }
    if (animationFrame >= animationLength) {
      return true;
    }
    return false;
  }

  this.draw = function(context) {
    context.drawImage(img,
		      180*animationFrame,0,
		      180,180,
          (this.position.x-100),(this.position.y-120),
		      180,180
	             );
  }

}


}) (typeof exports === 'undefined'? this['animation']={}: exports);
