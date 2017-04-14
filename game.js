/* Size of a grid square in pix */
var GRID_SIZE = 10,
/* Colour of an apple in hex RGBa */
APPLE_COLOR = "#00FF00",
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
 * @return {Boolean} true iff opposite
 */
Direction.isDirectionOpposite = function(dir1, dir2) {
    return (Math.abs(dir1 - dir2) == 2);
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
    this.nextDirection = initialDirection;
    this.color = color;
    this.scored = false;
    /* TODO: swap these inputs with the server for the two player game */
    this.keyboard = new THREEx.KeyboardState();
    this.touchscreen = touchscreen.setup();
}

/**
 * A snake local method to get the snake's score.
 * @return {Number} the snake's score
 */
Snake.prototype.getScore = function() {
    return this.loc.length - INITIAL_SNAKE_LENGTH;
}

/**
 * A snake local method to update the snakes direction.
 * @param {Direction} the new direction
 */
Snake.prototype.updateDirection = function(direction) {
  if (typeof this.nextDirection == 'undefined' && !Direction.isDirectionOpposite(direction, this.direction)) {
    this.nextDirection = direction;
  }
}


/**
 * A snake local method to update its position, assuming it carries on
 * in its current direction
 * @param {Number} The delta in time since the last update (in ms)
 * @return {x,y} the last location just behind the snake, undefined if the snake didn't move.
 */
Snake.prototype.updatePosition = function(dt) {
    var lastPosition = undefined;
    this.fracIncr += this.speed * dt;
    /* Ensure integer jumps so save frac part and only move by integer part */
    localIncr = Math.trunc(this.fracIncr);
    this.fracIncr -= localIncr;
    if(localIncr) {
        if(typeof this.nextDirection != 'undefined') {
          this.direction = this.nextDirection;
          this.nextDirection = undefined;
        }
        switch(this.direction) {
            case Direction.RIGHT: for(i = 0; i < localIncr; i++) {this.loc.unshift({x : this.loc[0].x + 1, y: this.loc[0].y});
                lastPosition = this.loc.pop();}; break;
            case Direction.DOWN: for(i = 0; i < localIncr; i++) {this.loc.unshift({x : this.loc[0].x, y: this.loc[0].y + 1});
                lastPosition = this.loc.pop();}; break;
            case Direction.LEFT: for(i = 0; i < localIncr; i++)  {this.loc.unshift({x : this.loc[0].x - 1, y: this.loc[0].y});
                lastPosition = this.loc.pop();}; break;
            case Direction.UP: for(i = 0; i < localIncr; i++) {this.loc.unshift({x : this.loc[0].x, y: this.loc[0].y - 1});
                lastPosition = this.loc.pop();}; break;
            default: console.error(); break;
        }
        if (this.scored) {
            this.loc.push(lastPosition);
            this.scored = false;
        }
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
 * A snake local method to increment the score of a snake and make it grow by 1
 */
Snake.prototype.score = function() {
    this.scored = true;
}

/**
 * A snake local method to draw it onto its canvas
 */
Snake.prototype.draw = function() {
    for(i = 0; i < this.loc.length; i++) {
    this.canvasCtx.beginPath();
    this.canvasCtx.arc(
        (this.loc[i].x * GRID_SIZE) + (GRID_SIZE / 2),
        (this.loc[i].y * GRID_SIZE) + (GRID_SIZE / 2),
        (GRID_SIZE - (2 * BORDER_SIZE)) / 2,
        0, 2 * Math.PI, false);
    this.canvasCtx.fillStyle = this.color;
    this.canvasCtx.fill();
    this.canvasCtx.closePath();
    }
};

/**
 * The apple class for the prize to be sought
 * @param {Number} x the x location of the apple in grid squares
 * @param {Number} y the y location of the apple in grid squares
 * @param {String} a hex colour string for the apple
 * @param {canvasCtx} a canvas context for the apple to be drawn on
 */
var Apple = function(x, y, color, canvasCtx) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.canvasCtx = canvasCtx;
}

/**
 * AN apple static to generate a new apple on a random square where no snakes lie
 * @param {Array(Snake)} the snakes to not draw an apple on
 * @param {String} a hex colour string for the apple
 * @param {String} a hex colour string for the apple
 * @param {canvasCtx} a canvas context for the apple to be drawn on
 */
Apple.randomApple = function(snakes, color, canvasCtx) {
    xMax = (canvasCtx.canvas.width / GRID_SIZE) - 1; /* in grid squares */
    yMax = (canvasCtx.canvas.height / GRID_SIZE) - 1; /* in grid squares */
    do {
        x = Math.floor(Math.random() * xMax);
        y = Math.floor(Math.random() * yMax);
        overlap = false;
        outerloop:
        for(i = 0; i < snakes.length; i++) {
            for(j = 0; j < snakes[i].loc.length; j++) {
                if(x == snakes[i].loc[j].x && y == snakes[i].loc[j].y)
                    overlap = true;
                    break outerloop;
            }
        }
    } while(overlap);
    return new Apple(x, y, color,canvasCtx);
}

/**
 * An apple local method to draw it onto its canvas
 */
Apple.prototype.draw = function() {
    this.canvasCtx.beginPath();
    this.canvasCtx.arc(
        (this.x * GRID_SIZE) + (GRID_SIZE / 2),
        (this.y * GRID_SIZE) + (GRID_SIZE / 2),
        (GRID_SIZE - (2 * BORDER_SIZE)) / 2,
        0, 2 * Math.PI, false);
    this.canvasCtx.fillStyle = this.color;
    this.canvasCtx.fill();
    this.canvasCtx.closePath();
}

/**
 * An apple local method to check if a snake is over it.
 * @param {Snake} a snake to check
 * @return {Boolean} true if the snake is on top of the apple, false otherwise
 */
Apple.prototype.eaten = function(snake) {
    for(i = 0; i < snake.loc.length; i++) {
        if(this.x == snake.loc[i].x &&
                this.y == snake.loc[i].y)
            return true;
    }
    return false;
}

/* TODO: var game */
