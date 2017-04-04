/**
 * @file client.js client side game script
 */

/* requestAnimationFrame polyfill by Erik Möller  fixes from Paul Irish and Tino Zijdel
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

/**
 * Number of online Users
 */
var onlineUsers = 0;

/**
 * Check if ingame
 */
var inGame = false;


/** Create touchscreen namespace.
 * This will allow access to the hammer library
 * for reading swipes
 */
var touchscreen = touchscreen       || {};

/** Give it a setup function to look for swipes
 * @return touchscreen
 */
touchscreen.setup = function() {
        var mc = new Hammer(document.getElementById('viewport'));
        mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
        mc.on("swipeleft", function (ev) {touchscreen.direction  = Direction.LEFT;});
        mc.on("swipeup", function (ev) {touchscreen.direction    = Direction. UP;});
        mc.on("swipedown", function (ev) {touchscreen.direction  = Direction.DOWN;});
        mc.on("swiperight", function (ev) {touchscreen.direction = Direction.RIGHT;});
        return touchscreen;
}

/**
 * Get the touchscreen last direction and clear
 * @return {Direction} last direction, undefined if none found
 */
touchscreen.getPressedDirection = function() {
        var retval = touchscreen.direction;
        touchscreen.direction = undefined;
        return retval;
}

/**
 * A function to get the last touchscreen or keyboard input.
 * @return {Direction} new direction or undefined if no input detected since last call
 */
function getInputDirection(touchscreen, keyboard) {
    /* If a touchscreen was attatched and swiped we get that (else undefined) */
    var direction = touchscreen.getPressedDirection();
    if( keyboard.pressed('A') ||
        keyboard.pressed('left')) {direction = Direction.LEFT;}
    if( keyboard.pressed('D') ||
        keyboard.pressed('right')) {direction = Direction.RIGHT;}
    if( keyboard.pressed('W') ||
        keyboard.pressed('up')) {direction = Direction.UP;}
    if( keyboard.pressed('S') ||
        keyboard.pressed('down')) {direction = Direction.DOWN;}
    return direction;
}

/** Print a gameover sequencebox on the canvas with the score
 * @param {CanvasCtx} the canvas context to draw on
 * @param {Number} The score
 */

/**
 * The main animation loop.
 * @param {Canvas} canvas context element from DOM to draw on.
 */
function animLoop(element) {
    var running = true;
    var lastFrame = performance.now();
    console.log("Create snake");
    /* Setup input devices */
    this.touchscreen = touchscreen.setup();
    this.keyboard = new THREEx.KeyboardState();
    /* Create a snake */
    localSnake = new Snake(2, 0, Direction.RIGHT, 0.01, "#FF0000", element);
    apple = Apple.randomApple([localSnake], APPLE_COLOR, element);
    function loop( now ) {
        if ( running !== false ) {
            /* schedule to run again when the screen can refresh */
            window.requestAnimationFrame( loop, element );
            dt = now - lastFrame; /* deltaTime in ms since last screen refresh*/
            /* Clear canvas */
            element.clearRect(0, 0, element.canvas.width, element.canvas.height);
            localSnake.draw();
            apple.draw();
            lastLoc = localSnake.updatePosition(dt);
            /* Check for game end conditions */
            running = !localSnake.checkOffscreen();
            running = running && !localSnake.checkSelfCollision();
            /* Check if the apple is now eaten */
            if(apple.eaten(localSnake)) {
                localSnake.score(lastLoc);
                apple = Apple.randomApple([localSnake], APPLE_COLOR, element);
            }
            /* Check for direction change */
            newDirection = getInputDirection(this.touchscreen, this.keyboard);
            if (typeof newDirection != 'undefined') {
              localSnake.updateDirection(newDirection);
            }
            lastFrame = now;
        }
        else {
            //printGameOver(element, localSnake.getScore());
            endGame(localSnake.getScore());
        }
    }
    loop( lastFrame );
}

/**
 * Updates the number of connections in the view forms.
 */
function updateOnlineUserView() {
  document.getElementById("numberOfConnections").innerHTML = "Online Users: " + onlineUsers;
  document.getElementById("reNumberOfConnections").innerHTML = "Online Users: " + onlineUsers;
}

/**
 * Connects to the socket io server and sets the number of online users to be updated
 * on state change.
 */
function connectToServer() {
    socket = io.connect();
    socket.on('update-cons', function(cons) {
      onlineUsers = cons;
      if (!inGame) {
        updateOnlineUserView();
      }});
}

/**
 * Terminate a game and bringup gameover screen.
 */
function endGame(score) {
  document.getElementById("finalScore").innerHTML = "Score = " + score;
  document.getElementById("postgame").style.display = '';
  document.getElementById("usernameInputRestart").focus();
  updateOnlineUserView();
  inGame = false;
}

/**
 * Begin a game
 * @param {form} form form that started the game.
 * @param {Boolean} restart if first game, true otherwise
 */
function startGame(form, restart){
  if (restart) {
    username = document.getElementById("usernameInputRestart").value;
    document.getElementById("postgame").style.display = 'none';
  }
  else {
    username = document.getElementById("usernameInput").value;
    document.getElementById("usernameInputRestart").value = username;
    document.getElementById("pregame").style.display = 'none';
  }
  inGame = true;
  viewport = document.getElementById('viewport');
  ctx = viewport.getContext('2d');
  viewport.focus();
  animLoop(ctx);
}

/**
 * Connect server on start
 */
window.onload = function(e){
  conns = connectToServer();
};
