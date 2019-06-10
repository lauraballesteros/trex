/**
 * Default game canvas size.
 */
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 150;

/**
 * Runner configs
*/
const RUNNER_BOTTOM_PAD = 10;
const RUNNER_MAX_OBSTACLE_DUPLICATION = 2;

let FPS = 60;

function getFPS() {
  return FPS;
}

function setFPS(value) {
  FPS = value;
}

let _imageSprite = null;

function getImageSprite() {
  return _imageSprite;
}

function loadImageSprite() {
  return new Promise((resolve) => {
    const imageSprite = document.createElement('img');
    imageSprite.src = 'imagenes/offline-sprite.png';
    imageSprite.addEventListener('load', () => {
      _imageSprite = imageSprite;
      resolve();
    });
  });
}

/**
 * Return the current timestamp.
 * @return {number}
 */
function getTimeStamp() {
  return performance.now();
}

/**
 * Get random number.
 * @param {number} min
 * @param {number} max
 * @param {number}
 */
function getRandomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



















//////////////////////////////////////////////////////////////////////////////////

/**
 * Handles displaying the distance meter.
 * @param {!HTMLCanvasElement} canvas
 * @param {Object} spritePos Image position in sprite.
 * @param {number} canvasWidth
 * @constructor
 */
class DistanceMeter {
  static dimensions = {
    WIDTH: 10,
    HEIGHT: 13,
    DEST_WIDTH: 11
  };

