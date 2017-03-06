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

    /* Size of a grid square in pix */
var GRID_SIZE = 10,
    /* Initial length of a snake in grid elements */
    INITIAL_SNAKE_LENGTH = 3,
    /* Size of a grid border (how much of a grid square not to paintin pix */
    BORDER_SIZE = 1;

/**
 * An enum of directions
 */ 
var Direction = {
   UP : 0,
   LEFT : 1,
   DOWN : 2,
   RIGHT : 3
};

/**
 * Static macro to check if two directions are opposite
 * @param {Direction} direction 1
 * @param {Direction} direction 2
 */
Direction.isDirectionOpposite = function(dir1, dir2) {
    return (Math.abs(dir1 - dir2) == 2);
}

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
        mc.on("swipeleft", function (ev) {touchscreen.direction =          Direction.LEFT;});
        mc.on("swipeup", function (ev) {touchscreen.direction = Direction. UP;});
        mc.on("swipedown", function (ev) {touchscreen.direction =          Direction.DOWN;});
        mc.on("swiperight", function (ev) {touchscreen.direction =         Direction.RIGHT;});
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


/** A snake player class.
 * @param {Number} initial x grid coordinate of head
 * @param {Number} initial y grid coordinate of head
 * @param {Number} initial speed in grid squares per ms
 * @param {Direction} initial direction for head to face
 * @param {String} a hex colour string for the snake
 * @param {canvasCtx} a canvas context for the snake to be drawn on
 */
var Snake = function(initialX, initialY, initialDirection, initialSpeed, color, canvasCtx) {
    /* Store all the initial inputs */
    /* TODO: save location of tail by direction and input length */
    this.loc = []; /* Array of current body locations with head at [0] */
    for(i = 0; i < INITIAL_SNAKE_LENGTH; i++) {this.loc.push({x: initialX - i, y: initialY});}
    this.canvasCtx = canvasCtx
    this.fracIncr = 0; /* The remainder to move the snake after a canvas redraw (it can only move integer grid squares) */
    this.speed = initialSpeed;
    this.dir = 1;
    this.xMax = (this.canvasCtx.canvas.width / GRID_SIZE) - 1; /* in grid squares */
    this.yMax = (this.canvasCtx.canvas.height / GRID_SIZE) - 1; /* in grid squares */
    this.direction = initialDirection;
    this.color = color;
    /* TODO: swap these inputs with the server for the two player game */
    this.keyboard = new THREEx.KeyboardState();
    this.touchscreen = touchscreen.setup();
}

/**
 * A snake local method to update the snakes direction,
 * based on the last sensed keyboard or touchscreen interaction
 */
Snake.prototype.updateDirection = function() {
    /* If a touchscreen was attatched and swiped we get that (else undefined) */
    var direction = this.touchscreen.getPressedDirection();
    if( this.keyboard.pressed('A') ||
        this.keyboard.pressed('left')) {direction = Direction.LEFT;}
    if( this.keyboard.pressed('D') ||
        this.keyboard.pressed('right')) {direction = Direction.RIGHT;}
    if( this.keyboard.pressed('W') ||
        this.keyboard.pressed('up')) {direction = Direction.UP;}
    if( this.keyboard.pressed('S') ||
        this.keyboard.pressed('down')) {direction = Direction.DOWN;}
    if (typeof(direction) != "undefined" &&
        !Direction.isDirectionOpposite(direction, this.direction)) {
    this.direction = direction
    }
}


/**
 * A snake local method to update its position, assuming it carries on
 * in its current direction
 * @param {Number} The delta in time since the last update (in ms)
 */
Snake.prototype.updatePosition = function(dt) {
    this.fracIncr += this.speed * dt;
    /* Ensure integer jumps so save frac part and only move by integer part */
    localIncr = Math.trunc(this.fracIncr);
    this.fracIncr -= localIncr;
    switch(this.direction) {
        case Direction.RIGHT: for(i = 0; i < localIncr; i++) {this.loc.unshift({x : this.loc[0].x + 1, y: this.loc[0].y});this.loc.pop();}; break;
        case Direction.DOWN: for(i = 0; i < localIncr; i++) {this.loc.unshift({x : this.loc[0].x, y: this.loc[0].y + 1});this.loc.pop();}; break;
        case Direction.LEFT: for(i = 0; i < localIncr; i++)  {this.loc.unshift({x : this.loc[0].x - 1, y: this.loc[0].y});this.loc.pop();}; break;
        case Direction.UP: for(i = 0; i < localIncr; i++) {this.loc.unshift({x : this.loc[0].x, y: this.loc[0].y - 1});this.loc.pop();}; break;
        default: console.error(); break;
    }
}

/**
 * A snake local method to check if it has moved offscreen
 * @return {Boolean} true if off screen, false if onscreen
 */
Snake.prototype.checkOffscreen = function() {
        return (this.loc[0].x > this.xMax || this.loc[0].y > this.yMax || this.loc[0].x < 0 || this.loc[0].y < 0);
}

/**
 * A snake static method to check if two snakes have collided
 * @param {Snake} snake 1
 * @param {Snake} snake 2
 * @return {Boolean} true if collision detected, false if not
 */
Snake.checkCollision = function(snake1, snake2) {
        if (typeof(snake2) == "undefined") { selfCheck = true; snake2 = snake1;}
        for(i = 0; i < snake1.loc.length; i++) {
            for(j=0; j < snake2.loc.length; j++) {
                if((!selfCheck || i != j) && snake1.loc[i].x == snake2.loc[j].x && snake1.loc[i].y == snake2.loc[j].y) return true;
            }
        }
        return false;
}

/**
 * A snake local method to check if a snake has collided with itself
 * @return {Boolean} true if collision detected, false if not
 */
Snake.prototype.checkSelfCollision = function() {
    return Snake.checkCollision(this);
}

/**
 * A snake local method to draw it onto its canvas
 */
Snake.prototype.draw = function(dt) {
    for(i = 0; i < this.loc.length; i++) {
    this.canvasCtx.fillStyle = this.color;
    this.canvasCtx.fillRect((this.loc[i].x * GRID_SIZE) + BORDER_SIZE,
            (this.loc[i].y * GRID_SIZE) + BORDER_SIZE,
            GRID_SIZE - (2 * BORDER_SIZE),
            GRID_SIZE - (2 * BORDER_SIZE));
    }
};

/**
 * The main animation loop. 
 * @param {Canvas} canvas element from DOM to draw on.
 */ 
function animLoop(element) {
    var running = true;
    var lastFrame = performance.now();
    console.log("Create snake");
    /* Create a snake */
    localSnake = new Snake(2, 0, Direction.RIGHT, 0.01, "#FF0000", ctx);
    function loop( now ) {
        if ( running !== false ) {
            /* schedule to run again when the screen can refresh */
            window.requestAnimationFrame( loop, element );
            dt = now - lastFrame; /* deltaTime in ms since last screen refresh*/
            /* Clear canvas */
            element.clearRect(0, 0, element.canvas.width, element.canvas.height);
            localSnake.draw();
            localSnake.updatePosition(dt);
            localSnake.updateDirection();
            /* Check for game end conditions */
            running = !localSnake.checkOffscreen();
            running = running && !localSnake.checkSelfCollision();
            /* TODO: add point markers and check for them */
            lastFrame = now;
        }
        else {
            alert("Game over");
        }
    }
    loop( lastFrame );
}

window.onload = function(e){
		viewport = document.getElementById('viewport');
		ctx = viewport.getContext('2d');
        viewport.focus();
        animLoop(ctx);
};
