function GamePro() {

    var _canvas;
    var _canvasContext;
    var _canvasBuffer;
    var _canvasBufferContext;
    var messageBuffer = [];
    var socket;
    var image1;
    var imagebg;
    var progame = this;
    var click_state, mimap_target;
    var game_engine;
    var socket;
    var player;
    this.player_img;
    var lastPlayerPos;
    var offset = {x:0,y:-300};
    var gameActive = false;
    var banner = new Banner();
    var uiMode = 'login';
    var salt;

    this.Initialize = function () {
        socket = io.connect();
        _canvas = document.getElementById('canvas');
        uiMode = 'login';
        //loadassets
        this.player_img = new Image;      // First create the image...
        this.player_img.onload = function(){  // ...then set the onload handler...
        };
        this.player_img.src = "spaceman.png";
        if (_canvas && _canvas.getContext) {

            _canvasContext = _canvas.getContext('2d');
            _canvasBuffer = document.createElement('canvas');
            _canvasBuffer.width = _canvas.width;
            _canvasBuffer.height = _canvas.height;
            _canvasBufferContext = _canvasBuffer.getContext('2d');

            game_engine = new engine.GameEngine(false, playerModel, ammo, weapon, beast, terrain, this.player_img);
            this.waveCount = $("#waveCount");
            this.waveCount.hide();
            this.killCount = $("#killCount");
            this.killCount.hide();
            this.mainMenu = $("#mainMenu");
            this.mainMenu.hide();
            this.inventoryMenu = $("#inventory");
            this.inventoryMenu.hide();
            return true;
        }
        return false;
    }

    function LoadContent (data) {
        var cookie = $.cookie("progame");
        if (cookie != null) {
            //user already finished some maps
        } else {
            $.cookie("progame", 1, { expires: 365 });
        }
        $(document).bind('keyup', function (event) {
            LocalEvent(event);
        });
        $(document).bind('keydown', function (event) {
            LocalEvent(event);
        });
        $(document).bind('click', function (event) {
          event.preventDefault();
            LocalEvent(event);
        });

  //      $("#waveCount").show();
  //      $("#killCount").show();
        uiMode = "game";
    }

    this.Run = function () {
        if (this.Initialize()) {
            // if initialization was succesfull, load content
            this.runConnection();
            game_engine.Run();
        }
    }

    this.tick = function(){
      game_engine.Update()
      this.Update();
      this.Draw();
    }

    this.menuClick = function(action){
      switch(action){
        case 'start':
          socket.emit('join');
          break;
        case 'equip':
          clearMenus();
          showInventory();
          break;
      }
    }

    function showInventory(){
      weapHtml = $("#invSelect1").html()
      for (i in inventory.weapons){
        weap = inventory.weapons[i];
        weapHtml += "<option value='"+weap.name+"'>"+weap.name+"</option>"
      }
      $("#invSelect1").html(weapHtml);
      $('#inventory').show();
      
    }

    this.submitLogin = function(create){
      var login_q = $('#login_q');
      var password_q = $('#password_q');
      var act = create ? "create" : "login";
      if(login_q.val() && password_q.val()){
        var hashPass = hashPassword(password_q.val());
        socket.emit('auth',{action:act,username:login_q.val(),password:hashPass});
      }
      login_q.val("");
      password_q.val("");
    }

    function hashPassword(str){
      hash = [];
      str = str+salt
      for (i in str){
        var c = str.charCodeAt(i);
        c = c ^ salt;
        hash.push(c);
      }
      return hash;
    }

    function LocalEvent (event) {
      if (event != null){
        var msg = '';
        switch(event.type) {
          case 'click':
            if (event.target.id == 'canvas' || event.target.class == 'controls'){
              mousePos = getPosition(event);
              msg = player.click_message('click',mousePos);
            }
            break;
          case 'keydown':
            msg = player.action_message(event.keyCode,true);
            break;
          case 'keyup':
            msg = player.action_message(event.keyCode,false);
            break;
        }
        if (msg) {
          msg.time = Date.now();
          socket.emit('msg', msg)
          game_engine.queue_message(msg);
        }
      }
    }

    this.runConnection = function() {
      socket.on('connect', function () {
        setInterval(function() {document.proGame.tick()}, 1000 / 60);
      });
      socket.on('init', function (data) {
        clearMenus();
        LoadContent();
        setPlayer(data);
        setTerrain(data);
        gameActive = true;
        setInterval(function() {document.proGame.updateMenus()}, 1000 / 10);
      });

      socket.on('push', function (data) {
        if (gameActive) {
          game_engine.pushData = data;
        }
      });

      socket.on('handshake', function (data) {
        if (data) {
          salt = data.n;
        }
      });

      socket.on('login', function (data) {
      //use data to instantiate new account and ivnentory
        if (data) {
          inventory = data.inventory;
          maxKills = data.maxKills;
          maxWave = data.maxWave;
          document.proGame.homeMenu();
        }
      });
    }

    this.homeMenu = function(){
      if (!gameActive){
        clearMenus();
        $('#mainMenu').show();
      }
    }

    function clearMenus(){
      $('#loginForm').hide();
      $('#mainMenu').hide();
      $("#waveCount").hide();
      $("#killCount").hide();
      $("#inventory").hide();
    }

    function setPlayer(msg) {
      player = new playerModel.Player(msg.playerId, false, weapon, ammo, this.player_img);
      lastPlayerPos = player.position;
    }

    function setTerrain(msg) {
      game_engine.setTerrain(msg.terrain);
    }

    function getPosition(e) {
      var targ;
      if (!e)
        e = window.event;
      if (e.target)
        targ = e.target;
      else if (e.srcElement)
        targ = e.srcElement;
      if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;
    // jQuery normalizes the pageX and pageY
    // pageX,Y are the mouse positions relative to the document
    // offset() returns the position of the element relative to the document
      var x = e.pageX - $(targ).offset().left;
      var y = e.pageY - $(targ).offset().top;
      return {"x": x+offset.x, "y": y+offset.y};
    };

    this.player = function(){
      console.log(game_engine.getPlayer(player.id).position);
      console.log(game_engine.getPlayer(player.id).velocity);
      console.log(game_engine.getPlayer(player.id).velocityPixels);
    }
    this.offset = function(){
      return offset;
    }

    this.Update = function () {
      if(player){
        var plr = game_engine.getPlayer(player.id);
        if(plr){
          var dX = (plr.position.x - lastPlayerPos.x);
          var dY = (plr.position.y - lastPlayerPos.y);
          offset.x += (plr.position.x - lastPlayerPos.x);
          offset.y += (plr.position.y - lastPlayerPos.y);
          lastPlayerPos.x = plr.position.x;
          lastPlayerPos.y = plr.position.y;
        }
      }
    }

    this.Draw = function () {
        //clear canvas
        _canvasBufferContext.clearRect(0, 0, _canvas.width, _canvas.height);
        _canvasBufferContext.globalCompositeOperation="source-over";
        _canvasBufferContext.fillStyle = 'rgba(250,250,250,0.1)';
        _canvasBufferContext.globalCompositeOperation="destination-over";
        _canvasBufferContext.fillRect(0,0,_canvas.width,_canvas.height);
        _canvasBufferContext.globalCompositeOperation="source-over";
    //bg components
        game_engine.terrain.drawBG(_canvasBufferContext, offset);
        //marqod banner
        if (uiMode == "login" || uiMode == "menu") {
            banner.draw(_canvasBufferContext);
        }
        for(var p in game_engine.game_state.players){
          var plr = game_engine.game_state.players[p];
          //draw player
          plr.draw(_canvasBufferContext,offset);
 //         plr.drawCollis(_canvasBufferContext,offset);
          //draw healthbar
          _canvasBufferContext.fillStyle = 'rgba(50,50,50,0.3)';
          _canvasBufferContext.fillRect((plr.position.x - 13) - offset.x,
                                        (plr.position.y - 20) - offset.y,
                                        30,
                                        3);
          _canvasBufferContext.fillStyle = 'rgba(200,10,10,0.6)';
          _canvasBufferContext.fillRect((plr.position.x - 13) - offset.x,
                                        (plr.position.y - 20) - offset.y,
                                        30 * (plr.health / plr.maxHealth),
                                        3);
        }
        //draw ammos
        if (game_engine.game_state.ammos != null){
          for(a in game_engine.game_state.ammos){
            var am = game_engine.game_state.ammos[a];
            if (am) {
              _canvasBufferContext.font = '20px georgia';
              _canvasBufferContext.fillStyle = 'rgba(250,0,50,1.0)';
              _canvasBufferContext.fillText("*",am.position.x-offset.x,am.position.y-offset.y);
            }
          }
        }
        if (game_engine.game_state.beasts != null){
          for(a in game_engine.game_state.beasts){
            var am = game_engine.game_state.beasts[a];
            if (am) {
              _canvasBufferContext.fillStyle = 'rgba(250,0,250,1.0)';
              _canvasBufferContext.font = '20px Helvetica';
              _canvasBufferContext.fillText(am.artAsset(),am.position.x,am.position.y);
            }
          }
        }
        //draw surface terrain
        game_engine.terrain.drawBorders(_canvasBufferContext, offset);
        game_engine.terrain.draw(_canvasBufferContext, offset);
        //this.draw_commandBar();
        //draw buffer on screen
        _canvasContext.clearRect(0, 0, _canvas.width, _canvas.height);
        //_canvasBufferContext.globalCompositeOperation="source-atop";
        _canvasContext.drawImage(_canvasBuffer, 0, 0);
    }

    this.updateMenus = function() {
      this.waveCount.text("WAVE: " + game_engine.waveCount);
      if(player){
       if (game_engine.game_state.players[player.id]){
         this.killCount.text("KILLS: " + game_engine.game_state.players[player.id].kills);
       }
      }
    }

}

function point_in_polygon(cx,cy,points) {
  within = false;
  for (i=0;i<points.length;i++){
    p1 = points.shift();
    p2 = points[0];
    if (((p1.y <= cy && cy < p2.y) || (p2.y <= cy && cy < p1.y))
    && (cx < (p2.x - p1.x) * (cy - p1.y) / (p2.y - p1.y) + p1.x))
     {within = !within;}
    points.push(p1);
  }
  return within;
}
function pointInside(x,y,vs) {
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

function distance(obj1, obj2) {
  return Math.sqrt(Math.pow((obj2.position.x - obj1.position.x),2)+Math.pow((obj2.position.y-obj1.position.y),2));
}