  static yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];

  static config = {
    // Number of digits.
    MAX_DISTANCE_UNITS: 5,

    // Distance that causes achievement animation.
    ACHIEVEMENT_DISTANCE: 100,

    // Used for conversion from pixel distance to a scaled unit.
    COEFFICIENT: 0.025,

    // Flash duration in milliseconds.
    FLASH_DURATION: 1000 / 4,

    // Flash iterations for achievement animation.
    FLASH_ITERATIONS: 3
  };

  constructor(canvas, spritePos, canvasWidth) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.image = getImageSprite();
    this.spritePos = spritePos;
    this.x = 0;
    this.y = 5;

    this.currentDistance = 0;
    this.maxScore = 0;
    this.highScore = 0;
    this.container = null;

    this.digits = [];
    this.acheivement = false;
    this.defaultString = '';
    this.flashTimer = 0;
    this.flashIterations = 0;
    this.invertTrigger = false;

    this.config = DistanceMeter.config;
    this.maxScoreUnits = this.config.MAX_DISTANCE_UNITS;
    this.init(canvasWidth);
  }

  /**
   * Initialise the distance meter to '00000'.
   * @param {number} width Canvas width in px.
   */
  init(width) {
    let maxDistanceStr = '';

    this.calcXPos(width);
    this.maxScore = this.maxScoreUnits;
    for (let i = 0; i < this.maxScoreUnits; i += 1) {
      this.draw(i, 0);
      this.defaultString += '0';
      maxDistanceStr += '9';
    }

    this.maxScore = parseInt(maxDistanceStr, 0);
  }

  /**
   * Calculate the xPos in the canvas.
   * @param {number} canvasWidth
   */
  calcXPos(canvasWidth) {
    this.x =
      canvasWidth -
      DistanceMeter.dimensions.DEST_WIDTH * (this.maxScoreUnits + 1);
  }

  /**
   * Draw a digit to canvas.
   * @param {number} digitPos Position of the digit.
   * @param {number} value Digit value 0-9.
   * @param {boolean} highScore Whether drawing the high score.
   */
  draw(digitPos, value, highScore) {
    const sourceWidth = DistanceMeter.dimensions.WIDTH;
    const sourceHeight = DistanceMeter.dimensions.HEIGHT;
    let sourceX = DistanceMeter.dimensions.WIDTH * value;
    let sourceY = 0;

    const targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
    const targetY = this.y;
    const targetWidth = DistanceMeter.dimensions.WIDTH;
    const targetHeight = DistanceMeter.dimensions.HEIGHT;

    sourceX += this.spritePos.x;
    sourceY += this.spritePos.y;

    this.canvasCtx.save();

    if (highScore) {
      // Left of the current score.
      const highScoreX =
        this.x - this.maxScoreUnits * 2 * DistanceMeter.dimensions.WIDTH;
      this.canvasCtx.translate(highScoreX, this.y);
    } else {
      this.canvasCtx.translate(this.x, this.y);
    }

    this.canvasCtx.drawImage(
      this.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight
    );

    this.canvasCtx.restore();
  }

  /**
   * Covert pixel distance to a 'real' distance.
   * @param {number} distance Pixel distance ran.
   * @return {number} The 'real' distance ran.
   */
  getActualDistance(distance) {
    return distance ? Math.round(distance * this.config.COEFFICIENT) : 0;
  }

  /**
   * Update the distance meter.
   * @param {number} distance
   * @param {number} deltaTime
   */
  update(deltaTime, distance) {
    let paint = true;

    if (!this.acheivement) {
      distance = this.getActualDistance(distance);
      // Score has gone beyond the initial digit count.
      if (
        distance > this.maxScore &&
        this.maxScoreUnits === this.config.MAX_DISTANCE_UNITS
      ) {
        this.maxScoreUnits += 1;
        this.maxScore = parseInt(`${this.maxScore}9`, 1);
      } else {
        this.distance = 0;
      }

      if (distance > 0) {
        // Acheivement unlocked
        if (distance % this.config.ACHIEVEMENT_DISTANCE === 0) {
          this.acheivement = true;
          this.flashTimer = 0;
        }

        // Create a string representation of the distance with leading 0.
        const distanceStr = (this.defaultString + distance).substr(
          -this.maxScoreUnits
        );
        this.digits = distanceStr.split('');
      } else {
        this.digits = this.defaultString.split('');
      }
    } else if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
      this.flashTimer += deltaTime;

      if (this.flashTimer < this.config.FLASH_DURATION) {
        paint = false;
      } else if (this.flashTimer > this.config.FLASH_DURATION * 2) {
        this.flashTimer = 0;
        this.flashIterations += 1;
      }
    } else {
      this.acheivement = false;
      this.flashIterations = 0;
      this.flashTimer = 0;
    }

    // Draw the digits if not flashing.
    if (paint) {
      for (let i = this.digits.length - 1; i >= 0; i -= 1) {
        this.draw(i, parseInt(this.digits[i], 0));
      }
    }

    this.drawHighScore();
  }
  /**
   * Draw the high score.
   */
  drawHighScore() {
    this.canvasCtx.save();
    this.canvasCtx.globalAlpha = 0.8;
    for (let i = this.highScore.length - 1; i >= 0; i -= 1) {
      this.draw(i, parseInt(this.highScore[i], 10), true);
    }
    this.canvasCtx.restore();
  }

  /**
   * Set the highscore as a array string.
   * Position of char in the sprite: H - 10, I - 11.
   * @param {number} distance Distance ran in pixels.
   */
  setHighScore(distance) {
    distance = this.getActualDistance(distance);
    const highScoreStr = (this.defaultString + distance).substr(
      -this.maxScoreUnits
    );

    this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
  }

  /**
   * Reset the distance meter back to '00000'.
   */
  reset() {
    this.update(0);
    this.acheivement = false;
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

























//////////////////////////////////////////////////////////////////////////////

class Cloud {
  /**
   * Cloud object config.
   * @enum {number}
   */
  static config = {
    HEIGHT: 14,
    MAX_CLOUD_GAP: 400,
    MAX_SKY_LEVEL: 30,
    MIN_CLOUD_GAP: 100,
    MIN_SKY_LEVEL: 71,
    WIDTH: 46
  };

  constructor(canvas, spritePos, containerWidth) {
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext('2d');
    this.spritePos = spritePos;
    this.containerWidth = containerWidth;
    this.xPos = containerWidth;
    this.yPos = 0;
    this.remove = false;
    this.cloudGap = getRandomNum(
      Cloud.config.MIN_CLOUD_GAP,
      Cloud.config.MAX_CLOUD_GAP
    );

    this.init();
  }

  /**
   * Initialise the cloud. Sets the Cloud height.
   */
  init() {
    this.yPos = getRandomNum(
      Cloud.config.MAX_SKY_LEVEL,
      Cloud.config.MIN_SKY_LEVEL
    );
    this.draw();
  }

  /**
   * Draw the cloud.
   */
  draw() {
    this.canvasCtx.save();
    const sourceWidth = Cloud.config.WIDTH;
    const sourceHeight = Cloud.config.HEIGHT;

    this.canvasCtx.drawImage(
      getImageSprite(),
      this.spritePos.x,
      this.spritePos.y,
      sourceWidth,
      sourceHeight,
      this.xPos,
      this.yPos,
      Cloud.config.WIDTH,
      Cloud.config.HEIGHT
    );

    this.canvasCtx.restore();
  }

  /**
   * Update the cloud position.
   * @param {number} speed
   */
  update(speed) {
    if (!this.remove) {
      this.xPos -= Math.ceil(speed);
      this.draw();

      // Mark as removeable if no longer in the canvas.
      if (!this.isVisible()) {
        this.remove = true;
      }
    }
  }

  /**
   * Check if the cloud is visible on the stage.
   * @return {boolean}
   */
  isVisible() {
    return this.xPos + Cloud.config.WIDTH > 0;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////























//////////////////////////////////////////////////////////////////////////////////////////

class HorizonLine {
  /**
   * Horizon line dimensions.
   * @enum {number}
   */
  static dimensions = {
    WIDTH: 600,
    HEIGHT: 12,
    YPOS: 127
  };

  constructor(canvas, spritePos) {
    this.spritePos = spritePos;
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.sourceDimensions = {};
    this.dimensions = HorizonLine.dimensions;
    this.sourceXPos = [
      this.spritePos.x,
      this.spritePos.x + this.dimensions.WIDTH
    ];
    this.xPos = [];
    this.yPos = 0;
    this.bumpThreshold = 0.5;

    this.setSourceDimensions();
    this.draw();
  }

  /**
   * Set the source dimensions of the horizon line.
   */
  setSourceDimensions() {
    /* eslint-disable-next-line */
    for (const dimension in HorizonLine.dimensions) {
      this.sourceDimensions[dimension] = HorizonLine.dimensions[dimension];
      this.dimensions[dimension] = HorizonLine.dimensions[dimension];
    }

    this.xPos = [0, HorizonLine.dimensions.WIDTH];
    this.yPos = HorizonLine.dimensions.YPOS;
  }

  /**
   * Return the crop x position of a type.
   */
  getRandomType() {
    return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
  }

  /**
   * Draw the horizon line.
   */
  draw() {
    this.canvasCtx.drawImage(
      getImageSprite(),
      this.sourceXPos[0],
      this.spritePos.y,
      this.sourceDimensions.WIDTH,
      this.sourceDimensions.HEIGHT,
      this.xPos[0],
      this.yPos,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT
    );

    this.canvasCtx.drawImage(
      getImageSprite(),
      this.sourceXPos[1],
      this.spritePos.y,
      this.sourceDimensions.WIDTH,
      this.sourceDimensions.HEIGHT,
      this.xPos[1],
      this.yPos,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT
    );
  }

  /**
   * Update the x position of an indivdual piece of the line.
   * @param {number} pos Line position.
   * @param {number} increment
   */
  updateXPos(pos, increment) {
    const line1 = pos;
    const line2 = pos === 0 ? 1 : 0;

    this.xPos[line1] -= increment;
    this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;

    if (this.xPos[line1] <= -this.dimensions.WIDTH) {
      this.xPos[line1] += this.dimensions.WIDTH * 2;
      this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
      this.sourceXPos[line1] = this.getRandomType() + this.spritePos.x;
    }
  }

  /**
   * Update the horizon line.
   * @param {number} deltaTime
   * @param {number} speed
   */
  update(deltaTime, speed) {
    const increment = Math.floor(speed * (getFPS() / 1000) * deltaTime);

    if (this.xPos[0] <= 0) {
      this.updateXPos(0, increment);
    } else {
      this.updateXPos(1, increment);
    }
    this.draw();
  }

  /**
   * Reset horizon to the starting position.
   */
  reset() {
    this.xPos[0] = 0;
    this.xPos[1] = HorizonLine.dimensions.WIDTH;
  }
}

//////////////////////////////////////////////////////////////////////////////////////////




































//////////////////////////////////////////////////////////////////////////////////////////

class CollisionBox {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
}

/////////////////////////////////////////////////////////////////////////////////




































/////////////////////////////////////////////////////////////////////////////////
/**
 * Obstacle.
 * @param {HTMLCanvasCtx} canvasCtx
 * @param {Obstacle.type} type
 * @param {Object} spritePos Obstacle position in sprite.
 * @param {Object} dimensions
 * @param {number} gapCoefficient Mutipler in determining the gap.
 * @param {number} speed
 * @param {number} offset
 */
class Obstacle {
  /**
   * Coefficient for calculating the maximum gap.
   * @const
   */
  static MAX_GAP_COEFFICIENT = 1.5;

  /**
   * Maximum obstacle grouping count.
   * @const
   */
  static MAX_OBSTACLE_LENGTH = 3;

  static types = [
    {
      type: 'CACTUS_SMALL',
      width: 17,
      height: 35,
      yPos: 105,
      multipleSpeed: 4,
      minGap: 120,
      minSpeed: 0,
      collisionBoxes: [
        new CollisionBox(0, 7, 5, 27),
        new CollisionBox(4, 0, 6, 34),
        new CollisionBox(10, 4, 7, 14)
      ]
    },
    {
      type: 'CACTUS_LARGE',
      width: 25,
      height: 50,
      yPos: 90,
      multipleSpeed: 7,
      minGap: 120,
      minSpeed: 0,
      collisionBoxes: [
        new CollisionBox(0, 12, 7, 38),
        new CollisionBox(8, 0, 7, 49),
        new CollisionBox(13, 10, 10, 38)
      ]
    },
    {
      type: 'PTERODACTYL',
      width: 46,
      height: 40,
      yPos: [100, 75, 50], // Variable height.
      yPosMobile: [100, 50], // Variable height mobile.
      multipleSpeed: 999,
      minSpeed: 8.5,
      minGap: 150,
      collisionBoxes: [
        new CollisionBox(15, 15, 16, 5),
        new CollisionBox(18, 21, 24, 6),
        new CollisionBox(2, 14, 4, 3),
        new CollisionBox(6, 10, 4, 7),
        new CollisionBox(10, 8, 6, 9)
      ],
      numFrames: 2,
      frameRate: 1000 / 6,
      speedOffset: 0.8
    }
  ];

  constructor(
    canvasCtx,
    type,
    spriteImgPos,
    dimensions,
    gapCoefficient,
    speed,
    offset
  ) {
    this.canvasCtx = canvasCtx;
    this.spritePos = spriteImgPos;
    this.typeConfig = type;
    this.gapCoefficient = gapCoefficient;
    this.size = getRandomNum(1, Obstacle.MAX_OBSTACLE_LENGTH);
    this.dimensions = dimensions;
    this.remove = false;
    this.xPos = dimensions.WIDTH + (offset || 0);
    this.yPos = 0;
    this.width = 0;
    this.collisionBoxes = [];
    this.gap = 0;
    this.speedOffset = 0;

    // For animated obstacles.
    this.currentFrame = 0;
    this.timer = 0;

    this.init(speed);
  }

  init(speed) {
    this.cloneCollisionBoxes();

    // Only allow sizing if we're at the right speed.
    if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
      this.size = 1;
    }

    this.width = this.typeConfig.width * this.size;

    // Check if obstacle can be positioned at various heights.
    if (Array.isArray(this.typeConfig.yPos)) {
      const yPosConfig = this.typeConfig.yPos;
      this.yPos = yPosConfig[getRandomNum(0, yPosConfig.length - 1)];
    } else {
      this.yPos = this.typeConfig.yPos;
    }

    this.draw();

    // Make collision box adjustments,
    // Central box is adjusted to the size as one box.
    //      ____        ______        ________
    //    _|   |-|    _|     |-|    _|       |-|
    //   | |<->| |   | |<--->| |   | |<----->| |
    //   | | 1 | |   | |  2  | |   | |   3   | |
    //   |_|___|_|   |_|_____|_|   |_|_______|_|
    //
    if (this.size > 1) {
      this.collisionBoxes[1].width =
        this.width -
        this.collisionBoxes[0].width -
        this.collisionBoxes[2].width;
      this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
    }

    // For obstacles that go at a different speed from the horizon.
    if (this.typeConfig.speedOffset) {
      this.speedOffset =
        Math.random() > 0.5
          ? this.typeConfig.speedOffset
          : -this.typeConfig.speedOffset;
    }

    this.gap = this.getGap(this.gapCoefficient, speed);
  }

  /**
   * Draw and crop based on size.
   */
  draw() {
    const sourceWidth = this.typeConfig.width;
    const sourceHeight = this.typeConfig.height;

    // X position in sprite.
    let sourceX =
      sourceWidth * this.size * (0.5 * (this.size - 1)) + this.spritePos.x;

    // Animation frames.
    if (this.currentFrame > 0) {
      sourceX += sourceWidth * this.currentFrame;
    }

    this.canvasCtx.drawImage(
      getImageSprite(),
      sourceX,
      this.spritePos.y,
      sourceWidth * this.size,
      sourceHeight,
      this.xPos,
      this.yPos,
      this.typeConfig.width * this.size,
      this.typeConfig.height
    );
  }

  /**
   * Obstacle frame update.
   * @param {number} deltaTime
   * @param {number} speed
   */
  update(deltaTime, speed) {
    if (!this.remove) {
      if (this.typeConfig.speedOffset) {
        speed += this.speedOffset;
      }
      this.xPos -= Math.floor(speed * getFPS() / 1000 * deltaTime);

      // Update frame
      if (this.typeConfig.numFrames) {
        this.timer += deltaTime;
        if (this.timer >= this.typeConfig.frameRate) {
          this.currentFrame =
            this.currentFrame === this.typeConfig.numFrames - 1
              ? 0
              : this.currentFrame + 1;
          this.timer = 0;
        }
      }
      this.draw();

      if (!this.isVisible()) {
        this.remove = true;
      }
    }
  }

  /**
   * Calculate a random gap size.
   * - Minimum gap gets wider as speed increses
   * @param {number} gapCoefficient
   * @param {number} speed
   * @return {number} The gap size.
   */
  getGap(gapCoefficient, speed) {
    const minGap = Math.round(
      this.width * speed + this.typeConfig.minGap * gapCoefficient
    );
    const maxGap = Math.round(minGap * Obstacle.MAX_GAP_COEFFICIENT);
    return getRandomNum(minGap, maxGap);
  }

  /**
   * Check if obstacle is visible.
   * @return {boolean} Whether the obstacle is in the game area.
   */
  isVisible() {
    return this.xPos + this.width > 0;
  }

  /**
   * Make a copy of the collision boxes, since these will change based on
   * obstacle type and size.
   */
  cloneCollisionBoxes() {
    const { collisionBoxes } = this.typeConfig;

    for (let i = collisionBoxes.length - 1; i >= 0; i -= 1) {
      this.collisionBoxes[i] = new CollisionBox(
        collisionBoxes[i].x,
        collisionBoxes[i].y,
        collisionBoxes[i].width,
        collisionBoxes[i].height
      );
    }
  }
}

/////////////////////////////////////////////////////////////////////////////////





























/////////////////////////////////////////////////////////////////////////

/**
 * Horizon background class.
 * @param {HTMLCanvasElement} canvas
 * @param {Object} spritePos Sprite positioning.
 * @param {Object} dimensions Canvas dimensions.
 * @param {number} gapCoefficient
 * @constructor
 */
class Horizon {
  /**
   * Horizon config.
   * @enum {number}
   */
  static config = {
    BG_CLOUD_SPEED: 0.2,
    BUMPY_THRESHOLD: 0.3,
    CLOUD_FREQUENCY: 0.5,
    HORIZON_HEIGHT: 16,
    MAX_CLOUDS: 6
  };

  constructor(canvas, spritePos, dimensions, gapCoefficient) {
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext('2d');
    this.config = Horizon.config;
    this.dimensions = dimensions;
    this.gapCoefficient = gapCoefficient;
    this.obstacles = [];
    this.obstacleHistory = [];
    this.horizonOffsets = [0, 0];
    this.cloudFrequency = this.config.CLOUD_FREQUENCY;
    this.spritePos = spritePos;

    // Cloud
    this.clouds = [];
    this.cloudSpeed = this.config.BG_CLOUD_SPEED;

    // Horizon
    this.horizonLine = null;
    this.init();
  }

  /**
   * Initialise the horizon. Just add the line and a cloud. No obstacles.
   */
  init() {
    this.addCloud();
    this.horizonLine = new HorizonLine(this.canvas, this.spritePos.HORIZON);
  }

  /**
   * @param {number} deltaTime
   * @param {number} currentSpeed
   * @param {boolean} updateObstacles Used as an override to prevent
   *     the obstacles from being updated / added. This happens in the
   *     ease in section.
   */
  update(deltaTime, currentSpeed, updateObstacles) {
    this.runningTime += deltaTime;
    this.horizonLine.update(deltaTime, currentSpeed);
    this.updateClouds(deltaTime, currentSpeed);

    if (updateObstacles) {
      this.updateObstacles(deltaTime, currentSpeed);
    }
  }

  /**
   * Update the cloud positions.
   * @param {number} deltaTime
   * @param {number} currentSpeed
   */
  updateClouds(deltaTime, speed) {
    const cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
    const numClouds = this.clouds.length;

    if (numClouds) {
      for (let i = numClouds - 1; i >= 0; i -= 1) {
        this.clouds[i].update(cloudSpeed);
      }

      const lastCloud = this.clouds[numClouds - 1];

      // Check for adding a new cloud.
      if (
        numClouds < this.config.MAX_CLOUDS &&
        this.dimensions.WIDTH - lastCloud.xPos > lastCloud.cloudGap &&
        this.cloudFrequency > Math.random()
      ) {
        this.addCloud();
      }

      // Remove expired clouds.
      this.clouds = this.clouds.filter(obj => !obj.remove);
    } else {
      this.addCloud();
    }
  }

  /**
   * Update the obstacle positions.
   * @param {number} deltaTime
   * @param {number} currentSpeed
   */
  updateObstacles(deltaTime, currentSpeed) {
    // Obstacles, move to Horizon layer.
    const updatedObstacles = this.obstacles.slice(0);

    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      obstacle.update(deltaTime, currentSpeed);

      // Clean up existing obstacles.
      if (obstacle.remove) {
        updatedObstacles.shift();
      }
    }
    this.obstacles = updatedObstacles;

    if (this.obstacles.length > 0) {
      const lastObstacle = this.obstacles[this.obstacles.length - 1];

      if (
        lastObstacle &&
        !lastObstacle.followingObstacleCreated &&
        lastObstacle.isVisible() &&
        lastObstacle.xPos + lastObstacle.width + lastObstacle.gap <
          this.dimensions.WIDTH
      ) {
        this.addNewObstacle(currentSpeed);
        lastObstacle.followingObstacleCreated = true;
      }
    } else {
      // Create new obstacles.
      this.addNewObstacle(currentSpeed);
    }
  }

  removeFirstObstacle() {
    this.obstacles.shift();
  }

  /**
   * Add a new obstacle.
   * @param {number} currentSpeed
   */
  addNewObstacle(currentSpeed) {
    const obstacleTypeIndex = getRandomNum(0, Obstacle.types.length - 1);
    const obstacleType = Obstacle.types[obstacleTypeIndex];

    // Check for multiples of the same type of obstacle.
    // Also check obstacle is available at current speed.
    if (
      this.duplicateObstacleCheck(obstacleType.type) ||
      currentSpeed < obstacleType.minSpeed
    ) {
      this.addNewObstacle(currentSpeed);
    } else {
      const obstacleSpritePos = this.spritePos[obstacleType.type];

      this.obstacles.push(
        new Obstacle(
          this.canvasCtx,
          obstacleType,
          obstacleSpritePos,
          this.dimensions,
          this.gapCoefficient,
          currentSpeed,
          obstacleType.width
        )
      );

      this.obstacleHistory.unshift(obstacleType.type);

      if (this.obstacleHistory.length > 1) {
        this.obstacleHistory.splice(RUNNER_MAX_OBSTACLE_DUPLICATION);
      }
    }
  }

  /**
   * Returns whether the previous two obstacles are the same as the next one.
   * Maximum duplication is set in config value MAX_OBSTACLE_DUPLICATION.
   * @return {boolean}
   */
  duplicateObstacleCheck(nextObstacleType) {
    let duplicateCount = 0;

    for (let i = 0; i < this.obstacleHistory.length; i += 1) {
      duplicateCount =
        this.obstacleHistory[i] === nextObstacleType ? duplicateCount + 1 : 0;
    }
    return duplicateCount >= RUNNER_MAX_OBSTACLE_DUPLICATION;
  }

  /**
   * Reset the horizon layer.
   * Remove existing obstacles and reposition the horizon line.
   */
  reset() {
    this.obstacles = [];
    this.horizonLine.reset();
  }

  /**
   * Update the canvas width and scaling.
   * @param {number} width Canvas width.
   * @param {number} height Canvas height.
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Add a new cloud to the horizon.
   */
  addCloud() {
    this.clouds.push(
      new Cloud(this.canvas, this.spritePos.CLOUD, this.dimensions.WIDTH)
    );
  }
}

/////////////////////////////////////////////////////////////////////////////////
























/////////////////////////////////////////////////////////////////////////////////

/**
 * T-rex game character.
 * @param {HTMLCanvas} canvas
 * @param {Object} spritePos Positioning within image sprite.
 * @constructor
 */
 class Trex {
  static config = {
    DROP_VELOCITY: -5,
    GRAVITY: 0.6,
    HEIGHT: 47,
    HEIGHT_DUCK: 25,
    INIITAL_JUMP_VELOCITY: -10,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    SPEED_DROP_COEFFICIENT: 3,
    SPRITE_WIDTH: 262,
    START_X_POS: 50,
    WIDTH: 44,
    WIDTH_DUCK: 59
  };

  /**
   * Used in collision detection.
   * @type {Array<CollisionBox>}
   */
  static collisionBoxes = {
    DUCKING: [new CollisionBox(1, 18, 55, 25)],
    RUNNING: [
      new CollisionBox(22, 0, 17, 16),
      new CollisionBox(1, 18, 30, 9),
      new CollisionBox(10, 35, 14, 8),
      new CollisionBox(1, 24, 29, 5),
      new CollisionBox(5, 30, 21, 4),
      new CollisionBox(9, 34, 15, 4)
    ]
  };

  /**
   * Animation states.
   * @enum {string}
   */
  static status = {
    CRASHED: 'CRASHED',
    DUCKING: 'DUCKING',
    JUMPING: 'JUMPING',
    RUNNING: 'RUNNING',
    WAITING: 'WAITING'
  };

  /**
   * Blinking coefficient.
   * @const
   */
  static BLINK_TIMING = 7000;

  /**
   * Animation config for different states.
   * @enum {Object}
   */
  static animFrames = {
    WAITING: {
      frames: [44, 0],
      msPerFrame: 1000 / 3
    },
    RUNNING: {
      frames: [88, 132],
      msPerFrame: 1000 / 12
    },
    CRASHED: {
      frames: [220],
      msPerFrame: 1000 / 60
    },
    JUMPING: {
      frames: [0],
      msPerFrame: 1000 / 60
    },
    DUCKING: {
      frames: [262, 321],
      msPerFrame: 1000 / 8
    }
  };

  constructor(canvas, spritePos) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.spritePos = spritePos;
    this.xPos = 0;
    this.yPos = 0;
    // Position when on the ground.
    this.groundYPos = 0;
    this.currentFrame = 0;
    this.currentAnimFrames = [];
    this.blinkDelay = 0;
    this.blinkCount = 0;
    this.animStartTime = 0;
    this.timer = 0;
    this.msPerFrame = 1000 / getFPS();
    this.config = Trex.config;
    // Current status.
    this.status = Trex.status.WAITING;

    this.jumping = false;
    this.ducking = false;
    this.jumpVelocity = 0;
    this.reachedMinHeight = false;
    this.speedDrop = false;
    this.jumpCount = 0;
    this.jumpspotX = 0;

    this.init();
  }

  /**
   * T-rex player initaliser.
   * Sets the t-rex to blink at random intervals.
   */
  init() {
    this.groundYPos = CANVAS_HEIGHT - this.config.HEIGHT - RUNNER_BOTTOM_PAD;
    this.yPos = this.groundYPos;
    this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

    this.draw(0, 0);
    this.update(0, Trex.status.WAITING);
  }

  /**
   * Setter for the jump velocity.
   * The approriate drop velocity is also set.
   */
  setJumpVelocity(setting) {
    this.config.INIITAL_JUMP_VELOCITY = -setting;
    this.config.DROP_VELOCITY = -setting / 2;
  }

  /**
   * Set the animation status.
   * @param {!number} deltaTime
   * @param {Trex.status} status Optional status to switch to.
   */
  update(deltaTime, status) {
    this.timer += deltaTime;

    // Update the status.
    if (status) {
      this.status = status;
      this.currentFrame = 0;
      this.msPerFrame = Trex.animFrames[status].msPerFrame;
      this.currentAnimFrames = Trex.animFrames[status].frames;

      if (status === Trex.status.WAITING) {
        this.animStartTime = getTimeStamp();
        this.setBlinkDelay();
      }
    }

    if (this.status === Trex.status.WAITING) {
      this.blink(getTimeStamp());
    } else {
      this.draw(this.currentAnimFrames[this.currentFrame], 0);
    }

    // Update the frame position.
    if (this.timer >= this.msPerFrame) {
      this.currentFrame =
        this.currentFrame === this.currentAnimFrames.length - 1
          ? 0
          : this.currentFrame + 1;
      this.timer = 0;
    }

    // Speed drop becomes duck if the down key is still being pressed.
    if (this.speedDrop && this.yPos === this.groundYPos) {
      this.speedDrop = false;
      this.setDuck(true);
    }
  }

  /**
   * Draw the t-rex to a particular position.
   * @param {number} x
   * @param {number} y
   */
  draw(x, y) {
    let sourceX = x;
    let sourceY = y;
    const sourceWidth =
      this.ducking && this.status !== Trex.status.CRASHED
        ? this.config.WIDTH_DUCK
        : this.config.WIDTH;
    const sourceHeight = this.config.HEIGHT;

    // Adjustments for sprite sheet position.
    sourceX += this.spritePos.x;
    sourceY += this.spritePos.y;

    // Ducking.
    if (this.ducking && this.status !== Trex.status.CRASHED) {
      this.canvasCtx.drawImage(
        getImageSprite(),
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        this.xPos,
        this.yPos,
        this.config.WIDTH_DUCK,
        this.config.HEIGHT
      );
    } else {
      // Crashed whilst ducking. Trex is standing up so needs adjustment.
      if (this.ducking && this.status === Trex.status.CRASHED) {
        this.xPos += 1;
      }
      // Standing / running
      this.canvasCtx.drawImage(
        getImageSprite(),
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        this.xPos,
        this.yPos,
        this.config.WIDTH,
        this.config.HEIGHT
      );
    }
  }

  /**
   * Sets a random time for the blink to happen.
   */
  setBlinkDelay() {
    this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
  }

  /**
   * Make t-rex blink at random intervals.
   * @param {number} time Current time in milliseconds.
   */
  blink(time) {
    const deltaTime = time - this.animStartTime;

    if (deltaTime >= this.blinkDelay) {
      this.draw(this.currentAnimFrames[this.currentFrame], 0);

      if (this.currentFrame === 1) {
        // Set new random delay to blink.
        this.setBlinkDelay();
        this.animStartTime = time;
        this.blinkCount += 1;
      }
    }
  }

  /**
   * Initialise a jump.
   * @param {number} speed
   */
  startJump(speed) {
    if (speed === undefined) {
      speed = Runner.instance_.currentSpeed;
    }
    if (!this.jumping) {
      this.update(0, Trex.status.JUMPING);
      // Tweak the jump velocity based on the speed.
      this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY - speed / 10;
      this.jumping = true;
      this.reachedMinHeight = false;
      this.speedDrop = false;
    }
  }

  /**
   * Jump is complete, falling down.
   */
  endJump() {
    if (
      this.reachedMinHeight &&
      this.jumpVelocity < this.config.DROP_VELOCITY
    ) {
      this.jumpVelocity = this.config.DROP_VELOCITY;
    }
  }

  /**
   * Update frame for a jump.
   * @param {number} deltaTime
   * @param {number} speed
   */
  updateJump(deltaTime, speed) {
    const { msPerFrame } = Trex.animFrames[this.status];
    const framesElapsed = deltaTime / msPerFrame;

    // Speed drop makes Trex fall faster.
    if (this.speedDrop) {
      this.yPos += Math.round(
        this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * framesElapsed
      );
    } else {
      this.yPos += Math.round(this.jumpVelocity * framesElapsed);
    }

    this.jumpVelocity += this.config.GRAVITY * framesElapsed;

    // Minimum height has been reached.
    if (this.yPos < this.minJumpHeight || this.speedDrop) {
      this.reachedMinHeight = true;
    }

    // Reached max height
    if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
      this.endJump();
    }

    // Back down at ground level. Jump completed.
    if (this.yPos > this.groundYPos) {
      this.reset();
      this.jumpCount += 1;
    }

    this.update(deltaTime);
  }

  /**
   * Set the speed drop. Immediately cancels the current jump.
   */
  setSpeedDrop() {
    this.speedDrop = true;
    this.jumpVelocity = 1;
  }

  /**
   * @param {boolean} isDucking.
   */
  setDuck(isDucking) {
    if (isDucking && this.status !== Trex.status.DUCKING) {
      this.update(0, Trex.status.DUCKING);
      this.ducking = true;
    } else if (this.status === Trex.status.DUCKING) {
      this.update(0, Trex.status.RUNNING);
      this.ducking = false;
    }
  }

  /**
   * Reset the t-rex to running at start of game.
   */
  reset() {
    this.yPos = this.groundYPos;
    this.jumpVelocity = 0;
    this.jumping = false;
    this.ducking = false;
    this.update(0, Trex.status.RUNNING);
    this.midair = false;
    this.speedDrop = false;
    this.jumpCount = 0;
    this.crashed = false;
  }
}

