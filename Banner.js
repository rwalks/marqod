Banner = function(id,origin,targ) {

  var id
  this.position = origin;
  this.target = targ;
  this.velocity = {};
  var maxSpeed = 200;
  this.attackVal = 10;
  var serverTime = (typeof require === 'undefined') ? 0 : 0;
  var offset = true;
  var count = 0;
  var angle = (this.target && this.position) ?
    Math.atan2((this.position.y-this.target.y) , (this.target.x-this.position.x)) + (Math.PI / 2) :
    0;


  this.draw = function(canvasContext,loadPercent){
    var buffer = 30;
    var size = 20;
    var off = offset ? -3 : 3;
    canvasContext.font = size + 'px Courier';
    canvasContext.fillStyle = 'rgba(250,0,250,1.0)';
    canvasContext.fillText("    /^\\   /^\\\\    //====\\  //====\\  //====\\  //====\\  //====\\",buffer+off,size+60);
    if(loadPercent >= 0.2){
    canvasContext.fillText("   // || // ||   //    // //    // //    // //    // //    //",buffer-off,size*2+60);
    }
    if(loadPercent >= 0.4){
    canvasContext.fillText("  //  ||//  ||  //___ // //____// //   _// //    // //    //",buffer+off,size*3+60);
    }
    if(loadPercent >= 0.6){
    canvasContext.fillText(" //   //    || //    // // ||    //   //||//    // //    //",buffer-off,size*4+60);
    }
    if(loadPercent >= 0.8){
    canvasContext.fillText("//          ||//    // //  ||    \\\\__// ||\\\\___// //____//",buffer+off,size*5+60);
    }
    count += 1;
    if(count > 30){
      offset = !offset;
      count = 0;
    }
  }

  this.update = function(lastUpdate){
    var deltaT = Date.now() - lastUpdate;
    this.position.x += (this.velocity.x / 1000) * (deltaT + serverTime);
    this.position.y += (this.velocity.y / 1000) * (deltaT + serverTime);
  }

}

