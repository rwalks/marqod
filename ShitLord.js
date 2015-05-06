(function(exports) {

exports.ShitLord = function() {

  this.grav_val = 20;
  this.mov_val = 35;

  this.poly = function(position){
    x = position.x;
    y = position.y;
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
        var force = 200;
        var offset = 0;
        var force_vector = [1,0];
        hb = new hitBox.HitBox(0,points,force,'attack1',player.id,20,false,offset,force_vector);
        break;
      case "attack2":
        var points = [10,-30,
                      30,-30,
                      30,50,
                      10,50
                     ];
        var force = 100;
        var offset = 0;
        var force_vector = [1,0];
        hb = new hitBox.HitBox(0,points,force,'attack2',player.id,20,false,offset,force_vector);
        break;
      case "air1":
        var points = [0,0,
                      35,0,
                      35,50,
                      0,50
                     ];
        var force = 150;
        var offset = 0;
        var force_vector = [1,1];
        hb = new hitBox.HitBox(0,points,force,'air1',player.id,20,false,offset,force_vector);
        break;
      case "air2":
        var points = [-20,0,
                      20,0,
                      20,40,
                      -20,40
                     ];
        var force = 300;
        var offset = 0;
        var force_vector = [0,1];
        hb = new hitBox.HitBox(0,points,force,'air2',player.id,20,false,offset,force_vector);
        break;
    }
    return hb;
  }

  this.receive_attack = function(player, target, hitBoxFriend, hitBoxFoe){
    switch(hitBoxFriend.type){
      case "attack1":
        var val = (player.playerDirection == 0) ? hitBoxFriend.force : hitBoxFriend.force * -1;
        target.velocity.x += (val*hitBoxFriend.force_vector[0]);
        target.velocity.y += (val*hitBoxFriend.force_vector[1]);
        target.last_hit = player.id;
        break;
      case "attack2":
        if(hitBoxFoe){
          fMod = 100;
          var valX = ((player.playerDirection == 0) ? hitBoxFoe.force : hitBoxFoe.force * -1) + fMod;
          var valY = hitBoxFoe.force + fMod;
          console.log("shield:: "+valX + " " + valY +" "+ hitBoxFoe.force_vector);
          target.velocity.x += (valX*hitBoxFoe.force_vector[0]);
          target.velocity.y += (valY*hitBoxFoe.force_vector[1]);
          target.last_hit = player.id;
        }else{
          target.velocity.x = -1.5 * target.velocity.x;
          target.velocity.y = -1.5 * target.velocity.y;
          target.playerDirection = (target.playerDirection == 0) ? 1 : 0;
          target.last_hit = player.id;
        }
        break;
      case "air1":
        var valX = (player.playerDirection == 0) ? hitBoxFriend.force : hitBoxFriend.force * -1;
        var valY = hitBoxFriend.force;
        target.velocity.x += (valX*hitBoxFriend.force_vector[0])
        target.velocity.y += (valY*hitBoxFriend.force_vector[1]);
        target.last_hit = player.id;
        break;
      case "air2":
        var valX = (player.playerDirection == 0) ? hitBoxFriend.force : hitBoxFriend.force * -1;
        var valY = hitBoxFriend.force;
        target.velocity.x += (valX*hitBoxFriend.force_vector[0]);
        target.velocity.y += (valY*hitBoxFriend.force_vector[1]);
        target.last_hit = player.id;
        break;
    }
  }

}
}) (typeof exports === 'undefined'? this['shitLord']={}: exports);