/**
 * Check for a collision.
 * @param {!Obstacle} obstacle
 * @param {!Trex} tRex T-rex object.
 * @param {HTMLCanvasContext} canvasContext Optional canvas context for drawing
 *    collision boxes.
 * @return {Array<CollisionBox>}
 */
function checkForCollision(obstacle, tRex) {
  const obstacleBoxXPos = CANVAS_WIDTH + obstacle.xPos;

  // Adjustments are made to the bounding box as there is a 1 pixel white
  // border around the t-rex and obstacles.
  const tRexBox = new CollisionBox(
    tRex.xPos + 1,
    tRex.yPos + 1,
    tRex.config.WIDTH - 2,
    tRex.config.HEIGHT - 2
  );

  const obstacleBox = new CollisionBox(
    obstacle.xPos + 1,
    obstacle.yPos + 1,
    obstacle.typeConfig.width * obstacle.size - 2,
    obstacle.typeConfig.height - 2
  );

  // Simple outer bounds check.
  if (boxCompare(tRexBox, obstacleBox)) {
    const { collisionBoxes } = obstacle;
    const tRexCollisionBoxes = tRex.ducking
      ? Trex.collisionBoxes.DUCKING
      : Trex.collisionBoxes.RUNNING;

    // Detailed axis aligned box check.
    for (let t = 0; t < tRexCollisionBoxes.length; t += 1) {
      for (let i = 0; i < collisionBoxes.length; i += 1) {
        // Adjust the box to actual positions.
        const adjTrexBox = createAdjustedCollisionBox(
          tRexCollisionBoxes[t],
          tRexBox
        );
        const adjObstacleBox = createAdjustedCollisionBox(
          collisionBoxes[i],
          obstacleBox
        );
        const crashed = boxCompare(adjTrexBox, adjObstacleBox);

        if (crashed) {
          return [adjTrexBox, adjObstacleBox];
        }
      }
    }
  }
  return false;
}

