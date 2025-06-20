document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const scoreBoard = document.getElementById('score-board');
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const powerUpStatusDisplay = document.getElementById('powerup-status');

    // Screen elements
    const startScreen = document.getElementById('start-screen');
    const levelClearedScreen = document.getElementById('level-cleared-screen');
    const gameOverScreen = document.getElementById('game-over-screen');

    // Button elements
    const startNewGameBtn = document.getElementById('start-new-game-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Display elements for screens
    const levelClearedTitle = document.getElementById('level-cleared-title');
    const gameOverMainTitle = document.getElementById('game-over-main-title');
    const finalScoreDisplay = document.getElementById('final-score');

    // Audio elements
    const sfxPaddleHit = document.getElementById('sfx-paddle-hit');
    const sfxBrickHitBreak = document.getElementById('sfx-brick-hit-break');
    const sfxBrickHitSolid = document.getElementById('sfx-brick-hit-solid');
    const sfxWallHit = document.getElementById('sfx-wall-hit');
    const sfxLifeLost = document.getElementById('sfx-life-lost');
    const sfxLevelComplete = document.getElementById('sfx-level-complete');
    const sfxGameOver = document.getElementById('sfx-game-over');
    const sfxPowerupActivate = document.getElementById('sfx-powerup-activate');
    const sfxPowerupDeactivate = document.getElementById('sfx-powerup-deactivate');
    const bgmMusic = document.getElementById('bgm-music');

    const GAME_STATE = {
        MENU: 0,
        PLAYING: 1,
        LEVEL_TRANSITION: 2,
        GAME_OVER: 3
    };
    let currentGameState = GAME_STATE.MENU;

    let currentLevelIndex = 0;

    const SLOW_BALL_DURATION = 10000;
    const MULTI_BALL_DURATION = 15000;
    const SPEED_BALL_DURATION = 10000;
    const MAX_BALLS = 3;

    // Original reference dimensions
    const ORIGINAL_GAME_WIDTH = 600;
    const ORIGINAL_GAME_HEIGHT = 450;

    let INITIAL_BALL_SPEED_DX = 2; // Changed to let
    let INITIAL_BALL_SPEED_DY = -4; // Changed to let
    const LEVEL_SPEED_INCREASE_FACTOR = 0.20;

    let currentBaseBallSpeed_dx;
    let currentBaseBallSpeed_dy;

    let activePowerUps = {
        slow_ball: { active: false, timerId: null, affectedBalls: [], deactivationTime: 0 },
        multi_ball: { active: false, timerId: null, extraBalls: [], deactivationTime: 0 },
        speed_ball: { active: false, timerId: null, affectedBalls: [], deactivationTime: 0 }
    };

    const brickTypeMapping = {
        0: null, 1: { type: 'single', hp: 1 }, 2: { type: 'double', hp: 2 },
        3: { type: 'triple', hp: 3 }, 'u': { type: 'unbreakable', hp: Infinity },
        'pl': { type: 'powerup_life', hp: 1, powerupType: 'life' },
        'ps': { type: 'powerup_slow', hp: 1, powerupType: 'slow_ball' },
        'pm': { type: 'powerup_multi', hp: 1, powerupType: 'multi_ball' },
        'pf': { type: 'powerup_speed', hp: 1, powerupType: 'speed_ball' }
    };

    const levels = [ /* ... level data remains the same as before ... */
        { layout: [[0,0,1,1,1,1,1,1,0,0],[0,1,1,'pl',1,1,'ps',1,1,0],[1,1,2,1,1,1,1,2,1,1],[0,0,1,1,'u','u',1,1,0,0]]},
        { layout: [['u',1,2,1,1,1,1,2,1,'u'],[1,2,1,'pm',1,1,'pf',1,2,1],[2,1,3,1,'u','u',1,3,1,2],[1,1,1,2,1,1,2,1,1,1],[0,0,'u',1,1,1,1,'u',0,0]]},
        { layout: [[0,0,0,1,1,1,1,0,0,0],[0,0,1,2,1,1,2,1,0,0],[0,1,2,3,'u','u',3,2,1,0],[1,2,3,'ps',1,1,'pl',3,2,1],['u',1,2,1,0,0,1,2,1,'u'],[0,0,1,1,1,1,1,1,0,0]]},
        { layout: [[1,1,'pl',1,1,1,1,'ps',1,1],[1,'u',1,2,1,1,2,1,'u',1],[2,1,'pm',1,'u','u',1,'pf',1,2],[1,'u',1,2,1,1,2,1,'u',1],[1,1,'pl',1,1,1,1,'ps',1,1]]},
        { layout: [['u','u',1,2,3,3,2,1,'u','u'],[0,'u',2,1,'pf','pm',1,2,'u',0],[0,0,'u',1,1,1,1,'u',0,0],[0,0,1,3,'pl','ps',3,1,0,0],[0,1,2,1,2,2,1,2,1,0],[1,2,1,0,0,0,0,1,2,1]]}
    ];

    let GAME_WIDTH = 600; let GAME_HEIGHT = 450; // Default values, will be updated
    // ASPECT_RATIO might need to be based on ORIGINAL_GAME_WIDTH/HEIGHT if used for scaling logic
    // For now, its usage in BRICK_WIDTH calculation is replaced.
    // const ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT; 
    let PADDLE_WIDTH = 100; // Changed to let
    let PADDLE_HEIGHT = 15; // Changed to let
    let PADDLE_Y_OFFSET = 20; // Changed to let
    let BALL_RADIUS = 8; // Changed to let
    let BRICK_WIDTH = (ORIGINAL_GAME_WIDTH / 10) - 4; // Initial value based on ORIGINAL_GAME_WIDTH, changed to let
    let BRICK_HEIGHT = 20; // Changed to let
    let BRICK_PADDING = 2; // Changed to let
    let BRICK_OFFSET_TOP = 30; // Changed to let
    let BRICK_OFFSET_LEFT = 2; // Changed to let
    let BALL_PADDLE_OFFSET = 1; // For the small gap between paddle and unlaunched ball

    let score = 0; let lives = 3;
    let currentGameScale = 1;
    let isPaddleDragging = false;
    let isBgmMeted = true;
    let isSfxMuted = false;
    let gameRunning = true; // Will be synced with currentGameState
    let bricks = []; let ballLaunched = false;
    let PADDLE_SPEED = 8; // Changed to let

    const paddle = {
        // Initialize with values that would be typical for ORIGINAL_GAME_WIDTH/HEIGHT, these will be updated by updateGameElementSizesAndSpeeds
        x: ORIGINAL_GAME_WIDTH / 2 - PADDLE_WIDTH / 2, 
        y: ORIGINAL_GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: PADDLE_SPEED, moveLeft: false, moveRight: false
    };
    let paddleElement;

    // New function to update game element sizes and speeds
    function updateGameElementSizesAndSpeeds() {
        // Paddle Dimensions
        PADDLE_WIDTH = (100 / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;
        PADDLE_HEIGHT = (15 / ORIGINAL_GAME_HEIGHT) * GAME_HEIGHT;
        PADDLE_Y_OFFSET = (20 / ORIGINAL_GAME_HEIGHT) * GAME_HEIGHT; // Reverted to original base value 20

        // Ball Radius - Scaled by width for consistency. 
        // Consider Math.min(GAME_WIDTH / ORIGINAL_GAME_WIDTH, GAME_HEIGHT / ORIGINAL_GAME_HEIGHT) for a uniform scale factor.
        BALL_RADIUS = (8 / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;

        // Brick Dimensions & Layout
        // Original BRICK_WIDTH calculation was (ORIGINAL_GAME_WIDTH / 10 - 4)
        BRICK_WIDTH = ((ORIGINAL_GAME_WIDTH / 10 - 4) / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;
        BRICK_HEIGHT = (20 / ORIGINAL_GAME_HEIGHT) * GAME_HEIGHT;
        BRICK_PADDING = (2 / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;
        BRICK_OFFSET_TOP = (30 / ORIGINAL_GAME_HEIGHT) * GAME_HEIGHT;
        BRICK_OFFSET_LEFT = (2 / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;

        // Speeds: Scale horizontal speeds by width, vertical speeds by height
        PADDLE_SPEED = (8 / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;
        INITIAL_BALL_SPEED_DX = (2 / ORIGINAL_GAME_WIDTH) * GAME_WIDTH;
        INITIAL_BALL_SPEED_DY = (-4 / ORIGINAL_GAME_HEIGHT) * GAME_HEIGHT; // Maintain negative for direction
        BALL_PADDLE_OFFSET = GAME_HEIGHT / ORIGINAL_GAME_HEIGHT; // Scale the offset

        // Update Paddle Object properties
        paddle.width = PADDLE_WIDTH;
        paddle.height = PADDLE_HEIGHT;
        paddle.speed = PADDLE_SPEED;
        paddle.y = GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET;
        // Re-center paddle. This is important after a resize or at game start.
        paddle.x = GAME_WIDTH / 2 - PADDLE_WIDTH / 2;

        // If paddleElement exists, update its CSS size.
        // drawPaddle() will use paddle.x and paddle.y to position it.
        if (paddleElement) {
            paddleElement.style.width = paddle.width + 'px';
            paddleElement.style.height = paddle.height + 'px';
        }

        // Update existing balls' radius and their DOM elements' size
        balls.forEach(ball => {
            ball.radius = BALL_RADIUS; // Update the object's radius
            if (ball.element) {
                ball.element.style.width = (BALL_RADIUS * 2) + 'px';
                ball.element.style.height = (BALL_RADIUS * 2) + 'px';
            }
        });

        // Update existing bricks' properties and their DOM elements' size and position
        // The actual DOM update for bricks will be handled by drawBricks, 
        // but we ensure their data properties are correct here.
        bricks.forEach((row, r) => {
            row.forEach((brick, c) => {
                if (brick) { // Check if brick exists at this position
                    brick.width = BRICK_WIDTH;
                    brick.height = BRICK_HEIGHT;
                    brick.x = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    brick.y = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                }
            });
        });
    }

    function createPaddleElement() {
        const el = document.createElement('div');
        el.id = 'paddle';
        el.style.position = 'absolute';
        el.style.width = paddle.width + 'px';
        el.style.height = paddle.height + 'px';
        // el.style.backgroundColor = '#0f0'; // Will be handled by CSS
        el.style.left = paddle.x + 'px'; // Initial position
        el.style.top = paddle.y + 'px';   // Initial position
        return el;
    }

    function drawPaddle() { 
        if (!paddleElement) { 
            paddleElement = createPaddleElement(); 
            gameArea.appendChild(paddleElement); 
        }
        paddleElement.style.left = `${paddle.x}px`;
        paddleElement.style.top = `${paddle.y}px`; // Ensure top is also updated if paddle y can change (though not in current spec)
    }

    function createNewBall(x, y, dx, dy, idSuffix = '') {
        const newBall = { x, y, radius: BALL_RADIUS, dx, dy, element: null, id: `ball${idSuffix}` };
        newBall.element = createBallElementDOM(newBall); return newBall;
    }
    let balls = [];
    function createBallElementDOM(ballObj) {
        const el = document.createElement('div');
        el.id = ballObj.id;
        el.classList.add('ball-div');
        el.style.position = 'absolute';
        el.style.width = (ballObj.radius * 2) + 'px';
        el.style.height = (ballObj.radius * 2) + 'px';
        // el.style.backgroundColor = '#f00'; // Will be handled by CSS
        // el.style.borderRadius = '50%'; // Will be handled by CSS
        return el;
    }
    function drawBalls() {
        balls.forEach(ballObj => {
            if (!ballObj.element) {
                ballObj.element = createBallElementDOM(ballObj);
                gameArea.appendChild(ballObj.element);
            }
            // Ensure radius change is reflected in element size (already done in updateGameElementSizesAndSpeeds, but safe to ensure here too for newly created balls if logic changes)
            // However, createBallElementDOM already sets this based on ballObj.radius.
            // The main place for updating existing elements is updateGameElementSizesAndSpeeds.
            // ballObj.element.style.width = (ballObj.radius * 2) + 'px'; 
            // ballObj.element.style.height = (ballObj.radius * 2) + 'px';

            ballObj.element.style.left = `${ballObj.x - ballObj.radius}px`;
            ballObj.element.style.top = `${ballObj.y - ballObj.radius}px`;
        });
    }

    function loadLevel(levelIndex) { /* ... same as before ... */
        bricks.forEach(row => row.forEach(brick => { if (brick && brick.element) brick.element.remove(); }));
        bricks = []; const level = levels[levelIndex]; if (!level) { console.error("Level data not found"); return; }
        const layout = level.layout;
        layout.forEach((row, r) => {
            bricks[r] = [];
            row.forEach((brickCode, c) => {
                const brickTypeDetails = brickTypeMapping[brickCode];
                if (brickTypeDetails) {
                    const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                    bricks[r][c] = { x: brickX, y: brickY, width: BRICK_WIDTH, height: BRICK_HEIGHT, status: 1,
                                     type: brickTypeDetails.type, hp: brickTypeDetails.hp,
                                     powerupType: brickTypeDetails.powerupType || null };
                } else { bricks[r][c] = null; }
            });
        });
        drawBricks();
    }
    function drawBricks() {
        bricks.forEach((row, r) => { row.forEach((brick, c) => {
            if (brick && brick.status === 1) {
                if (!brick.element) {
                    const el = document.createElement('div');
                    el.style.position = 'absolute';
                    el.style.left = brick.x + 'px';
                    el.style.top = brick.y + 'px';
                    el.style.width = brick.width + 'px';
                    el.style.height = brick.height + 'px';
                    el.classList.add('brick-div');

                    // Add type-specific class
                    if (brick.type.startsWith('powerup_')) {
                        el.classList.add('brick-powerup');
                    } else {
                        el.classList.add(`brick-${brick.type}`);
                    }
                    // Add HP-specific class if applicable
                    if (brick.hp > 0 && brick.hp !== Infinity) {
                        el.classList.add(`hp-${brick.hp}`);
                    }

                    brick.element = el;
                    gameArea.appendChild(el);
                } else {
                    // Update existing brick element's style for position and dimensions
                    brick.element.style.left = brick.x + 'px';
                    brick.element.style.top = brick.y + 'px';
                    brick.element.style.width = brick.width + 'px';
                    brick.element.style.height = brick.height + 'px';

                    // Update HP class if brick HP has changed (existing logic)
                    for (let i = brick.element.classList.length - 1; i >= 0; i--) {
                        const className = brick.element.classList[i];
                        if (className.startsWith('hp-')) {
                            brick.element.classList.remove(className);
                        }
                    }
                    if (brick.hp > 0 && brick.hp !== Infinity) {
                        brick.element.classList.add(`hp-${brick.hp}`);
                    }
                }
            } else if (brick && brick.element) { // Brick status is 0 (broken) but element exists
                brick.element.remove(); 
                brick.element = null; 
            }
        }); });
    }

    function update() {
        // gameRunning = (currentGameState === GAME_STATE.PLAYING); // Moved down

        const orientationMessageElement = document.getElementById('orientation-message');
        const orientationMessageVisible = orientationMessageElement && orientationMessageElement.style.display === 'flex';

        if (orientationMessageVisible && currentGameState === GAME_STATE.PLAYING) {
            // If portrait message is up and game is supposed to be playing, effectively pause it.
            // Draw current state but don't update physics or logic.
            drawPaddle(); // Keep elements visible
            drawBalls();
            drawBricks();
            requestAnimationFrame(update);
            return; // Skip game logic updates
        }

        gameRunning = (currentGameState === GAME_STATE.PLAYING); // Now set gameRunning

        if (!gameRunning) { // This handles PAUSED, MENU, etc. states correctly
            requestAnimationFrame(update);
            return;
        }

        if (paddle.moveLeft) { /* ... paddle movement ... */
            paddle.x -= paddle.speed; if (paddle.x < 0) paddle.x = 0;
            if (!ballLaunched && balls.length > 0 && balls[0]) balls[0].x = paddle.x + paddle.width / 2;
        }
        if (paddle.moveRight) { /* ... paddle movement ... */
            paddle.x += paddle.speed; if (paddle.x + paddle.width > GAME_WIDTH) paddle.x = GAME_WIDTH - paddle.width;
            if (!ballLaunched && balls.length > 0 && balls[0]) balls[0].x = paddle.x + paddle.width / 2;
        }

        for (let i = balls.length - 1; i >= 0; i--) {
            const currentBall = balls[i];
            if (ballLaunched) { /* ... ball movement ... */
                currentBall.x += currentBall.dx; currentBall.y += currentBall.dy;
            } else if (balls.length === 1) { // Assuming this is the main ball before launch
                currentBall.x = paddle.x + paddle.width / 2; 
                currentBall.y = paddle.y - currentBall.radius - BALL_PADDLE_OFFSET;
            }

            if (ballLaunched) { /* ... wall collisions ... */
                if (currentBall.y - currentBall.radius < 0) { currentBall.y = currentBall.radius; currentBall.dy *= -1; playSound(sfxWallHit); }
                if (currentBall.x - currentBall.radius < 0) { currentBall.x = currentBall.radius; currentBall.dx *= -1; playSound(sfxWallHit); }
                else if (currentBall.x + currentBall.radius > GAME_WIDTH) { currentBall.x = GAME_WIDTH - currentBall.radius; currentBall.dx *= -1; playSound(sfxWallHit); }
                if (currentBall.y + currentBall.radius > GAME_HEIGHT) {
                    currentBall.element.remove(); balls.splice(i, 1);
                    if (balls.length === 0) {
                        lives--; livesDisplay.textContent = lives; playSound(sfxLifeLost); deactivateAllPowerUps(true);
                        if (lives <= 0) { handleGameOver("Game Over!"); }
                        else { 
                            ballLaunched = false;
                            balls.push(createNewBall(paddle.x + paddle.width/2, paddle.y - BALL_RADIUS - BALL_PADDLE_OFFSET, (Math.random() > 0.5 ? 1:-1)*currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, `main_${Date.now()}`));
                            gameArea.appendChild(balls[0].element);
                        }
                    } continue;
                }
            }
            if (ballLaunched && currentBall.dy > 0) { /* ... paddle collision ... */
                 if (currentBall.x + currentBall.radius > paddle.x && currentBall.x - currentBall.radius < paddle.x + paddle.width &&
                     currentBall.y + currentBall.radius > paddle.y && currentBall.y - currentBall.radius < paddle.y + paddle.height) {
                    currentBall.y = paddle.y - currentBall.radius; currentBall.dy *= -1;
                    playSound(sfxPaddleHit);
                }
            }
            if (ballLaunched) { /* ... brick collision ... */
                let hitBrick = false;
                for (let r = 0; r < bricks.length; r++) {
                    for (let c = 0; c < (bricks[r] ? bricks[r].length : 0); c++) {
                        const brick = bricks[r][c];
                        if (brick && brick.status === 1) {
                            if (currentBall.x + currentBall.radius > brick.x && currentBall.x - currentBall.radius < brick.x + brick.width &&
                                currentBall.y + currentBall.radius > brick.y && currentBall.y - currentBall.radius < brick.y + brick.height) {
                                currentBall.dy *= -1;
                                if (brick.type !== 'unbreakable') {
                                    brick.hp--;
                                    if (brick.hp <= 0) {
                                        brick.status = 0; score += 10; scoreDisplay.textContent = score;
                                        playSound(sfxBrickHitBreak);
                                        if (brick.powerupType) activatePowerUp(brick.powerupType, currentBall);
                                    } else {
                                        playSound(sfxBrickHitSolid);
                                        // console.log(`Brick hit, HP: ${brick.hp}`); // Debug
                                    }
                                } else {
                                    playSound(sfxBrickHitSolid);
                                    // console.log("Unbreakable brick hit!"); // Debug
                                }
                                hitBrick = true; break;
                            }
                        }
                    } if (hitBrick) break;
                }
            }
        }
        drawPaddle(); drawBalls(); drawBricks();
        if (ballLaunched && balls.length > 0) checkLevelCompletion();
        requestAnimationFrame(update);
    }

    function checkLevelCompletion() {
        let clearableBricksRemaining = 0;
        bricks.forEach(row => row.forEach(brick => {
            if (brick && brick.status === 1 && brick.type !== 'unbreakable') clearableBricksRemaining++;
        }));
        if (clearableBricksRemaining === 0 && balls.length > 0) {
            if (currentLevelIndex < levels.length - 1) {
                currentGameState = GAME_STATE.LEVEL_TRANSITION;
                levelClearedTitle.textContent = `Level ${currentLevelIndex + 1} Cleared!`;
                playSound(sfxLevelComplete);
                showScreen(levelClearedScreen);
            } else {
                playSound(sfxLevelComplete); // Or a distinct "win" sound
                handleGameOver("You Win!");
            }
        }
    }

    function toggleBgm() {
        isBgmMeted = !isBgmMeted;
        if (bgmMusic) {
            bgmMusic.muted = isBgmMeted;
            // Update button text
            const bgmMuteBtn = document.getElementById('bgm-mute-btn');
            if (bgmMuteBtn) {
                bgmMuteBtn.textContent = isBgmMeted ? "Unmute BGM" : "Mute BGM";
            }
            // If unmuting and game is in a state where BGM should play
            if (!isBgmMeted && currentGameState === GAME_STATE.PLAYING && bgmMusic.paused) {
                bgmMusic.play().catch(error => console.warn("Error playing BGM on unmute:", error));
            } else if (isBgmMeted && !bgmMusic.paused) { // If muting and BGM is playing
                 bgmMusic.pause();
            }
        }
    }

    function toggleSfx() {
        isSfxMuted = !isSfxMuted;
        // Update button text
        const sfxMuteBtn = document.getElementById('sfx-mute-btn');
        if (sfxMuteBtn) {
            sfxMuteBtn.textContent = isSfxMuted ? "Unmute SFX" : "Mute SFX";
        }
    }

    function handleGameOver(message = "Game Over!") {
        playSound(sfxGameOver);
        if (bgmMusic) {
            bgmMusic.pause();
        }
        currentGameState = GAME_STATE.GAME_OVER;
        deactivateAllPowerUps(true);
        gameOverMainTitle.textContent = message;
        finalScoreDisplay.textContent = score; // Ensure final score is displayed

        showScreen(gameOverScreen); // Ensure game over screen is visible
    }

    function updatePowerUpDisplay() {
        if (!powerUpStatusDisplay) return; let statusText = [];
        if (activePowerUps.slow_ball.active) statusText.push("Slow Ball");
        if (activePowerUps.multi_ball.active) statusText.push("Multi-Ball (" + activePowerUps.multi_ball.extraBalls.length + " extra)");
        if (activePowerUps.speed_ball.active) statusText.push("Speed Ball");
        powerUpStatusDisplay.textContent = statusText.length > 0 ? statusText.join(' | ') + " Active!" : "";
    }

    function activatePowerUp(type, currentHitBall, options = {}) {
        const { remainingDuration = null, resumingBallIds = null, isResumingMultiBall = false } = options;
        // console.log(`Power-up ${type} activated! Options:`, options);

        playSound(sfxPowerupActivate);
        const powerUp = activePowerUps[type];
        if (powerUp && powerUp.timerId) {
            clearTimeout(powerUp.timerId);
            powerUp.timerId = null;
        }

        switch (type) {
            case 'life':
                lives++;
                livesDisplay.textContent = lives;
                break;
            case 'slow_ball':
            case 'speed_ball':
                const isSlow = type === 'slow_ball';
                const speedFactor = isSlow ? 0.5 : 1.5;
                const duration = remainingDuration !== null && remainingDuration > 0 ? remainingDuration : (isSlow ? SLOW_BALL_DURATION : SPEED_BALL_DURATION);

                powerUp.active = true;
                powerUp.affectedBalls = []; // Clear previous list
                powerUp.deactivationTime = Date.now() + duration;

                const ballsToAffect = [];
                if (resumingBallIds && resumingBallIds.length > 0) {
                    resumingBallIds.forEach(ballId => {
                        const ball = balls.find(b => b.id === ballId);
                        if (ball) ballsToAffect.push(ball);
                    });
                } else if (currentHitBall) {
                    ballsToAffect.push(currentHitBall);
                }

                ballsToAffect.forEach(ballInstance => {
                    // Deactivate conflicting power-up on the same ball
                    if (isSlow && activePowerUps.speed_ball.affectedBalls.includes(ballInstance)) {
                         deactivatePowerUp('speed_ball', ballInstance, true); // isResetContext true to prevent speed normalization if it's about to be slowed
                    } else if (!isSlow && activePowerUps.slow_ball.affectedBalls.includes(ballInstance)) {
                         deactivatePowerUp('slow_ball', ballInstance, true); // isResetContext true
                    }

                    // Only apply speed change if not already affected by the same type or if resuming
                    if (!powerUp.affectedBalls.includes(ballInstance) || (resumingBallIds && resumingBallIds.includes(ballInstance.id))) {
                        ballInstance.dx *= speedFactor;
                        ballInstance.dy *= speedFactor;
                        // Prevent ball from becoming too slow
                        if (isSlow) {
                            if (Math.abs(ballInstance.dx) < 1 && ballInstance.dx !== 0) ballInstance.dx = Math.sign(ballInstance.dx) * 1;
                            if (Math.abs(ballInstance.dy) < 1 && ballInstance.dy !== 0) ballInstance.dy = Math.sign(ballInstance.dy) * 1;
                        }
                        powerUp.affectedBalls.push(ballInstance);
                    }
                });

                powerUp.timerId = setTimeout(() => deactivatePowerUp(type), duration);
                break;

            case 'multi_ball':
                powerUp.active = true;
                const multiDuration = remainingDuration !== null && remainingDuration > 0 ? remainingDuration : MULTI_BALL_DURATION;
                powerUp.deactivationTime = Date.now() + multiDuration;
                powerUp.extraBalls = []; // Reset extraBalls array

                if (isResumingMultiBall && resumingBallIds && resumingBallIds.length > 0) {
                    // Resuming: find existing balls by ID and add to extraBalls list
                    resumingBallIds.forEach(ballId => {
                        const ball = balls.find(b => b.id === ballId);
                        if (ball) { // Ball should have been created by loadGameState general ball loop
                            powerUp.extraBalls.push(ball);
                        }
                    });
                } else if (!isResumingMultiBall) {
                    // Not resuming: create new balls
                    const ballsToAdd = MAX_BALLS - balls.length;
                    for (let i = 0; i < ballsToAdd; i++) {
                        if (balls.length >= MAX_BALLS) break;
                        const newBall = createNewBall(
                            paddle.x + paddle.width / 2,
                            paddle.y - BALL_RADIUS - 20, // شويه فوق المجداف
                            currentBaseBallSpeed_dx * (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 0.4),
                            currentBaseBallSpeed_dy * (0.8 + Math.random() * 0.4),
                            `extra${balls.length}_${Date.now()}`
                        );
                        balls.push(newBall); // Add to global balls array
                        gameArea.appendChild(newBall.element);
                        powerUp.extraBalls.push(newBall); // Add to this power-up's list
                    }
                }
                powerUp.timerId = setTimeout(() => deactivatePowerUp(type), multiDuration);
                break;
        }
        updatePowerUpDisplay();
    }

    function deactivatePowerUp(type, ballRef, isResetCtx = false) {
        // console.log(`Power-up ${type} deactivated. BallRef: ${ballRef ? ballRef.id : 'N/A'}, isResetCtx: ${isResetCtx}`);
        playSound(sfxPowerupDeactivate);
        playSound(sfxPowerupDeactivate);
        const powerUp = activePowerUps[type];
        if (!powerUp || !powerUp.active) return;

        if (powerUp.timerId) {
            clearTimeout(powerUp.timerId);
            powerUp.timerId = null;
        }
        powerUp.active = false;

        switch (type) {
            case 'slow_ball':
            case 'speed_ball':
                const ballsToNormalize = ballRef ? [ballRef] : [...powerUp.affectedBalls];
                ballsToNormalize.forEach(b => {
                    if (b) { // Check if ball b exists
                        // Only normalize if not in reset context or if it's the specific ball being deactivated
                        // This prevents double normalization if another powerup is still active on it.
                        const otherSpeedPowerUp = type === 'slow_ball' ? activePowerUps.speed_ball : activePowerUps.slow_ball;
                        if (!isResetCtx && !otherSpeedPowerUp.active) {
                             // Check if the ball instance b is actually in the list of otherSpeedPowerUp.affectedBalls
                            let isAffectedByOther = false;
                            if (otherSpeedPowerUp.affectedBalls && Array.isArray(otherSpeedPowerUp.affectedBalls)) {
                                isAffectedByOther = otherSpeedPowerUp.affectedBalls.includes(b);
                            }

                            if(!isAffectedByOther) {
                                b.dx = Math.sign(b.dx) * currentBaseBallSpeed_dx;
                                b.dy = Math.sign(b.dy) * Math.abs(currentBaseBallSpeed_dy);
                            }
                        }
                         // Remove from affected list
                        const index = powerUp.affectedBalls.indexOf(b);
                        if (index > -1) {
                            powerUp.affectedBalls.splice(index, 1);
                        }
                    }
                });
                // If ballRef was specified and it's the last one, clear the main list too.
                if (ballRef && powerUp.affectedBalls.length === 0) {
                     powerUp.affectedBalls = [];
                } else if (!ballRef) { // Full deactivation for this powerup type
                     powerUp.affectedBalls = [];
                }
                break;
            case 'multi_ball':
                // Remove only extra balls associated with this power-up
                powerUp.extraBalls.forEach(exBall => {
                    const i = balls.indexOf(exBall);
                    if (i > -1) {
                        balls.splice(i, 1);
                        if (exBall.element) exBall.element.remove();
                    }
                });
                powerUp.extraBalls = [];
                if (balls.length === 0 && !isResetCtx && currentGameState === GAME_STATE.PLAYING) {
                    // Respawn a new main ball if all balls are gone
                    const newMainBall = createNewBall(
                        paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS - BALL_PADDLE_OFFSET,
                        currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, // Use current base speed
                        `main_${Date.now()}`
                    );
                    balls.push(newMainBall);
                    gameArea.appendChild(newMainBall.element);
                    ballLaunched = false; // Require user to launch the new ball
                }
                break;
        }
        updatePowerUpDisplay();
    }

    function deactivateAllPowerUps(isResetCtx = true) {
        // Iterate over a copy of keys if deactivation modifies the activePowerUps structure or array
        const powerUpTypes = Object.keys(activePowerUps);
        powerUpTypes.forEach(type => {
            if (activePowerUps[type].active) {
                // For slow_ball and speed_ball, pass null for ballRef to reset all affected balls
                deactivatePowerUp(type, null, isResetCtx);
            }
        });
    }


    // Combined event listener for keydown
    document.addEventListener('keydown', (e) => {
        // Guard game control inputs by PLAYING state
        if (currentGameState !== GAME_STATE.PLAYING) return;

        if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') paddle.moveLeft=true;
        else if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') paddle.moveRight=true;
        else if ((e.key===' '||e.code==='Space') && !ballLaunched && balls.length > 0) ballLaunched=true;
    });

    document.addEventListener('keyup', (e) => { 
        if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') paddle.moveLeft=false;
        else if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') paddle.moveRight=false;
    });
    gameArea.addEventListener('mousemove', (e) => {
        if (currentGameState !== GAME_STATE.PLAYING) return;
        const rect = gameArea.getBoundingClientRect();
        // currentGameScale is now always 1, so direct calculation is used.
        let mouseXInGame = e.clientX - rect.left;

        let newPaddleX = mouseXInGame - (paddle.width / 2);

        if (newPaddleX < 0) newPaddleX = 0;
        if (newPaddleX + paddle.width > GAME_WIDTH) newPaddleX = GAME_WIDTH - paddle.width;
        paddle.x = newPaddleX;
        if (!ballLaunched && balls.length > 0 && balls[0]) {
            balls[0].x = paddle.x + paddle.width / 2;
        }
    });
    gameArea.addEventListener('click', () => { /* ... guarded ... */
        if (currentGameState !== GAME_STATE.PLAYING) return;
        if (!ballLaunched && balls.length > 0) ballLaunched = true;
    });

    // Touch Start
    gameArea.addEventListener('touchstart', (e) => {
        if (currentGameState !== GAME_STATE.PLAYING) return;

        const touch = e.touches[0];
        const rect = gameArea.getBoundingClientRect();
        // currentGameScale is now always 1, so direct calculation is used.
        let touchXInGame = touch.clientX - rect.left;
        let touchYInGame = touch.clientY - rect.top;

        // Check if touch is on the paddle
        if (touchXInGame >= paddle.x &&
            touchXInGame <= paddle.x + paddle.width &&
            touchYInGame >= paddle.y &&
            touchYInGame <= paddle.y + paddle.height) {
            isPaddleDragging = true;
            // Update paddle position immediately to center it on touch
            let newPaddleX = touchXInGame - (paddle.width / 2);
            if (newPaddleX < 0) newPaddleX = 0;
            if (newPaddleX + paddle.width > GAME_WIDTH) newPaddleX = GAME_WIDTH - paddle.width;
            paddle.x = newPaddleX;
            if (!ballLaunched && balls.length > 0 && balls[0]) {
                balls[0].x = paddle.x + paddle.width / 2;
            }
            e.preventDefault(); // Prevent scrolling if drag starts on paddle
        }
    }, { passive: false }); // passive: false needed for preventDefault

    // Touch Move
    gameArea.addEventListener('touchmove', (e) => {
        if (currentGameState !== GAME_STATE.PLAYING || !isPaddleDragging) return;
        e.preventDefault(); // Prevent scrolling while dragging

        const touch = e.touches[0];
        const rect = gameArea.getBoundingClientRect();
        // currentGameScale is now always 1, so direct calculation is used.
        let touchXInGame = touch.clientX - rect.left;
        let newPaddleX = touchXInGame - (paddle.width / 2);

        if (newPaddleX < 0) newPaddleX = 0;
        if (newPaddleX + paddle.width > GAME_WIDTH) newPaddleX = GAME_WIDTH - paddle.width;
        paddle.x = newPaddleX;

        if (!ballLaunched && balls.length > 0 && balls[0]) {
            balls[0].x = paddle.x + paddle.width / 2;
        }
    }, { passive: false }); // passive: false needed for preventDefault

    // Touch End / Cancel
    function handleTouchEnd() {
        if (isPaddleDragging) {
            isPaddleDragging = false;
        }
    }
    gameArea.addEventListener('touchend', handleTouchEnd);
    gameArea.addEventListener('touchcancel', handleTouchEnd);

    function resizeGameArea() {
        const gameContainer = document.getElementById('game-container');
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const targetAspectRatio = 16 / 9;

        let containerWidth;
        let containerHeight;

        if (viewportWidth >= 1280 && viewportHeight >= 720) {
            containerWidth = 1280;
            containerHeight = 720;
        } else {
            let widthBasedOnHeight = viewportHeight * targetAspectRatio;
            let heightBasedOnWidth = viewportWidth / targetAspectRatio;

            if (widthBasedOnHeight > viewportWidth) {
                containerWidth = viewportWidth;
                containerHeight = heightBasedOnWidth;
            } else {
                containerWidth = widthBasedOnHeight;
                containerHeight = viewportHeight;
            }

            containerWidth = Math.min(containerWidth, 1280);
            containerHeight = Math.min(containerHeight, 720);
            
            let currentRatio = containerWidth / containerHeight;
            if (Math.abs(currentRatio - targetAspectRatio) > 0.01) { // Check if ratio is off by more than 1%
                if (currentRatio > targetAspectRatio) { // container is too wide
                   containerWidth = containerHeight * targetAspectRatio;
                } else { // container is too tall
                   containerHeight = containerWidth / targetAspectRatio;
                }
            }
        }

        gameContainer.style.width = containerWidth + 'px';
        gameContainer.style.height = containerHeight + 'px';

        // Assign container dimensions to GAME_WIDTH and GAME_HEIGHT
        GAME_WIDTH = containerWidth;
        GAME_HEIGHT = containerHeight-106;

        // Set gameArea dimensions directly
        gameArea.style.width = GAME_WIDTH + 'px';
        gameArea.style.height = GAME_HEIGHT + 'px';

        // Remove scaling of gameArea itself, or set to 1
        gameArea.style.transformOrigin = 'top left'; // Keep or remove if not needed
        gameArea.style.transform = 'scale(1)';
        currentGameScale = 1; // Game's internal logic will use GAME_WIDTH/HEIGHT directly
        updateGameElementSizesAndSpeeds(); // Call after GAME_WIDTH and GAME_HEIGHT are updated
    }

    function init() {
        // Call updateGameElementSizesAndSpeeds() early to ensure all dimensions and speeds are set
        // according to the current GAME_WIDTH and GAME_HEIGHT (which might have been set by an initial resize).
        updateGameElementSizesAndSpeeds(); 

        score = 0; lives = 3;
        scoreDisplay.textContent = score; livesDisplay.textContent = lives;

        currentLevelIndex = 0;
        // INITIAL_BALL_SPEED_DX/DY are now correctly scaled by updateGameElementSizesAndSpeeds()
        currentBaseBallSpeed_dx = INITIAL_BALL_SPEED_DX; 
        currentBaseBallSpeed_dy = INITIAL_BALL_SPEED_DY;

        deactivateAllPowerUps(true);
        // paddle.x and paddle.y are set by updateGameElementSizesAndSpeeds()
        balls.forEach(b => { if (b.element) b.element.remove(); }); balls = [];
        // BALL_RADIUS and BALL_PADDLE_OFFSET are now scaled by updateGameElementSizesAndSpeeds()
        const initialBall = createNewBall( paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS - BALL_PADDLE_OFFSET, 
            currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, "main");
        balls.push(initialBall); gameArea.appendChild(initialBall.element);
        ballLaunched = false;
        loadLevel(currentLevelIndex); // loadLevel will use the scaled BRICK_* variables
        // gameRunning is true implicitly by currentGameState being set to PLAYING by caller
    }

    // --- Screen Management Functions (Corrected) ---
    function showScreen(screenToShow) {
        // Hide all screens first by removing 'visible-screen' and setting display to none
        [startScreen, levelClearedScreen, gameOverScreen].forEach(screen => {
            if (screen) {
                screen.classList.remove('visible-screen');
                screen.style.display = 'none';
            }
        });

        // Hide game-related elements that are not part of a full screen overlay
        if (scoreBoard) scoreBoard.style.display = 'none';
        if (powerUpStatusDisplay) powerUpStatusDisplay.style.display = 'none';
        if (gameArea) gameArea.style.display = 'none';
        
        if (screenToShow) {
            screenToShow.style.display = 'flex'; // Set display before triggering transition
            // Timeout to allow display property to apply before adding class for transition
            setTimeout(() => {
                screenToShow.classList.add('visible-screen');
            }, 10); // Small delay like 10ms is usually enough
        }
    }

    function showGameElements() {
        showScreen(null); // Hide all overlay screens
        if (scoreBoard) scoreBoard.style.display = 'flex';
        if (powerUpStatusDisplay) powerUpStatusDisplay.style.display = 'block';
        resizeGameArea(); // Call resizeGameArea to adjust layout after HUD elements are shown
        if (gameArea) gameArea.style.display = 'block';
    }

    startNewGameBtn.addEventListener('click', () => {
        if (bgmMusic) bgmMusic.muted = isBgmMeted;
        showGameElements();
        currentGameState = GAME_STATE.PLAYING;
        init(); // init should reset game state variables
        if (!isBgmMeted && bgmMusic && bgmMusic.paused) {
            bgmMusic.play().catch(error => console.warn("Error starting BGM:", error));
        } else if (bgmMusic) {
            bgmMusic.muted = isBgmMeted; // Ensure mute state is respected
        }
    });

    nextLevelBtn.addEventListener('click', () => {
        if (bgmMusic) bgmMusic.muted = isBgmMeted;
        currentLevelIndex++;
        // showGameElements calls resizeGameArea, which calls updateGameElementSizesAndSpeeds.
        // This ensures INITIAL_BALL_SPEED_DX/DY are up-to-date before being used here.
        showGameElements(); 
        currentBaseBallSpeed_dx = INITIAL_BALL_SPEED_DX + (currentLevelIndex * LEVEL_SPEED_INCREASE_FACTOR * INITIAL_BALL_SPEED_DX);
        currentBaseBallSpeed_dy = INITIAL_BALL_SPEED_DY - (currentLevelIndex * LEVEL_SPEED_INCREASE_FACTOR * Math.abs(INITIAL_BALL_SPEED_DY));
        // console.log(`Starting Level ${currentLevelIndex+1} base speed: dx=${currentBaseBallSpeed_dx.toFixed(2)}, dy=${currentBaseBallSpeed_dy.toFixed(2)}`);
        ballLaunched = false; deactivateAllPowerUps(true);
        balls.forEach(b => b.element.remove()); balls = [];
        // Use scaled BALL_RADIUS and BALL_PADDLE_OFFSET
        const newPrimaryBall = createNewBall(paddle.x+paddle.width/2, paddle.y - BALL_RADIUS - BALL_PADDLE_OFFSET, (Math.random()>0.5?1:-1)*currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, `main_${Date.now()}`);
        balls.push(newPrimaryBall); if(newPrimaryBall.element && newPrimaryBall.element.parentElement !== gameArea) gameArea.appendChild(newPrimaryBall.element);
        loadLevel(currentLevelIndex);
        currentGameState = GAME_STATE.PLAYING;
        if (!isBgmMeted && bgmMusic && bgmMusic.paused) { // If it was somehow paused
            bgmMusic.play().catch(error => console.warn("Error continuing BGM:", error));
        } else if (bgmMusic) {
             bgmMusic.muted = isBgmMeted;
        }
    });

    playAgainBtn.addEventListener('click', () => {
        // For 'Play Again', treat as a new game regarding save state.
        // If there was an old save interval (e.g., from a game over that wasn't fully cleaned up), clear it.
        if (bgmMusic) bgmMusic.muted = isBgmMeted;

        showGameElements();
        currentGameState = GAME_STATE.PLAYING;
        init();
        if (!isBgmMeted && bgmMusic && bgmMusic.paused) {
            bgmMusic.play().catch(error => console.warn("Error starting BGM:", error));
        } else if (bgmMusic) {
            bgmMusic.muted = isBgmMeted;
        }
    });

    function initialPageLoadSetup() {
        currentGameState = GAME_STATE.MENU;

        showScreen(startScreen);
        resizeGameArea(); // Call resizeGameArea
        window.addEventListener('resize', resizeGameArea); // Add resize listener

        checkOrientation(); // Call it once on load for orientation
        window.addEventListener('resize', checkOrientation); // And on resize/orientation change for orientation

        update();
        if (bgmMusic) {
            bgmMusic.pause();
            bgmMusic.currentTime = 0; 
            bgmMusic.muted = isBgmMeted;
        }
        // Set initial button texts
        const bgmMuteBtn = document.getElementById('bgm-mute-btn'); 
        if (bgmMuteBtn) bgmMuteBtn.textContent = isBgmMeted ? "Unmute BGM" : "Mute BGM";
        const sfxMuteBtn = document.getElementById('sfx-mute-btn'); 
        if (sfxMuteBtn) sfxMuteBtn.textContent = isSfxMuted ? "Unmute SFX" : "Mute SFX";
    }

    function checkOrientation() {
        const orientationMessage = document.getElementById('orientation-message');
        if (!orientationMessage) return;

        if (window.matchMedia("(orientation: portrait)").matches) {
            orientationMessage.style.display = 'flex';
        } else {
            orientationMessage.style.display = 'none';
        }
    }

    const bgmMuteBtn = document.getElementById('bgm-mute-btn');
    if (bgmMuteBtn) {
        bgmMuteBtn.addEventListener('click', toggleBgm);
    }

    const sfxMuteBtn = document.getElementById('sfx-mute-btn');
    if (sfxMuteBtn) {
        sfxMuteBtn.addEventListener('click', toggleSfx);
    }

    initialPageLoadSetup();


    // --- Audio Management ---
    function playSound(soundElement) {
        if (!isSfxMuted && soundElement) {
            soundElement.currentTime = 0; // Rewind to start
            soundElement.play().catch(error => console.warn("Error playing sound:", error)); // Play and catch potential errors
        }
    }

    // The keydown listener for 'P' is now part of the combined keydown listener above.
});
