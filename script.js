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

    const GAME_STATE = {
        MENU: 0,
        PLAYING: 1,
        LEVEL_TRANSITION: 2,
        GAME_OVER: 3,
        PAUSED: 4
    };
    let currentGameState = GAME_STATE.MENU;

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
        slow_ball: { active: false, timerId: null, affectedBalls: [] },
        multi_ball: { active: false, timerId: null, extraBalls: [] },
        speed_ball: { active: false, timerId: null, affectedBalls: [] }
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
    const PADDLE_WIDTH = 100; const PADDLE_HEIGHT = 15;
    const PADDLE_Y_OFFSET = 20; const BALL_RADIUS = 8;
    const BRICK_WIDTH = GAME_WIDTH / 10 - 4; // Assuming 10 cols for BRICK_WIDTH calc
    const BRICK_HEIGHT = 20; const BRICK_PADDING = 2;
    const BRICK_OFFSET_TOP = 30; const BRICK_OFFSET_LEFT = 2;

    let score = 0; let lives = 3;
    let gameRunning = true; // Will be synced with currentGameState
    let bricks = []; let ballLaunched = false;
    const PADDLE_SPEED = 8;

    function setupGameContainer() {
        const container = document.getElementById('game-container');
        container.style.width = `${GAME_WIDTH}px`;
        gameArea.style.width = `${GAME_WIDTH}px`;
        gameArea.style.height = `${GAME_HEIGHT}px`;
    }

    const paddle = {
        x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2, y: GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_WIDTH, height: PADDLE_HEIGHT, speed: PADDLE_SPEED, moveLeft: false, moveRight: false
    };
    let paddleElement;

    function createPaddleElement() { /* ... same as before ... */
        const svgNS = "http://www.w3.org/2000/svg"; const el = document.createElementNS(svgNS, "svg");
        el.setAttribute('width', `${paddle.width}`); el.setAttribute('height', `${paddle.height}`);
        el.style.position = 'absolute'; el.style.left = `${paddle.x}px`; el.style.top = `${paddle.y}px`;
        el.id = 'paddle'; const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute('width', `${paddle.width}`); rect.setAttribute('height', `${paddle.height}`);
        rect.setAttribute('fill', '#0f0'); rect.setAttribute('shape-rendering', 'crispEdges');
        el.appendChild(rect); return el;
    }
    function drawPaddle() { /* ... same as before ... */
        if (!paddleElement) { paddleElement = createPaddleElement(); gameArea.appendChild(paddleElement); }
        paddleElement.style.left = `${paddle.x}px`;
    }

    function createNewBall(x, y, dx, dy, idSuffix = '') {
        const newBall = { x, y, radius: BALL_RADIUS, dx, dy, element: null, id: `ball${idSuffix}` };
        newBall.element = createBallElementDOM(newBall); return newBall;
    }
    let balls = [];
    function createBallElementDOM(ballObj) { /* ... same as before ... */
        const svgNS = "http://www.w3.org/2000/svg"; const el = document.createElementNS(svgNS, "svg");
        const sideLength = ballObj.radius * 2; el.setAttribute('width', `${sideLength}`);
        el.setAttribute('height', `${sideLength}`); el.style.position = 'absolute'; el.id = ballObj.id;
        const rect = document.createElementNS(svgNS, "rect"); rect.setAttribute('width', `${sideLength}`);
        rect.setAttribute('height', `${sideLength}`); rect.setAttribute('fill', '#f00');
        rect.setAttribute('shape-rendering', 'crispEdges'); el.appendChild(rect); return el;
    }
    function drawBalls() { /* ... same as before ... */
        balls.forEach(ballObj => {
            if (!ballObj.element) { ballObj.element = createBallElementDOM(ballObj); gameArea.appendChild(ballObj.element); }
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
    function drawBricks() { /* ... same as before ... */
        bricks.forEach((row, r) => { row.forEach((brick, c) => {
            if (brick && brick.status === 1) {
                if (!brick.element) {
                    const svgNS = "http://www.w3.org/2000/svg"; const el = document.createElementNS(svgNS, "svg");
                    el.setAttribute('width', `${brick.width}`); el.setAttribute('height', `${brick.height}`);
                    el.style.position = 'absolute'; el.style.left = `${brick.x}px`; el.style.top = `${brick.y}px`;
                    el.classList.add('brick'); const rect = document.createElementNS(svgNS, "rect");
                    rect.setAttribute('width', '100%'); rect.setAttribute('height', '100%');
                    rect.setAttribute('stroke', '#333'); rect.setAttribute('stroke-width', '1');
                    rect.setAttribute('shape-rendering', 'crispEdges'); let fillColor;
                    switch (brick.type) {
                        case 'single': fillColor = '#00BFFF'; break;
                        case 'double': fillColor = brick.hp === 2 ? '#FFFF00' : '#FFA500'; break;
                        case 'triple': fillColor = brick.hp === 3 ? '#00FF00' : (brick.hp === 2 ? '#9ACD32' : '#BDB76B'); break;
                        case 'unbreakable': fillColor = '#808080'; break;
                        default: fillColor = (brick.type && brick.type.startsWith('powerup_')) ? '#FF00FF' : '#00f'; break;
                    }
                    rect.setAttribute('fill', fillColor); el.appendChild(rect);
                    brick.element = el; gameArea.appendChild(el);
                } else {
                    const rect = brick.element.querySelector('rect'); if (rect) { let newFillColor = rect.getAttribute('fill');
                        switch (brick.type) {
                            case 'double': newFillColor = brick.hp === 2 ? '#FFFF00' : '#FFA500'; break;
                            case 'triple': newFillColor = brick.hp === 3 ? '#00FF00' : (brick.hp === 2 ? '#9ACD32' : '#BDB76B'); break;
                        } rect.setAttribute('fill', newFillColor);
                    }
                }
            } else if (brick && brick.element) { brick.element.remove(); brick.element = null; }
        }); });
    }

    function update() {
        gameRunning = (currentGameState === GAME_STATE.PLAYING);

        if (!gameRunning) {
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
                if (currentBall.y - currentBall.radius < 0) { currentBall.y = currentBall.radius; currentBall.dy *= -1; }
                if (currentBall.x - currentBall.radius < 0) { currentBall.x = currentBall.radius; currentBall.dx *= -1; }
                else if (currentBall.x + currentBall.radius > GAME_WIDTH) { currentBall.x = GAME_WIDTH - currentBall.radius; currentBall.dx *= -1; }
                if (currentBall.y + currentBall.radius > GAME_HEIGHT) {
                    currentBall.element.remove(); balls.splice(i, 1);
                    if (balls.length === 0) {
                        lives--; livesDisplay.textContent = lives; deactivateAllPowerUps(true);
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
                                    if (brick.hp <= 0) { brick.status = 0; score += 10; scoreDisplay.textContent = score;
                                        if (brick.powerupType) activatePowerUp(brick.powerupType, currentBall);
                                    } else { console.log(`Brick hit, HP: ${brick.hp}`); }
                                } else { console.log("Unbreakable brick hit!"); }
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
                showScreen(levelClearedScreen);
            } else {
                handleGameOver("You Win!");
            }
        }
    }

    function handleGameOver(message = "Game Over!") {
        currentGameState = GAME_STATE.GAME_OVER;
        deactivateAllPowerUps(true);
        gameOverMainTitle.textContent = message;
        finalScoreDisplay.textContent = score;
        showScreen(gameOverScreen);
    }

    function updatePowerUpDisplay() { /* ... same as before ... */
        if (!powerUpStatusDisplay) return; let statusText = [];
        if (activePowerUps.slow_ball.active) statusText.push("Slow Ball");
        if (activePowerUps.multi_ball.active) statusText.push("Multi-Ball");
        if (activePowerUps.speed_ball.active) statusText.push("Speed Ball");
        powerUpStatusDisplay.textContent = statusText.length > 0 ? statusText.join(' | ') + " Active!" : "";
    }
    function activatePowerUp(type, currentHitBall) { /* ... same as before ... */
        console.log(`Power-up ${type} activated!`);
        switch (type) {
            case 'life': lives++; livesDisplay.textContent = lives; break;
            case 'slow_ball':
                if (activePowerUps.slow_ball.timerId) clearTimeout(activePowerUps.slow_ball.timerId);
                if (activePowerUps.speed_ball.affectedBalls.includes(currentHitBall)) deactivatePowerUp('speed_ball', currentHitBall, true);
                activePowerUps.slow_ball.affectedBalls.push(currentHitBall); currentHitBall.dx *= 0.5; currentHitBall.dy *= 0.5;
                if (Math.abs(currentHitBall.dx) < 1 && currentHitBall.dx !== 0) currentHitBall.dx = Math.sign(currentHitBall.dx) * 1;
                if (Math.abs(currentHitBall.dy) < 1 && currentHitBall.dy !== 0) currentHitBall.dy = Math.sign(currentHitBall.dy) * 1;
                activePowerUps.slow_ball.active = true;
                activePowerUps.slow_ball.timerId = setTimeout(() => deactivatePowerUp('slow_ball', currentHitBall), SLOW_BALL_DURATION);
                break;
            case 'multi_ball':
                if (activePowerUps.multi_ball.timerId) clearTimeout(activePowerUps.multi_ball.timerId);
                activePowerUps.multi_ball.active = true; const ballsToAdd = MAX_BALLS - balls.length;
                for (let i = 0; i < ballsToAdd; i++) { if (balls.length >= MAX_BALLS) break;
                    const newBall = createNewBall(paddle.x + paddle.width / 2, paddle.y - BALL_RADIUS - 20,
                        currentBaseBallSpeed_dx * (Math.random()>0.5?1:-1) * (0.8+Math.random()*0.4),
                        currentBaseBallSpeed_dy * (0.8+Math.random()*0.4), `extra${balls.length}_${Date.now()}`);
                    balls.push(newBall); gameArea.appendChild(newBall.element); activePowerUps.multi_ball.extraBalls.push(newBall);
                }
                activePowerUps.multi_ball.timerId = setTimeout(() => deactivatePowerUp('multi_ball'), MULTI_BALL_DURATION);
                break;
            case 'speed_ball':
                if (activePowerUps.speed_ball.timerId) clearTimeout(activePowerUps.speed_ball.timerId);
                if (activePowerUps.slow_ball.affectedBalls.includes(currentHitBall)) deactivatePowerUp('slow_ball', currentHitBall, true);
                activePowerUps.speed_ball.affectedBalls.push(currentHitBall); currentHitBall.dx *= 1.5; currentHitBall.dy *= 1.5;
                activePowerUps.speed_ball.active = true;
                activePowerUps.speed_ball.timerId = setTimeout(() => deactivatePowerUp('speed_ball', currentHitBall), SPEED_BALL_DURATION);
                break;
        } updatePowerUpDisplay();
    }
    function deactivatePowerUp(type, ballRef, isResetCtx = false) { /* ... same as before, but ensure ballRef is used if not null for slow/speed ... */
        console.log(`Power-up ${type} deactivated.`);
        switch (type) {
            case 'slow_ball':
                if (activePowerUps.slow_ball.timerId) { clearTimeout(activePowerUps.slow_ball.timerId); activePowerUps.slow_ball.timerId = null; }
                activePowerUps.slow_ball.affectedBalls.forEach(b => { if (!isResetCtx && b) { b.dx = Math.sign(b.dx) * currentBaseBallSpeed_dx; b.dy = Math.sign(b.dy) * Math.abs(currentBaseBallSpeed_dy); }});
                activePowerUps.slow_ball.active = false; activePowerUps.slow_ball.affectedBalls = []; break;
            case 'multi_ball':
                if (activePowerUps.multi_ball.timerId) { clearTimeout(activePowerUps.multi_ball.timerId); activePowerUps.multi_ball.timerId = null; }
                activePowerUps.multi_ball.extraBalls.forEach(exBall => { const i = balls.indexOf(exBall); if (i > -1) { balls.splice(i, 1); if (exBall.element) exBall.element.remove(); }});
                if (balls.length === 0 && !isResetCtx && gameRunning) { /* ... respawn logic ... */
                    balls.push(createNewBall(paddle.x + paddle.width/2, paddle.y - BALL_RADIUS - 1, INITIAL_BALL_SPEED_DX, INITIAL_BALL_SPEED_DY, `main_${Date.now()}`));
                    gameArea.appendChild(balls[0].element);
                }
                activePowerUps.multi_ball.active = false; activePowerUps.multi_ball.extraBalls = []; break;
            case 'speed_ball':
                if (activePowerUps.speed_ball.timerId) { clearTimeout(activePowerUps.speed_ball.timerId); activePowerUps.speed_ball.timerId = null; }
                activePowerUps.speed_ball.affectedBalls.forEach(b => { if (!isResetCtx && b) { b.dx = Math.sign(b.dx) * currentBaseBallSpeed_dx; b.dy = Math.sign(b.dy) * Math.abs(currentBaseBallSpeed_dy); }});
                activePowerUps.speed_ball.active = false; activePowerUps.speed_ball.affectedBalls = []; break;
        } updatePowerUpDisplay();
    }
    function deactivateAllPowerUps(isResetCtx = true) { /* ... same as before ... */
        if(activePowerUps.slow_ball.active) deactivatePowerUp('slow_ball', null, isResetCtx);
        if(activePowerUps.multi_ball.active) deactivatePowerUp('multi_ball', null, isResetCtx);
        if(activePowerUps.speed_ball.active) deactivatePowerUp('speed_ball', null, isResetCtx);
    }

    document.addEventListener('keydown', (e) => { /* ... guarded ... */
        if (currentGameState !== GAME_STATE.PLAYING) return;
        if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') paddle.moveLeft=true;
        else if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') paddle.moveRight=true;
        else if ((e.key===' '||e.code==='Space') && !ballLaunched && balls.length > 0) ballLaunched=true;
    });
    document.addEventListener('keyup', (e) => { /* ... unguarded for stopping movement ... */
        if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') paddle.moveLeft=false;
        else if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') paddle.moveRight=false;
    });
    gameArea.addEventListener('mousemove', (e) => { /* ... guarded ... */
        if (currentGameState !== GAME_STATE.PLAYING) return;
        const rect = gameArea.getBoundingClientRect(); let newPaddleX = e.clientX - rect.left - paddle.width/2;
        if (newPaddleX < 0) newPaddleX = 0; if (newPaddleX + paddle.width > GAME_WIDTH) newPaddleX = GAME_WIDTH - paddle.width;
        paddle.x = newPaddleX; if (!ballLaunched && balls.length > 0 && balls[0]) balls[0].x = paddle.x + paddle.width/2;
    });
    gameArea.addEventListener('click', () => { /* ... guarded ... */
        if (currentGameState !== GAME_STATE.PLAYING) return;
        if (!ballLaunched && balls.length > 0) ballLaunched = true;
    });

    function init() {
        setupGameContainer();
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
        if (startScreen) startScreen.style.display = 'none';
        if (levelClearedScreen) levelClearedScreen.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        if (scoreBoard) scoreBoard.style.display = 'none';
        if (powerUpStatusDisplay) powerUpStatusDisplay.style.display = 'none';
        if (gameArea) gameArea.style.display = 'none';
        if (screenToShow) screenToShow.style.display = 'flex';
    }

    function showGameElements() {
        showScreen(null); // Hide all overlay screens
        if (scoreBoard) scoreBoard.style.display = 'flex';
        if (powerUpStatusDisplay) powerUpStatusDisplay.style.display = 'block';
        if (gameArea) gameArea.style.display = 'block';
    }

    startNewGameBtn.addEventListener('click', () => {
        showGameElements();
        currentGameState = GAME_STATE.PLAYING;
        init();
    });

    nextLevelBtn.addEventListener('click', () => {
        currentLevelIndex++;
        showGameElements();
        currentBaseBallSpeed_dx = INITIAL_BALL_SPEED_DX+(currentLevelIndex*LEVEL_SPEED_INCREASE_FACTOR*INITIAL_BALL_SPEED_DX);
        currentBaseBallSpeed_dy = INITIAL_BALL_SPEED_DY-(currentLevelIndex*LEVEL_SPEED_INCREASE_FACTOR*Math.abs(INITIAL_BALL_SPEED_DY));
        console.log(`Starting Level ${currentLevelIndex+1} base speed: dx=${currentBaseBallSpeed_dx.toFixed(2)}, dy=${currentBaseBallSpeed_dy.toFixed(2)}`);
        ballLaunched = false; deactivateAllPowerUps(true);
        balls.forEach(b => b.element.remove()); balls = [];
        const newPrimaryBall = createNewBall(paddle.x+paddle.width/2, paddle.y-BALL_RADIUS-1, (Math.random()>0.5?1:-1)*currentBaseBallSpeed_dx, currentBaseBallSpeed_dy, `main_${Date.now()}`);
        balls.push(newPrimaryBall); if(newPrimaryBall.element && newPrimaryBall.element.parentElement !== gameArea) gameArea.appendChild(newPrimaryBall.element);
        loadLevel(currentLevelIndex);
        currentGameState = GAME_STATE.PLAYING;
    });

    playAgainBtn.addEventListener('click', () => {
        showGameElements();
        currentGameState = GAME_STATE.PLAYING;
        init();
    });

    function initialPageLoadSetup() {
        currentGameState = GAME_STATE.MENU;
        showScreen(startScreen);
        update();
    }

    initialPageLoadSetup();
});