/**
 * Adjust the collision box.
 * @param {!CollisionBox} box The original box.
 * @param {!CollisionBox} adjustment Adjustment box.
 * @return {CollisionBox} The adjusted collision box object.
 */
function createAdjustedCollisionBox(box, adjustment) {
  return new CollisionBox(
    box.x + adjustment.x,
    box.y + adjustment.y,
    box.width,
    box.height
  );
}

/**
 * Compare two collision boxes for a collision.
 * @param {CollisionBox} tRexBox
 * @param {CollisionBox} obstacleBox
 * @return {boolean} Whether the boxes intersected.
 */
function boxCompare(tRexBox, obstacleBox) {
  let crashed = false;
  const tRexBoxX = tRexBox.x;
  const tRexBoxY = tRexBox.y;

  const obstacleBoxX = obstacleBox.x;
  const obstacleBoxY = obstacleBox.y;

  // Axis-Aligned Bounding Box method.
  if (
    tRexBox.x < obstacleBoxX + obstacleBox.width &&
    tRexBox.x + tRexBox.width > obstacleBoxX &&
    tRexBox.y < obstacleBox.y + obstacleBox.height &&
    tRexBox.height + tRexBox.y > obstacleBox.y
  ) {
    crashed = true;
  }

  return crashed;
}

