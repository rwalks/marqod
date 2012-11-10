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

    this.Initialize = function () {
        socket = io.connect();
        _canvas = document.getElementById('canvas');
        if (_canvas && _canvas.getContext) {
            _canvasContext = _canvas.getContext('2d');
            _canvasBuffer = document.createElement('canvas');
            _canvasBuffer.width = _canvas.width;
            _canvasBuffer.height = _canvas.height;
            _canvasBufferContext = _canvasBuffer.getContext('2d');

            game_engine = new engine.GameEngine(false, playerModel, ammo, weapon);
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
            LocalEvent(event);
        });

  	//images
        //imagebg = new Image();
        //imagebg.src = 'images/marqod.png';
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
      });
      socket.on('push', function (data) {
        if (gameActive) {
          game_engine.pushData = data;
        }
      });
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
        _canvasBufferContext.fillStyle = 'rgba(100,100,100,0.7)';
        _canvasBufferContext.globalCompositeOperation="destination-over";
        _canvasBufferContext.fillRect(0,0,_canvas.width,_canvas.height);
        for(p in game_engine.game_state.players){
          var plr = game_engine.game_state.players[p];
          _canvasBufferContext.fillStyle = plr.playerColor[p];
          _canvasBufferContext.fillText("FARTINGTON",plr.position.x,plr.position.y);
        }
        if (game_engine.game_state.ammos != null){
        for(a in game_engine.game_state.ammos){
          var am = game_engine.game_state.ammos[a];
          if (am) {
            _canvasBufferContext.fillStyle = 'rgba(250,0,50,1.0)';
            _canvasBufferContext.fillText("*",am.position.x,am.position.y);
          }
        }
        }
        //this.draw_commandBar();
        //draw buffer on screen
        _canvasContext.clearRect(0, 0, _canvas.width, _canvas.height);
        //_canvasBufferContext.globalCompositeOperation="source-atop";
        _canvasContext.drawImage(_canvasBuffer, 0, 0);
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
  return Math.sqrt(Math.pow((obj2.x - obj1.x),2)+Math.pow((obj2.y-obj1.y),2));
}
