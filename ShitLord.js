(function(exports) {

exports.ShitLord = function() {

  this.poly = function(position){
    x = player.position.x;
    y = player.position.y;
    return [[x-20,y-43],[x+20,y-43],[x+20,y+43],[x-20,y+43]];
  }

  this.create_attack = function(type,hitBox,player){
    var hb;
    switch(type){
      case "attack1":
        var points = [0,-20,
                      30,-20,
                      30,2,
                      0,2
                     ];
        var force = 100;
        var offset = 0;
        hb = new hitBox.HitBox(0,points,force,'attack1',player.id,20,false,offset);
        break;
      case "attack2":
        var points = [10,-30,
                      30,-30,
                      30,50,
                      10,50
                     ];
        var force = 100;
        var offset = 0;
        hb = new hitBox.HitBox(0,points,force,'attack2',player.id,20,false,offset);
        break;
      case "air1":
        var points = [0,-20,
                      30,-20,
                      30,2,
                      0,2
                     ];
        var force = 100;
        var offset = 30;
        hb = new hitBox.HitBox(0,points,force,'air1',player.id,20,false,offset);
        break;
      case "air2":
        var points = [0,-20,
                      30,-20,
                      30,2,
                      0,2
                     ];
        var force = 100;
        var offset = 30;
        hb = new hitBox.HitBox(0,points,force,'air2',player.id,20,false,offset);
        break;
    }
    return hb;
  }

  this.receive_attack = function(player, target, hitBoxFriend, hitBoxFoe){
    switch(hitBoxFriend.type){
      case "attack1":
        target.velocity.y -= 100;
        break;
      case "attack2":
        break;
      case "air1":
        break;
      case "air2":
        break;
    }
  }

}
}) (typeof exports === 'undefined'? this['shitLord']={}: exports);