/////////////////////////////////////////////////////////////////////////////////
































/////////////////////////////////////////////////////////////////////////////////

class TrexGroup {
  onReset = noop;
  onRunning = noop;
  onCrash = noop;

  constructor(count, canvas, spriteDef) {
    this.tRexes = [];
    for (let i = 0; i < count; i += 1) {
      const tRex = new Trex(canvas, spriteDef);
      tRex.id = i;
      this.tRexes.push(tRex);
    }
  }

  update(deltaTime, status) {
    this.tRexes.forEach((tRex) => {
      if (!tRex.crashed) {
        tRex.update(deltaTime, status);
      }
    });
  }

  draw(x, y) {
    this.tRexes.forEach((tRex) => {
      if (!tRex.crashed) {
        tRex.draw(x, y);
      }
    });
  }

  updateJump(deltaTime, speed) {
    this.tRexes.forEach((tRex) => {
      if (tRex.jumping) {
        tRex.updateJump(deltaTime, speed);
      }
    });
  }

  reset() {
    this.tRexes.forEach((tRex) => {
      tRex.reset();
      this.onReset({ tRex });
    });
  }

  lives() {
    return this.tRexes.reduce((count, tRex) => tRex.crashed ? count : count + 1, 0);
  }

  checkForCollision(obstacle) {
    let crashes = 0;
    const state = {
      obstacleX: obstacle.xPos,
      obstacleY: obstacle.yPos,
      obstacleWidth: obstacle.width,
      speed: Runner.instance_.currentSpeed
    };
    this.tRexes.forEach(async (tRex) => {
      if (!tRex.crashed) {
        const result = checkForCollision(obstacle, tRex);
        if (result) {
          crashes += 1;
          tRex.crashed = true;
          this.onCrash(tRex, state );
        } else {
          const action = await this.onRunning( tRex, state );
          if (action === 1) {
            tRex.startJump();
          } else if (action === -1) {
            if (tRex.jumping) {
              // Speed drop, activated only when jump key is not pressed.
              tRex.setSpeedDrop();
            } else if (!tRex.jumping && !tRex.ducking) {
              // Duck.
              tRex.setDuck(true);
            }
          }
        }
      } else {
        crashes += 1;
      }
    });
    return crashes === this.tRexes.length;
  }
}

