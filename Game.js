function GamePro() {

    var _canvas; var _canvas2;
    var _canvasContext; var _canvasContext2;
    var _canvasBuffer; var _canvasBuffer2;
    var _canvasBufferContext; var _canvasBufferContext2;
    var messageBuffer = [];
    var socket;
    var image1;
    var imagebg;
    var progame = this;
    var click_state, mimap_target;
    var game_engine;
    var socket;
    var player;
    var player_img;
    var tile_img;
    var bg_img;
    var spawn_img;
    var hud_img;
    var gameActive = false;
    var banner = new Banner();
    var uiMode = 'login';
    var salt;
    var loaded = false;
    var player_id;
    var player_queue = [];
    var uiFrame = 0;
    var uiCount = 0;

    this.engine = function(){
      return game_engine();
    }

    this.Initialize = function () {
        socket = io.connect();
        _canvas = document.getElementById('canvas');
        _canvas2 = document.getElementById('canvas2');
        uiMode = 'login';
        if (_canvas && _canvas.getContext) {

            _canvasContext = _canvas.getContext('2d');
            _canvasBuffer = document.createElement('canvas');
            _canvasBuffer.width = _canvas.width;
            _canvasBuffer.height = _canvas.height;
            _canvasBufferContext = _canvasBuffer.getContext('2d');
            _canvasContext2 = _canvas2.getContext('2d');
            _canvasBuffer2 = document.createElement('canvas');
            _canvasBuffer2.width = _canvas2.width;
            _canvasBuffer2.height = _canvas2.height;
            _canvasBufferContext2 = _canvasBuffer2.getContext('2d');
            game_engine = new engine.GameEngine(false, playerModel, ammo, weapon, shitLord, hitBox, terrain, tile, animation);
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
        $(document).bind('contextmenu', function (event) {
          event.preventDefault();
          LocalEvent(event);
          return false;
        });

  	//images
        //imagebg = new Image();
        //imagebg.src = 'images/marqod.png';
        uiMode = "game";
        bg_img = new Image;
        bg_img.src = "images/paperBG.png";
        hud_img = new Image;
        hud_img.src = "images/HUD_Sheet.png";
        tile_img = new Image;
        tile_img.src = "images/tile_set.png";
        tile_img.onload = function(){
          game_engine.tile_img = tile_img;
        }
        spawn_img = new Image;
        spawn_img.src = "images/spawn.png";
        spawn_img.onload = function(){
          game_engine.spawn_img = spawn_img;
        }
        player_img = new Image;
        player_img.onload = function(){
          setPlayer(data);
          game_engine.player_img = player_img;
          game_engine.generate_level();
          gameActive = true;
        }
        player_img.src = "images/shitLord.png";
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
      this.Draw();
      this.drawUI();
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
          case 'contextmenu':
          case 'click':
            if (event.target.id == 'canvas' || event.target.class == 'controls'){
              mousePos = getPosition(event);
              msg = player.click_message('click',mousePos,event.which);
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
          game_engine.queue_message(msg);
          socket.emit('msg', msg)
        }
      }
    }

    this.runConnection = function() {
      socket.on('connect', function () {
        setInterval(function() {document.proGame.tick()}, 1000 / 60);
      });
      socket.on('init', function (data) {
        clearMenus();
        LoadContent(data);
        setInterval(function() {document.proGame.updateMenus()}, 1000 / 10);
      });

      socket.on('push', function (data) {
        if (gameActive) {
          game_engine.pushData = data;
        }
      });

      socket.on('player_event', function (msg) {
        if (gameActive) {
          game_engine.queue_message(msg);
        }
      });

      socket.on('queue', function (msg) {
        if (msg) {
          player_queue = msg.names;
          game_engine.active_players = msg.active;
        }
      });

      socket.on('spawn', function (msg) {
        if (msg) {
          game_engine.spawnAnimation(false,msg.pos,'spawn',spawn_img);
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
      player = new playerModel.Player(msg.playerId, false, player_img, game_engine.playerModels);
      player_id = player.id;
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
      return {"x": x, "y": y};
    };

    this.drawUI = function() {
        uiCount += 1;
        if(uiCount > 20){
          uiFrame = (uiFrame > 3) ? 0 : uiFrame + 1;
          uiCount = 0;
        }

        _canvasBufferContext2.clearRect(0, 0, _canvas2.width, _canvas2.height);
        _canvasBufferContext2.globalCompositeOperation="source-over";
        _canvasBufferContext2.fillStyle = 'rgba(0,250,0,1.0)';
        _canvasBufferContext2.globalCompositeOperation="destination-over";
        _canvasBufferContext2.fillRect(0,0,_canvas2.width,_canvas2.height);
        _canvasBufferContext2.globalCompositeOperation="source-over";

        for(pid in game_engine.active_players){
          var yOffset = 0;
          var plr;
          if(game_engine.active_players[pid] == false){
            yOffset = 0;
          }else{
            yOffset = 200;
            plr = game_engine.getPlayer(game_engine.active_players[pid]);
          }
          var xPos = 20 + (190*(pid-1));
          _canvasBufferContext2.drawImage(hud_img,
                       190*uiFrame,yOffset,
                       190,100,
                       xPos,0,
                       190,100);

        _canvasBufferContext2.globalCompositeOperation="source-over";
          var nameXPos = 71 + (190 * (pid-1));
          _canvasBufferContext2.font = '15px Impact';
          _canvasBufferContext2.fillStyle = 'rgba(239,0,0,1.0)';

          if(plr && plr.name){
            _canvasBufferContext2.fillText(plr.name,nameXPos,26);
          }
        }

        _canvasContext2.clearRect(0, 0, _canvas2.width, _canvas2.height);
        //_canvasBufferContext.globalCompositeOperation="source-atop";
        _canvasContext2.drawImage(_canvasBuffer2, 0, 0);
    }

    this.Draw = function () {
        //clear canvas
        _canvasBufferContext.clearRect(0, 0, _canvas.width, _canvas.height);
        _canvasBufferContext.globalCompositeOperation="source-over";
        _canvasBufferContext.fillStyle = 'rgba(250,250,250,0.7)';
        _canvasBufferContext.globalCompositeOperation="destination-over";
        _canvasBufferContext.fillRect(0,0,_canvas.width,_canvas.height);
        _canvasBufferContext.globalCompositeOperation="source-over";
        if(bg_img){
        _canvasBufferContext.drawImage(bg_img,
		      0,0,
		      800,600,
          0,0,
		      800,600
	             );
      }

        if (uiMode == "login" || uiMode == "menu") {
            banner.draw(_canvasBufferContext);
        }
        for(p in game_engine.game_state.players){
          var plr = game_engine.game_state.players[p];
          //draw player
          plr.draw(_canvasBufferContext)
/*
              var points = plr.poly();
          if(points){
              var start = points.pop();
              _canvasBufferContext.fillStyle = 'rgba(250,0,0,0.5)';
              _canvasBufferContext.beginPath();
              _canvasBufferContext.moveTo(start[0],start[1]);
              for(p in points){
                _canvasBufferContext.lineTo(points[p][0],points[p][1]);
              }
              _canvasBufferContext.closePath();
              _canvasBufferContext.fill();
          }
*/
          _canvasBufferContext.font = '20px Georgia';
          _canvasBufferContext.fillStyle = 'rgba(250,0,200,0.7)';
          if(plr.name){
            _canvasBufferContext.fillText(plr.name,plr.position.x-(plr.name.length/2)-10,plr.position.y-55);
          }
        }
/*
        if (game_engine.game_state.hitBoxes != null){
          for(h in game_engine.game_state.hitBoxes){
            var hb = game_engine.game_state.hitBoxes[h];
            var pl = game_engine.getPlayer(hb.pid);
            if(pl){
              var points = hb.poly(pl);
              var start = points.pop();
              _canvasBufferContext.fillStyle = 'rgba(250,0,250,0.5)';
              _canvasBufferContext.beginPath();
              _canvasBufferContext.moveTo(start[0],start[1]);
              for(p in points){
                _canvasBufferContext.lineTo(points[p][0],points[p][1]);
              }
              _canvasBufferContext.closePath();
              _canvasBufferContext.fill();
            }
          }
        }
*/
        if (game_engine.game_state.ammos != null){
          for(a in game_engine.game_state.ammos){
            var am = game_engine.game_state.ammos[a];
            if (am) {
              _canvasBufferContext.font = '20px Georgia';
              _canvasBufferContext.fillStyle = 'rgba(250,0,50,1.0)';
              _canvasBufferContext.fillText("*",am.position.x,am.position.y);
            }
          }
        }
        for(a in game_engine.animations){
          game_engine.animations[a].draw(_canvasBufferContext);
        }
        if(game_engine.terrainReady){
        for(x in game_engine.tiles){
          for(y in game_engine.tiles[x]){
            game_engine.tiles[x][y].draw(_canvasBufferContext);
          }
        }
        }
        //this.draw_commandBar();
        //draw buffer on screen
        _canvasContext.clearRect(0, 0, _canvas.width, _canvas.height);
        //_canvasBufferContext.globalCompositeOperation="source-atop";
        _canvasContext.drawImage(_canvasBuffer, 0, 0);
    }

    this.updateMenus = function() {
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

function distance(obj1, obj2) {
  return Math.sqrt(Math.pow((obj2.position.x - obj1.position.x),2)+Math.pow((obj2.position.y-obj1.position.y),2));
}
