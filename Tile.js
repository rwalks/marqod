(function(exports) {

exports.Tile = function(pos,type,img) {
  this.position = pos;
  this.type = type;
  this.img = img;

  this.poly = function(){
    return [[this.position.x,this.position.y],
            [this.position.x+20,this.position.y],
            [this.position.x+20,this.position.y+20],
            [this.position.x,this.position.y+20]];
  }

  this.draw = function(context) {
    var xOff;
    switch(this.type){
      case '<':
        xOff = 0;
        break;
      case '>':
        xOff = 40;
        break;
      case '0':
        xOff = 20;
        break;
      case '|':
        xOff = 60;
        break;
    }
    context.drawImage(img,
		      xOff,0,
		      20,20,
          this.position.x,this.position.y,
		      20,20
	             );
  }

  
}


}) (typeof exports === 'undefined'? this['tile']={}: exports);