function noop() { }


/////////////////////////////////////////////////////////////////////////////////






























/////////////////////////////////////////////////////////////////////////////////


/**
 * T-Rex runner.
 * @param {string} outerContainerId Outer containing element id.
 * @param {Object} options
 * @constructor
 * @export
 */
class Runner {
  static generation = 0;

  static config = {
    ACCELERATION: 0.001,
    BG_CLOUD_SPEED: 0.2,
    CLEAR_TIME: 0,
    CLOUD_FREQUENCY: 0.5,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_SPEED: 13,
    MIN_JUMP_HEIGHT: 35,
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3,
    DINO_COUNT: 1,
    onReset: noop,
    onRunning: noop,
    onCrash: noop
  };

  static classes = {
    CANVAS: 'game-canvas',
    CONTAINER: 'game-container',
  };

  static spriteDefinition = {
    CACTUS_LARGE: { x: 332, y: 2 },
    CACTUS_SMALL: { x: 228, y: 2 },
    CLOUD: { x: 86, y: 2 },
    HORIZON: { x: 2, y: 54 },
    PTERODACTYL: { x: 134, y: 2 },
    RESTART: { x: 2, y: 2 },
    TEXT_SPRITE: { x: 655, y: 2 },
    TREX: { x: 848, y: 2 }
  };

  /**
   * Key code mapping.
   * @enum {Object}
   */
  static keycodes = {
    JUMP: { 38: 1, 32: 1 }, // Up, spacebar
    DUCK: { 40: 1 } // Down
  };

  /**
   * Runner event names.
   * @enum {string}
   */
  static events = {
    ANIM_END: 'webkitAnimationEnd',
    CLICK: 'click',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    RESIZE: 'resize',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
    FOCUS: 'focus',
    LOAD: 'load'
  };

  constructor(outerContainerId, options) {
    // Singleton
    if (Runner.instance_) {
      return Runner.instance_;
    }
    Runner.instance_ = this;

    this.isFirstTime = false;
    this.outerContainerEl = document.querySelector(outerContainerId);
    this.generationEl = document.querySelector('.generation');
    this.containerEl = null;

    this.config = Object.assign({}, Runner.config, options);

    this.dimensions = {
      WIDTH: CANVAS_WIDTH,
      HEIGHT: CANVAS_HEIGHT
    };

    this.canvas = null;
    this.canvasCtx = null;

    this.tRex = null;

    this.distanceMeter = null;
    this.distanceRan = 0;

    this.highestScore = 0;

    this.time = 0;
    this.runningTime = 0;
    this.msPerFrame = 1000 / getFPS();
    this.currentSpeed = this.config.SPEED;

    this.obstacles = [];

    this.activated = false; // Whether the easter egg has been activated.
    this.playing = false; // Whether the game is currently in play state.
    this.crashed = false;
    this.resizeTimerId_ = null;

    this.playCount = 0;

    // Images.
    this.images = {};
    this.imagesLoaded = 0;
  }

