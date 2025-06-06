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
    const resumeGameBtn = document.getElementById('resume-game-btn'); // Added for Phase 5
    const nextLevelBtn = document.getElementById('next-level-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Display elements for screens
    const levelClearedTitle = document.getElementById('level-cleared-title');
    const gameOverMainTitle = document.getElementById('game-over-main-title');
    const finalScoreDisplay = document.getElementById('final-score');

    // High Score UI Elements (Phase 5)
    const highScoreStartScreenContainer = document.getElementById('high-scores-start-screen');
    const highScoreGameOverContainer = document.getElementById('high-scores-game-over-screen');
    const initialsInputContainer = document.getElementById('initials-input-container');
    const playerInitialsInput = document.getElementById('player-initials-input');
    const submitInitialsBtn = document.getElementById('submit-initials-btn');

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
    const muteBtn = document.getElementById('mute-btn');

    const GAME_STATE = {
        MENU: 0,
        PLAYING: 1,
        LEVEL_TRANSITION: 2,
        GAME_OVER: 3,
        PAUSED: 4
    };
    let currentGameState = GAME_STATE.MENU;
    let saveIntervalId = null; // For saving game state
    let pauseStartTime = 0; // For tracking when pause began

    const MAX_HIGH_SCORES = 5; // Max number of high scores to store

    let currentLevelIndex = 0;

    const SLOW_BALL_DURATION = 10000;
    const MULTI_BALL_DURATION = 15000;
    const SPEED_BALL_DURATION = 10000;
    const MAX_BALLS = 3;

    const INITIAL_BALL_SPEED_DX = 2;
    const INITIAL_BALL_SPEED_DY = -4;
    const LEVEL_SPEED_INCREASE_FACTOR = 0.20;

    let currentBaseBallSpeed_dx;
    let currentBaseBallSpeed_dy;

    let activePowerUps = {
        slow_ball: { active: false, timerId: null, affectedBalls: [], deactivationTime: 0, remainingDurationBeforePause: 0 },
        multi_ball: { active: false, timerId: null, extraBalls: [], deactivationTime: 0, remainingDurationBeforePause: 0 },
        speed_ball: { active: false, timerId: null, affectedBalls: [], deactivationTime: 0, remainingDurationBeforePause: 0 }
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

    const GAME_WIDTH = 600; const GAME_HEIGHT = 450;
    const ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT;
    const PADDLE_WIDTH = 100; const PADDLE_HEIGHT = 15;
    const PADDLE_Y_OFFSET = 20; const BALL_RADIUS = 8;
    const BRICK_WIDTH = GAME_WIDTH / 10 - 4; // Assuming 10 cols for BRICK_WIDTH calc
    const BRICK_HEIGHT = 20; const BRICK_PADDING = 2;
    const BRICK_OFFSET_TOP = 30; const BRICK_OFFSET_LEFT = 2;

    let score = 0; let lives = 3;
    let currentGameScale = 1;
    let isPaddleDragging = false;
    let isMuted = false;
    let gameRunning = true; // Will be synced with currentGameState
    let bricks = []; let ballLaunched = false;
    const PADDLE_SPEED = 8;

    const paddle = {
        x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: PADDLE_SPEED, moveLeft: false, moveRight: false
    };
    let paddleElement;

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
                    // Update HP class if brick HP has changed
                    // Remove old hp class if it exists
                    for (let i = brick.element.classList.length - 1; i >= 0; i--) {
                        const className = brick.element.classList[i];
                        if (className.startsWith('hp-')) {
                            brick.element.classList.remove(className);
                        }
                    }
                    // Add new hp class
                    if (brick.hp > 0 && brick.hp !== Infinity) {
                        brick.element.classList.add(`hp-${brick.hp}`);
                    }
                }
            } else if (brick && brick.element) { 
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
            } else if (balls.length === 1) {
                currentBall.x = paddle.x + paddle.width / 2; currentBall.y = paddle.y - currentBall.radius - 1;
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
                        else { ballLaunched = false;
                               balls.push(createNewBall(paddle.x + paddle.width/2, paddle.y - BALL_RADIUS - 1, (Math.random() > 0.5 ? 1:-1)*currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, `main_${Date.now()}`));
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

    function handleGameOver(message = "Game Over!") {
        if (saveIntervalId !== null) {
            clearInterval(saveIntervalId);
            saveIntervalId = null;
        }
        playSound(sfxGameOver);
        if (bgmMusic) {
            bgmMusic.pause();
        }
        currentGameState = GAME_STATE.GAME_OVER;
        deactivateAllPowerUps(true);
        gameOverMainTitle.textContent = message;
        finalScoreDisplay.textContent = score; // Ensure final score is displayed

        // High score logic
        if (initialsInputContainer) initialsInputContainer.style.display = 'none'; // Hide by default
        if (highScoreGameOverContainer) highScoreGameOverContainer.style.display = 'block'; // Show by default

        const highScores = getHighScores();
        const lowestHighScore = highScores.length < MAX_HIGH_SCORES ? 0 : highScores[MAX_HIGH_SCORES - 1].score;

        if (score > lowestHighScore) {
            if (initialsInputContainer) initialsInputContainer.style.display = 'flex'; // Or 'block'
            if (highScoreGameOverContainer) highScoreGameOverContainer.style.display = 'none'; // Hide list while entering
            if (playerInitialsInput) playerInitialsInput.focus(); // Focus on input field
        } else {
            displayHighScores('high-scores-game-over-screen', "High Scores");
        }

        showScreen(gameOverScreen); // Ensure game over screen is visible
    }

    // --- High Score Functions ---
    function getHighScores() {
        const scoresJSON = localStorage.getItem('breakout_high_scores');
        try {
            return scoresJSON ? JSON.parse(scoresJSON) : [];
        } catch (e) {
            console.error("Error parsing high scores", e);
            return [];
        }
    }

    function saveHighScores(scoresArray) {
        try {
            localStorage.setItem('breakout_high_scores', JSON.stringify(scoresArray));
        } catch (e) {
            console.error("Error saving high scores", e);
        }
    }

    function addHighScore(name, scoreValue) {
        const scores = getHighScores();
        scores.push({ name, score: scoreValue });
        scores.sort((a, b) => b.score - a.score); // Sort descending by score
        const newScores = scores.slice(0, MAX_HIGH_SCORES);
        saveHighScores(newScores);
    }

    function displayHighScores(containerElementId, title) {
        const container = document.getElementById(containerElementId);
        if (!container) {
            // console.warn(`High score container '${containerElementId}' not found.`);
            return;
        }
        const scores = getHighScores();
        let html = `<h2 class="vt323-font">${title}</h2>`; // Ensure title has the font class
        if (scores.length === 0) {
            html += '<p>No high scores yet!</p>';
        } else {
            html += '<ol>';
            scores.forEach(s => {
                // Ensure list items also inherit or have the font class if needed (CSS should handle)
                html += `<li>${s.name}: ${s.score}</li>`;
            });
            html += '</ol>';
        }
        container.innerHTML = html;
        container.style.display = 'block'; // Make sure it's visible
    }
    // --- End High Score Functions ---


    function saveGameState() {
        try {
            const simplifiedBalls = balls.map(ball => ({
                x: ball.x,
                y: ball.y,
                dx: ball.dx,
                dy: ball.dy,
                id: ball.id
            }));

            const powerUpsToSave = {};
            for (const type in activePowerUps) {
                const pu = activePowerUps[type];
                let remainingDuration = 0;
                if (pu.active && pu.deactivationTime) {
                    remainingDuration = Math.max(0, pu.deactivationTime - Date.now());
                }
                powerUpsToSave[type] = {
                    active: pu.active,
                    remainingDuration: remainingDuration,
                    // For multi_ball, save IDs of extra balls
                    extraBalls: type === 'multi_ball' ? pu.extraBalls.map(b => b.id) : undefined,
                    // For slow_ball and speed_ball, save IDs of affected balls
                    affectedBalls: (type === 'slow_ball' || type === 'speed_ball') ? pu.affectedBalls.map(b => b.id) : undefined,
                    remainingDurationBeforePause: pu.remainingDurationBeforePause > 0 ? pu.remainingDurationBeforePause : 0 // Save this if game is saved during pause
                };
            }

            const gameStateData = {
                currentLevelIndex,
                score,
                lives,
                currentBaseBallSpeed_dx,
                currentBaseBallSpeed_dy,
                balls: simplifiedBalls,
                ballLaunched,
                activePowerUps: powerUpsToSave,
                // Add paddle state if necessary, e.g. paddle.x
                paddleX: paddle.x
            };
            localStorage.setItem('breakout_saved_state', JSON.stringify(gameStateData));
            // console.log("Game state saved:", gameStateData);
        } catch (error) {
            console.error("Error saving game state:", error);
        }
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
                        paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS - 1,
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


    // Game State Loading
    function loadGameState() {
        const savedStateJSON = localStorage.getItem('breakout_saved_state');
        if (!savedStateJSON) {
            console.log("No saved game state found.");
            return false;
        }

        try {
            const savedState = JSON.parse(savedStateJSON);

            currentLevelIndex = savedState.currentLevelIndex;
            score = savedState.score;
            lives = savedState.lives;
            currentBaseBallSpeed_dx = savedState.currentBaseBallSpeed_dx;
            currentBaseBallSpeed_dy = savedState.currentBaseBallSpeed_dy;
            paddle.x = savedState.paddleX !== undefined ? savedState.paddleX : GAME_WIDTH / 2 - PADDLE_WIDTH / 2;
            ballLaunched = savedState.ballLaunched;

            // Restore Balls
            balls.forEach(b => { if (b.element) b.element.remove(); });
            balls = [];
            savedState.balls.forEach(sBall => {
                const newBall = createNewBall(sBall.x, sBall.y, sBall.dx, sBall.dy, sBall.id);
                // newBall.id = sBall.id; // createNewBall already sets id if suffix is sBall.id itself
                balls.push(newBall);
                if (newBall.element && !newBall.element.parentElement) { // Ensure not already added
                    gameArea.appendChild(newBall.element);
                }
            });

            loadLevel(currentLevelIndex); // Load bricks for the current level

            deactivateAllPowerUps(true); // Reset current power-ups before loading saved ones

            if (savedState.activePowerUps) {
                for (const type in savedState.activePowerUps) {
                    const puState = savedState.activePowerUps[type];
                    if (puState.active && puState.remainingDuration > 0) {
                        let options = { remainingDuration: puState.remainingDuration };
                        if (type === 'multi_ball') {
                            options.resumingBallIds = puState.extraBalls; // These are IDs
                            options.isResumingMultiBall = true;
                            activatePowerUp(type, null, options);
                        } else if (type === 'slow_ball' || type === 'speed_ball') {
                            options.resumingBallIds = puState.affectedBalls; // These are IDs
                            activatePowerUp(type, null, options);
                        }
                    }
                }
            }

            scoreDisplay.textContent = score;
            livesDisplay.textContent = lives;
            drawPaddle();
            drawBalls(); // Ensure balls are drawn after creation and potential power-up effects
            updatePowerUpDisplay();

            console.log("Game state loaded successfully.");
            return true;

        } catch (error) {
            console.error("Error loading game state:", error);
            localStorage.removeItem('breakout_saved_state'); // Clear corrupted data
            return false;
        }
    }


    // Combined event listener for keydown
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            // Allow pausing from PLAYING or PAUSED state.
            if (currentGameState === GAME_STATE.PLAYING || currentGameState === GAME_STATE.PAUSED) {
                handlePauseToggle();
            }
        }

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
        const scale = currentGameScale || 1; // Ensure scale is defined, default to 1

        let mouseXInGame = (e.clientX - rect.left) / scale;

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
        const scale = currentGameScale || 1;

        let touchXInGame = (touch.clientX - rect.left) / scale;
        let touchYInGame = (touch.clientY - rect.top) / scale;

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
        const scale = currentGameScale || 1;

        let touchXInGame = (touch.clientX - rect.left) / scale;
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

        // Update currentGameScale calculation for gameArea content scaling
        if (gameArea.offsetWidth > 0 && gameArea.offsetHeight > 0) {
            const scaleX = gameArea.offsetWidth / GAME_WIDTH;
            const scaleY = gameArea.offsetHeight / GAME_HEIGHT;
            currentGameScale = Math.min(scaleX, scaleY);
            gameArea.style.transformOrigin = 'top left';
            gameArea.style.transform = 'scale(' + currentGameScale + ')';
        } else {
            currentGameScale = 1;
            gameArea.style.transform = 'scale(1)';
        }
    }

    function init() {
        score = 0; lives = 3;
        scoreDisplay.textContent = score; livesDisplay.textContent = lives;

        currentLevelIndex = 0;
        currentBaseBallSpeed_dx = INITIAL_BALL_SPEED_DX;
        currentBaseBallSpeed_dy = INITIAL_BALL_SPEED_DY;

        deactivateAllPowerUps(true);
        paddle.x = GAME_WIDTH / 2 - PADDLE_WIDTH / 2;
        balls.forEach(b => { if (b.element) b.element.remove(); }); balls = [];
        const initialBall = createNewBall( paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS - 1,
            currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, "main");
        balls.push(initialBall); gameArea.appendChild(initialBall.element);
        ballLaunched = false;
        loadLevel(currentLevelIndex);
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
        localStorage.removeItem('breakout_saved_state');
        if (resumeGameBtn) resumeGameBtn.style.display = 'none';

        showGameElements();
        currentGameState = GAME_STATE.PLAYING;
        init(); // init should reset game state variables
        if (saveIntervalId !== null) clearInterval(saveIntervalId);
        saveIntervalId = setInterval(saveGameState, 1000);
        if (!isMuted && bgmMusic && bgmMusic.paused) {
            bgmMusic.play().catch(error => console.warn("Error starting BGM:", error));
        } else if (bgmMusic) {
            bgmMusic.muted = isMuted; // Ensure mute state is respected
        }
    });

    if (resumeGameBtn) {
        resumeGameBtn.addEventListener('click', () => {
            if (loadGameState()) {
                showGameElements();
                currentGameState = GAME_STATE.PLAYING;
                // BGM
                if (!isMuted && bgmMusic && bgmMusic.paused) {
                    bgmMusic.play().catch(error => console.warn("Error resuming BGM:", error));
                } else if (bgmMusic) {
                    bgmMusic.muted = isMuted;
                }
                // Save interval
                if (saveIntervalId !== null) clearInterval(saveIntervalId);
                saveIntervalId = setInterval(saveGameState, 1000);

                // Hide start screen or just the button
                if(startScreen) startScreen.style.display = 'none';
                // resumeGameBtn.style.display = 'none'; // Or just hide the button
            } else {
                // Failed to load, perhaps clear broken save and encourage new game
                localStorage.removeItem('breakout_saved_state');
                if (resumeGameBtn) resumeGameBtn.style.display = 'none';
                alert("Could not resume game. Starting a new game.");
                startNewGameBtn.click(); // Simulate click on new game
            }
        });
    }

    nextLevelBtn.addEventListener('click', () => {
        currentLevelIndex++;
        showGameElements();
        currentBaseBallSpeed_dx = INITIAL_BALL_SPEED_DX+(currentLevelIndex*LEVEL_SPEED_INCREASE_FACTOR*INITIAL_BALL_SPEED_DX);
        currentBaseBallSpeed_dy = INITIAL_BALL_SPEED_DY-(currentLevelIndex*LEVEL_SPEED_INCREASE_FACTOR*Math.abs(INITIAL_BALL_SPEED_DY));
        // console.log(`Starting Level ${currentLevelIndex+1} base speed: dx=${currentBaseBallSpeed_dx.toFixed(2)}, dy=${currentBaseBallSpeed_dy.toFixed(2)}`);
        ballLaunched = false; deactivateAllPowerUps(true);
        balls.forEach(b => b.element.remove()); balls = [];
        const newPrimaryBall = createNewBall(paddle.x+paddle.width/2, paddle.y-BALL_RADIUS-1, (Math.random()>0.5?1:-1)*currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, `main_${Date.now()}`);
        balls.push(newPrimaryBall); if(newPrimaryBall.element && newPrimaryBall.element.parentElement !== gameArea) gameArea.appendChild(newPrimaryBall.element);
        loadLevel(currentLevelIndex);
        currentGameState = GAME_STATE.PLAYING;
        if (saveIntervalId !== null) clearInterval(saveIntervalId);
        saveIntervalId = setInterval(saveGameState, 1000);
        if (!isMuted && bgmMusic && bgmMusic.paused) { // If it was somehow paused
            bgmMusic.play().catch(error => console.warn("Error continuing BGM:", error));
        } else if (bgmMusic) {
             bgmMusic.muted = isMuted;
        }
    });

    playAgainBtn.addEventListener('click', () => {
        // For 'Play Again', treat as a new game regarding save state.
        // If there was an old save interval (e.g., from a game over that wasn't fully cleaned up), clear it.
        if (saveIntervalId !== null) clearInterval(saveIntervalId);
        localStorage.removeItem('breakout_saved_state'); // Clear any previous saved state on "Play Again"

        showGameElements();
        currentGameState = GAME_STATE.PLAYING;
        init();
        saveIntervalId = setInterval(saveGameState, 1000); // Start new save interval
        if (!isMuted && bgmMusic && bgmMusic.paused) {
            bgmMusic.play().catch(error => console.warn("Error starting BGM:", error));
        } else if (bgmMusic) {
            bgmMusic.muted = isMuted;
        }
    });

    function initialPageLoadSetup() {
        currentGameState = GAME_STATE.MENU;
        if (saveIntervalId !== null) {
            clearInterval(saveIntervalId);
            saveIntervalId = null;
        }

        const savedGameData = localStorage.getItem('breakout_saved_state');
        if (savedGameData && resumeGameBtn) {
            try {
                JSON.parse(savedGameData);
                resumeGameBtn.style.display = 'inline-block';
            } catch (e) {
                console.warn("Invalid saved data found, removing.");
                localStorage.removeItem('breakout_saved_state');
                if (resumeGameBtn) resumeGameBtn.style.display = 'none';
            }
        } else if (resumeGameBtn) {
            resumeGameBtn.style.display = 'none';
        }

        displayHighScores('high-scores-start-screen', "Top Scores");

        showScreen(startScreen);
        resizeGameArea(); // Call resizeGameArea
        window.addEventListener('resize', resizeGameArea); // Add resize listener

        checkOrientation(); // Call it once on load for orientation
        window.addEventListener('resize', checkOrientation); // And on resize/orientation change for orientation

        update();
        if (bgmMusic) {
            bgmMusic.pause();
            // bgmMusic.currentTime = 0; // Optional: rewind BGM
        }
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

    initialPageLoadSetup();

    // Event listener for submit initials button (Phase 5)
    if (submitInitialsBtn && playerInitialsInput && initialsInputContainer && highScoreGameOverContainer) {
        submitInitialsBtn.addEventListener('click', () => {
            let initials = playerInitialsInput.value.trim().toUpperCase().slice(0, 3);
            if (initials.length === 0) {
                initials = "AAA"; // Default if empty
            }
            // 'score' is globally available here from the game instance when game over happened
            addHighScore(initials, score);

            initialsInputContainer.style.display = 'none';
            playerInitialsInput.value = ''; // Clear the input field

            highScoreGameOverContainer.style.display = 'block';
            displayHighScores('high-scores-game-over-screen', "High Scores");
        });
    }


    // --- Audio Management ---
    function playSound(soundElement) {
        if (!isMuted && soundElement) {
            soundElement.currentTime = 0; // Rewind to start
            soundElement.play().catch(error => console.warn("Error playing sound:", error)); // Play and catch potential errors
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (muteBtn) { // Check if muteBtn exists
            muteBtn.textContent = isMuted ? "Unmute" : "Mute";
            muteBtn.style.backgroundColor = isMuted ? '#0a0' : '#f00'; // Green for Unmute, Red for Mute
        }

        if (bgmMusic) { // Handle BGM specifically
            bgmMusic.muted = isMuted; // This is the primary way to mute HTML5 audio element
            if (!isMuted && currentGameState === GAME_STATE.PLAYING && bgmMusic.paused) { 
                bgmMusic.play().catch(error => console.warn("Error playing BGM on unmute:", error));
            } else if (isMuted && !bgmMusic.paused && currentGameState !== GAME_STATE.PAUSED) { 
                bgmMusic.pause();
            }
        }
    }

    if (muteBtn) { 
        muteBtn.addEventListener('click', toggleMute);
    }

    // --- Pause Functionality ---
    function handlePauseToggle() {
        if (currentGameState === GAME_STATE.PLAYING) {
            currentGameState = GAME_STATE.PAUSED;
            if (pauseBtn) pauseBtn.textContent = "Resume";
            if (bgmMusic && !bgmMusic.paused) bgmMusic.pause(); 
            pauseStartTime = Date.now();
            if (pausedMessageElement) pausedMessageElement.style.display = 'block';

            // Pause active power-up timers
            Object.keys(activePowerUps).forEach(type => {
                const powerUp = activePowerUps[type];
                if (powerUp.active && powerUp.timerId) { // If power-up is active and has a timer
                    clearTimeout(powerUp.timerId); // Clear the existing timer
                    // Calculate and store remaining duration
                    powerUp.remainingDurationBeforePause = powerUp.deactivationTime - Date.now();
                }
            });

            // Pause the game state saving interval
            if (saveIntervalId !== null) { 
                clearInterval(saveIntervalId);
                saveIntervalId = null;
            }

        } else if (currentGameState === GAME_STATE.PAUSED) {
            currentGameState = GAME_STATE.PLAYING;
            if (pauseBtn) pauseBtn.textContent = "Pause";
            if (!isMuted && bgmMusic && bgmMusic.paused) { 
                 bgmMusic.play().catch(error => console.warn("Error resuming BGM:", error));
            }
            if (pausedMessageElement) pausedMessageElement.style.display = 'none';

            // const pausedDuration = Date.now() - pauseStartTime; // Duration game was paused

            // Resume active power-up timers
            Object.keys(activePowerUps).forEach(type => {
                const powerUp = activePowerUps[type];
                if (powerUp.active && powerUp.remainingDurationBeforePause > 0) {
                    // Update deactivation time based on when game is resumed
                    powerUp.deactivationTime = Date.now() + powerUp.remainingDurationBeforePause;
                    // Restart the timer with the remaining duration
                    powerUp.timerId = setTimeout(() => deactivatePowerUp(type), powerUp.remainingDurationBeforePause);
                    powerUp.remainingDurationBeforePause = 0; // Reset stored remaining duration
                } else if (powerUp.active && powerUp.timerId && powerUp.remainingDurationBeforePause <= 0) {
                    // If timer should have expired during pause, deactivate it now
                    deactivatePowerUp(type);
                }
            });

            // Resume the game state saving interval
             if (saveIntervalId === null && currentGameState === GAME_STATE.PLAYING) { 
                 saveIntervalId = setInterval(saveGameState, 1000);
             }
        }
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', handlePauseToggle);
    }
    // The keydown listener for 'P' is now part of the combined keydown listener above.
});
