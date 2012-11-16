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
    var gameActive = false;
    var banner = new Banner();
    var uiMode = 'login';

    this.Initialize = function () {
        socket = io.connect();
        _canvas = document.getElementById('canvas');
        uiMode = 'login';
        if (_canvas && _canvas.getContext) {

            _canvasContext = _canvas.getContext('2d');
            _canvasBuffer = document.createElement('canvas');
            _canvasBuffer.width = _canvas.width;
            _canvasBuffer.height = _canvas.height;
            _canvasBufferContext = _canvasBuffer.getContext('2d');

            game_engine = new engine.GameEngine(false, playerModel, ammo, weapon, beast);
            this.waveCount = $("#waveCount");
            this.waveCount.hide();
            return true;
        }
        return false;
    }

    function LoadContent () {
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

  	//images
        //imagebg = new Image();
        //imagebg.src = 'images/marqod.png';
        $("#waveCount").show();
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
      this.Draw();
    }

    this.submitLogin = function(create){
      var login_q = $('#login_q').val();
      var password_q = $('#password_q').val();
      var act = create ? "create" : "login";
      if(login_q && password_q){
        socket.emit('auth',{action:act,username:login_q,password:password_q});
      }
    }

    function LocalEvent (event) {
      if (event != null){
        var msg = '';
        switch(event.type) {
          case 'click':
            if (event.target.id == 'canvas'){
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
        console.log("INIT");
        setPlayer(data);
        LoadContent();
        gameActive = true;
        setInterval(function() {document.proGame.updateMenus()}, 1000 / 10);
      });

      socket.on('push', function (data) {
        if (gameActive) {
          game_engine.pushData = data;
        }
      });

      socket.on('login', function (data) {
      //use data to instantiate new account and ivnentory
        if (data) {
          clearMenus();
          socket.emit('join');
        }
      });
    }

    function clearMenus(){
      $('#loginForm').hide();
    }

    function setPlayer(msg) {
      player = new playerModel.Player(msg.playerId, false, weapon, ammo);
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

    this.Draw = function () {
        //clear canvas
        _canvasBufferContext.clearRect(0, 0, _canvas.width, _canvas.height);
        _canvasBufferContext.globalCompositeOperation="source-over";
        _canvasBufferContext.fillStyle = 'rgba(250,250,250,0.7)';
        _canvasBufferContext.globalCompositeOperation="destination-over";
        _canvasBufferContext.fillRect(0,0,_canvas.width,_canvas.height);
        _canvasBufferContext.globalCompositeOperation="source-over";
        console.log(uiMode);
        if (uiMode == "login") {
            banner.draw(_canvasBufferContext);
        }
        for(p in game_engine.game_state.players){
          var plr = game_engine.game_state.players[p];
          //draw player
          _canvasBufferContext.fillStyle = plr.playerColor[p % 6];
          _canvasBufferContext.font = '12px Georgia';
          _canvasBufferContext.fillText(plr.artAsset(),plr.position.x-15,plr.position.y);
          //draw healthbar
          _canvasBufferContext.fillStyle = 'rgba(50,50,50,0.3)';
          _canvasBufferContext.fillRect(plr.position.x - 13,
                                        plr.position.y - 20,
                                        30,
                                        3);
          _canvasBufferContext.fillStyle = 'rgba(200,10,10,0.6)';
          _canvasBufferContext.fillRect(plr.position.x - 13,
                                        plr.position.y - 20,
                                        30 * (plr.health / plr.maxHealth),
                                        3);
        }
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
        //this.draw_commandBar();
        //draw buffer on screen
        _canvasContext.clearRect(0, 0, _canvas.width, _canvas.height);
        //_canvasBufferContext.globalCompositeOperation="source-atop";
        _canvasContext.drawImage(_canvasBuffer, 0, 0);
    }

    this.updateMenus = function() {
      this.waveCount.text("WAVE: " + game_engine.waveCount);
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