  async init() {
    await loadImageSprite();
    this.spriteDef = Runner.spriteDefinition;

    this.adjustDimensions();
    this.setSpeed();

    this.containerEl = document.createElement('div');
    this.containerEl.className = Runner.classes.CONTAINER;
    this.containerEl.style.width = `${this.dimensions.WIDTH}px`;

    // Player canvas container.
    this.canvas = createCanvas(
      this.containerEl,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT,
      Runner.classes.PLAYER
    );

    this.canvasCtx = this.canvas.getContext('2d');
    this.canvasCtx.fillStyle = '#f7f7f7';
    this.canvasCtx.fill();
    Runner.updateCanvasScaling(this.canvas);

    // Horizon contains clouds, obstacles and the ground.
    this.horizon = new Horizon(
      this.canvas,
      this.spriteDef,
      this.dimensions,
      this.config.GAP_COEFFICIENT
    );

    // Distance meter
    this.distanceMeter = new DistanceMeter(
      this.canvas,
      this.spriteDef.TEXT_SPRITE,
      this.dimensions.WIDTH
    );

    // Draw t-rex
    this.tRexGroup = new TrexGroup(this.config.DINO_COUNT, this.canvas, this.spriteDef.TREX);
    this.tRexGroup.onRunning = this.config.onRunning;
    this.tRexGroup.onCrash = this.config.onCrash;
    this.tRex = this.tRexGroup.tRexes[0];

    this.outerContainerEl.appendChild(this.containerEl);

    this.startListening();
    this.update();

    window.addEventListener(
      Runner.events.RESIZE,
      this.debounceResize.bind(this)
    );

    this.restart();
  }

  /**
   * Debounce the resize event.
   */
  debounceResize() {
    if (!this.resizeTimerId_) {
      this.resizeTimerId_ = setInterval(this.adjustDimensions.bind(this), 250);
    }
  }

  /**
   * Adjust game space dimensions on resize.
   */
  adjustDimensions() {
    clearInterval(this.resizeTimerId_);
    this.resizeTimerId_ = null;

    const boxStyles = window.getComputedStyle(this.outerContainerEl);
    const padding = Number(
      boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2)
    );

    this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;

    // Redraw the elements back onto the canvas.
    if (this.canvas) {
      this.canvas.width = this.dimensions.WIDTH;
      this.canvas.height = this.dimensions.HEIGHT;

      Runner.updateCanvasScaling(this.canvas);

      this.distanceMeter.calcXPos(this.dimensions.WIDTH);
      this.clearCanvas();
      this.horizon.update(0, 0, true);
      this.tRexGroup.update(0);

      // Outer container and distance meter.
      if (this.playing || this.crashed) {
        this.containerEl.style.width = `${this.dimensions.WIDTH}px`;
        this.containerEl.style.height = `${this.dimensions.HEIGHT}px`;
        this.distanceMeter.update(0, Math.ceil(this.distanceRan));
        this.stop();
      } else {
        this.tRexGroup.draw(0, 0);
      }
    }
  }

  /**
   * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
   * @param {number} speed
   */
  setSpeed(speed) {
    this.currentSpeed = speed || this.currentSpeed;
  }

  /**
   * Update the game status to started.
   */
  startGame() {
    this.runningTime = 0;
    this.containerEl.style.webkitAnimation = '';
    this.playCount += 1;
  }

  clearCanvas() {
    this.canvasCtx.clearRect(
      0,
      0,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT
    );
  }

  /**
   * Update the game frame and schedules the next one.
   */
  update() {
    this.updatePending = false;

    const now = getTimeStamp();
    let deltaTime = now - (this.time || now);
    this.time = now;

    if (this.playing) {
      this.clearCanvas();

      this.tRexGroup.updateJump(deltaTime);

      this.runningTime += deltaTime;
      const hasObstacles = this.runningTime > this.config.CLEAR_TIME;

      // First time
      if (this.isFirstTime) {
        if (!this.activated && !this.crashed) {
          this.playing = true;
          this.activated = true;
          this.startGame();
        }
      }

      deltaTime = !this.activated ? 0 : deltaTime;
      this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);

      let gameOver = false;
      // Check for collisions.
      if (hasObstacles) {
        gameOver = this.tRexGroup.checkForCollision(this.horizon.obstacles[0]);
      }

      if (!gameOver) {
        this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;

        if (this.currentSpeed < this.config.MAX_SPEED) {
          this.currentSpeed += this.config.ACCELERATION;
        }
      } else {
        this.gameOver();
      }

      this.distanceMeter.update(
        deltaTime,
        Math.ceil(this.distanceRan)
      );
    }

    if (
      this.playing ||
      (!this.activated)
    ) {
      this.tRexGroup.update(deltaTime);
      this.scheduleNextUpdate();
    }

    const lives = this.tRexGroup.lives();
    if (lives > 0) {
      this.generationEl.innerText = `GENERACION #${Runner.generation} | VIDAS x ${this.tRexGroup.lives()}`;
    } else {
      this.generationEl.innerHTML = `<div style="color: red;">GENERATION #${Runner.generation}  |  GAME OVER</div>`;
    }
  }

  /**
   * Bind relevant key
   */
  startListening() {
    document.addEventListener(Runner.events.KEYDOWN, (e) => {
      this.onKeyDown(e);
    });
    document.addEventListener(Runner.events.KEYUP, (e) => {
      this.onKeyUp(e);
    });
  }

  /**
   * Process keydown.
   * @param {Event} e
   */
  onKeyDown(e) {
    if (!this.crashed && this.playing) {
      if (Runner.keycodes.JUMP[e.keyCode]) {
        e.preventDefault();
        this.tRex.startJump(this.currentSpeed);
      } else if (Runner.keycodes.DUCK[e.keyCode]) {
        e.preventDefault();
        if (this.tRex.jumping) {
          // Speed drop, activated only when jump key is not pressed.
          this.tRex.setSpeedDrop();
        } else if (!this.tRex.jumping && !this.tRex.ducking) {
          // Duck.
          this.tRex.setDuck(true);
        }
      }
    } else if (this.crashed) {
      this.restart();
    }
  }

  /**
   * Process key up.
   * @param {Event} e
   */
  onKeyUp(e) {
    const keyCode = String(e.keyCode);
    const isJumpKey = Runner.keycodes.JUMP[keyCode];

    if (this.isRunning() && isJumpKey) {
      this.tRex.endJump();
    } else if (Runner.keycodes.DUCK[keyCode]) {
      this.tRex.speedDrop = false;
      this.tRex.setDuck(false);
    } else if (this.crashed) {
      if (Runner.keycodes.JUMP[keyCode]) {
        this.restart();
      }
    }
  }

  /**
   * RequestAnimationFrame wrapper.
   */
  scheduleNextUpdate() {
    if (!this.updatePending) {
      this.updatePending = true;
      this.raqId = requestAnimationFrame(this.update.bind(this));
    }
  }

  /**
   * Whether the game is running.
   * @return {boolean}
   */
  isRunning() {
    return !!this.raqId;
  }

  /**
   * Game over state.
   */
  gameOver() {
    this.stop();
    this.crashed = true;
    this.distanceMeter.acheivement = false;

    this.tRexGroup.update(100, Trex.status.CRASHED);

    // Update the high score.
    if (this.distanceRan > this.highestScore) {
      this.highestScore = Math.ceil(this.distanceRan);
      this.distanceMeter.setHighScore(this.highestScore);
    }

    // Reset the time clock.
    this.time = getTimeStamp();

    setTimeout(() => {
      this.restart();
    }, 500);
  }

  stop() {
    this.playing = false;
    cancelAnimationFrame(this.raqId);
    this.raqId = 0;
  }

  play() {
    if (!this.crashed) {
      this.playing = true;
      this.tRexGroup.update(0, Trex.status.RUNNING);
      this.time = getTimeStamp();
      this.update();
    }
  }

  restart() {
    if (!this.raqId) {
      this.playCount += 1;
      this.runningTime = 0;
      this.playing = true;
      this.crashed = false;
      this.distanceRan = 0;
      this.setSpeed(this.config.SPEED);
      this.time = getTimeStamp();
      this.clearCanvas();
      this.distanceMeter.reset(this.highestScore);
      this.horizon.reset();
      this.tRexGroup.reset();
      this.config.onReset(this.tRexGroup.tRexes );
      this.update();
    } else {
      this.isFirstTime = true;
      this.tRexGroup.reset();
      this.config.onReset(this.tRexGroup.tRexes );
      if (!this.playing) {
        this.playing = true;
        this.update();
      }
    }
    Runner.generation += 1;
  }

  /**
   * Updates the canvas size taking into
   * account the backing store pixel ratio and
   * the device pixel ratio.
   *
   * See article by Paul Lewis:
   * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
   *
   * @param {HTMLCanvasElement} canvas
   * @param {number} width
   * @param {number} height
   * @return {boolean} Whether the canvas was scaled.
   */
  static updateCanvasScaling(canvas, width, height) {
    const context = canvas.getContext('2d');

    // Query the various pixel ratios
    const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    const backingStoreRatio =
      Math.floor(context.webkitBackingStorePixelRatio) || 1;
    const ratio = devicePixelRatio / backingStoreRatio;

    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
      const oldWidth = width || canvas.width;
      const oldHeight = height || canvas.height;

      canvas.width = oldWidth * ratio;
      canvas.height = oldHeight * ratio;

      canvas.style.width = `${oldWidth}px`;
      canvas.style.height = `${oldHeight}px`;

      // Scale the context to counter the fact that we've manually scaled
      // our canvas element.
      context.scale(ratio, ratio);
      return true;
    } else if (devicePixelRatio === 1) {
      // Reset the canvas width / height. Fixes scaling bug when the page is
      // zoomed and the devicePixelRatio changes accordingly.
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
    }
    return false;
  }
}

/**
 * Create canvas element.
 * @param {HTMLElement} container Element to append canvas to.
 * @param {number} width
 * @param {number} height
 * @param {string} className
 * @return {HTMLCanvasElement}
 */
function createCanvas(container, width, height, className) {
  const canvas = document.createElement('canvas');
  canvas.className = className
    ? `${Runner.classes.CANVAS} ${className}`
    : Runner.classes.CANVAS;
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);

  return canvas;
}

function noop() {}

/////////////////////////////////////////////////////////////////////////////////





















/////////////////////////////////////////////////////////////////////////////
class Modelo {
  inicializar() {
    throw new Error(
      'Se implementara en la clase derivada'
    );
  }

  predecir_var(input_var) {
    throw new Error(
      'Se implementara en la clase derivada'
    );
  }

  predecir_set(input_set) {
    return this.predecir_var([input_set]);
  }

  entrenar(input_setx, input_sety) {
    throw new Error(
      'Se implementara en la clase derivada'
    );
  }

}
/////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////

class ModeloGenetico extends Modelo {
  entrenar(cromosomas) {
    const padres = this.seleccionar(cromosomas);
    const clones = this.cruce(padres, cromosomas);
    this.mutar(clones);
  }

  fit(cromosomas) {
      this.entrenar(cromosomas);
  }

  seleccionar(cromosomas) {
    const padres = [cromosomas[0], cromosomas[1]];
    return padres;
  }

  cruce(padres, cromosomas) {
    // Clones de los padres
    const clon1 = padres[0];
    const clon2 = padres[1];
    console.info("clon1:",clon1);
    console.info("clon2:",clon2);
    // Seleccionar un punto de cruce aleatorio
    const punto_Cruce = Math.floor(Math.random() * clon1.length);
    console.info("cruce: ",punto_Cruce);
    // Inteercambiar valores de los padres
    for (let i = 0; i < punto_Cruce; i += 1) {
        const temp = clon1[i];
        clon1[i] = clon2[i];
        clon2[i] = temp;
    }
    // crear arreglo de clones para almacenar a clon 1 y 2 despues del cruce
    const clones = [clon1, clon2];
    // reemplazar los 2 cromosomas con el peor rendimiento(los ultimos 2 en el arreglo cromosomas) con clones
    for (let i = 0; i < 2; i += 1) {
      cromosomas[cromosomas.length - i - 1] = clones[i];
    }
    console.info("hijo: ",clones)
    return clones;
  }

  mutar(cromosomas) {
    cromosomas.forEach(cromosomas => {
      const punto_Mutacion = Math.floor(Math.random() * cromosomas.length);
      cromosomas[punto_Mutacion] = Math.random();
    });
  }
}

/////////////////////////////////////////////////////////////////////////////////























/////////////////////////////////////////////////////////////////////////////////

class ModeloAleatorio extends Modelo {
  pesos = [];
  sesgo = [];

  inicializar() {
    this.randomize();
  }

  predecir_var(input_set) {
    const input_var = input_set[0];
    const decision =
      this.pesos[0] * input_var[0] +
      this.pesos[1] * input_var[1]+
      this.pesos[2] * input_var[2] +
      this.sesgo[0];
    return decision < 0 ? 1 : 0;
  }

  entrenar() {
    this.randomize();
  }

  randomize() {
    this.pesos[0] = random();
    this.pesos[1] = random();
    this.pesos[2] = random();
    this.sesgo[0] = random();
  }
  getCromosoma() {
    return this.pesos.concat(this.sesgo);
  }

  setCromosoma(cromosoma) {
    this.pesos[0] = cromosoma[0];
    this.pesos[1] = cromosoma[1];
    this.pesos[2] = cromosoma[2];
    this.sesgo[0] = cromosoma[3];
  }
}

function random() {
  return (Math.random() - 0.5) * 2;
}


/////////////////////////////////////////////////////////////////////////////////
























/////////////////////////////////////////////////////////////////////////////////

// const DINO_COUNT = 10;

let runner = null;

const rankList = [];
const geneticModel = new ModeloGenetico();

let firstTime = true;

function setup() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    DINO_COUNT:10,
    onReset: handleReset,
    onCrash: handleCrash,
    onRunning: handleRunning
  });
  // Set runner as a global variable if you need runtime debugging.
  window.runner = runner;
  // console.info(runner)
  // Initialize everything in the game and start the game.
  runner.init();
}


function handleReset(Dinos) {
  if (firstTime) {
    firstTime = false;
    // console.info("in here")
    // console.info(Dinos)
    Dinos.forEach((dino) => {
      // console.info("happened");
      dino.model = new ModeloAleatorio();
      dino.model.inicializar();
    });

  }
  else {
    // Train the model before restarting.
    console.info('Entrenando');
    const chromosomes = rankList.map((dino) => dino.model.getCromosoma());
    // console.info(chromosomes)
    // Clear rankList
    rankList.splice(0);
    geneticModel.fit(chromosomes);
    Dinos.forEach((dino, i) => {
      dino.model.setCromosoma(chromosomes[i]);
    });
  }
}

function handleRunning(dino, state) {
  let action = 0;
  if (!dino.jumping) {
    action = dino.model.predecir_set(convertStateToVector(state));
  }
  return action;
}

function handleCrash(dino) {
  // console.info("i was called")
  if (!rankList.includes(dino)) {
    rankList.unshift(dino);
  }
}

function convertStateToVector(state) {
  if (state) {
    return [
      state.obstacleX / CANVAS_WIDTH,
      state.obstacleWidth / CANVAS_WIDTH,
      state.speed / 100
    ];
  }
  return [0, 0, 0];
}

document.addEventListener('DOMContentLoaded', setup);












