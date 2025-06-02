document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const gameOverMessage = document.getElementById('game-over-message');

    // Game constants and settings
    const GAME_WIDTH = 600; // Intended width for a 4:3 aspect ratio
    const GAME_HEIGHT = 450; // Intended height
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 15;
    const PADDLE_Y_OFFSET = 20; // Distance from bottom
    const BALL_RADIUS = 8;
    const BRICK_ROWS = 5;
    const BRICK_COLS = 10;
    const BRICK_WIDTH = GAME_WIDTH / BRICK_COLS - 4; // -4 for some padding/gap
    const BRICK_HEIGHT = 20;
    const BRICK_PADDING = 2; // Small gap between bricks
    const BRICK_OFFSET_TOP = 30;
    const BRICK_OFFSET_LEFT = 2; // Adjusted for container padding

    let score = 0;
    let lives = 3;
    let gameRunning = true;
    let bricks = [];
    let ballLaunched = false;
    const PADDLE_SPEED = 8; // Paddle movement speed for keyboard

    // --- Aspect Ratio and Sizing ---
    function setupGameContainer() {
        const container = document.getElementById('game-container');
        container.style.width = `${GAME_WIDTH}px`;
        gameArea.style.width = `${GAME_WIDTH}px`;
        gameArea.style.height = `${GAME_HEIGHT}px`;
    }

    // --- Paddle ---
    const paddle = {
        x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
        y: GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        dx: 0, // For movement, though direct mouse/key setting might be used
        speed: PADDLE_SPEED,
        moveLeft: false,
        moveRight: false
    };
    let paddleElement;

    function createPaddleElement() {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.width = `${paddle.width}px`;
        el.style.height = `${paddle.height}px`;
        el.style.left = `${paddle.x}px`;
        el.style.top = `${paddle.y}px`;
        el.style.backgroundColor = '#0f0'; // Green
        // Replace with SVG later if needed for pixelated look
        // For now, CSS class .paddle could also apply if preferred
        el.id = 'paddle'; // Or use a class
        return el;
    }

    function drawPaddle() {
        if (!paddleElement) {
            paddleElement = createPaddleElement();
            gameArea.appendChild(paddleElement);
        }
        paddleElement.style.left = `${paddle.x}px`;
    }

    // --- Ball ---
    const ball = {
        x: GAME_WIDTH / 2,
        y: paddle.y - BALL_RADIUS -1, // Start on paddle
        radius: BALL_RADIUS,
        dx: 2, // Initial speed after launch, can be randomized slightly
        dy: -4  // Initial upward speed after launch
    };
    let ballElement;

    function createBallElement() {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.width = `${ball.radius * 2}px`;
        el.style.height = `${ball.radius * 2}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#f00'; // Red
        // Replace with SVG later for pixelated look
        el.id = 'ball'; // Or use a class
        return el;
    }

    function drawBall() {
        if (!ballElement) {
            ballElement = createBallElement();
            gameArea.appendChild(ballElement);
        }
        ballElement.style.left = `${ball.x - ball.radius}px`;
        ballElement.style.top = `${ball.y - ball.radius}px`;
    }

    // --- Bricks ---
    function initializeBricks() {
        bricks = []; // Clear existing bricks
        // Remove existing brick elements from DOM
        const existingBrickElements = gameArea.querySelectorAll('.brick');
        existingBrickElements.forEach(el => el.remove());

        for (let r = 0; r < BRICK_ROWS; r++) {
            bricks[r] = [];
            for (let c = 0; c < BRICK_COLS; c++) {
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                bricks[r][c] = {
                    x: brickX,
                    y: brickY,
                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    status: 1 // 1 for active, 0 for broken
                };
            }
        }
    }

    function drawBricks() {
        bricks.forEach((row, r) => {
            row.forEach((brick, c) => {
                if (brick.status === 1) {
                    if (!brick.element) { // Create element if it doesn't exist
                        const el = document.createElement('div');
                        el.style.position = 'absolute';
                        el.style.width = `${brick.width}px`;
                        el.style.height = `${brick.height}px`;
                        el.style.left = `${brick.x}px`;
                        el.style.top = `${brick.y}px`;
                        el.style.backgroundColor = '#00f'; // Blue
                        el.classList.add('brick'); // For potential CSS styling / query
                        // Store a reference to the DOM element on the brick object
                        brick.element = el;
                        gameArea.appendChild(el);
                    }
                } else if (brick.element) { // If status is 0 and element exists, remove it
                    brick.element.remove();
                    brick.element = null; // Clear the reference
                }
            });
        });
    }

    // --- Game Loop ---
    function update() {
        if (!gameRunning) {
            return; // Stop further execution if game is not running
        }

        // Paddle Keyboard Movement
        if (paddle.moveLeft) {
            paddle.x -= paddle.speed;
            if (paddle.x < 0) paddle.x = 0;
            if (!ballLaunched) ball.x = paddle.x + paddle.width / 2; // Ball follows paddle
        }
        if (paddle.moveRight) {
            paddle.x += paddle.speed;
            if (paddle.x + paddle.width > GAME_WIDTH) paddle.x = GAME_WIDTH - paddle.width;
            if (!ballLaunched) ball.x = paddle.x + paddle.width / 2; // Ball follows paddle
        }

        // Ball movement
        if (ballLaunched) {
            ball.x += ball.dx;
            ball.y += ball.dy;
        } else {
            // Keep ball on paddle before launch (y-position handled, x by mouse/keyboard)
            ball.y = paddle.y - BALL_RADIUS - 1;
        }

        // Ball collision with walls
        if (ballLaunched) {
            // Top wall collision
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius; // Clamp to prevent sticking
                ball.dy *= -1;
            }

            // Side walls collision
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius; // Clamp
                ball.dx *= -1;
            } else if (ball.x + ball.radius > GAME_WIDTH) {
                ball.x = GAME_WIDTH - ball.radius; // Clamp
                ball.dx *= -1;
            }

            // Bottom "wall" - ball goes out of bounds
            if (ball.y + ball.radius > GAME_HEIGHT) {
                lives--;
                livesDisplay.textContent = lives;

                if (lives <= 0) {
                    handleGameOver(); // Call to handle game over state
                } else {
                    // Reset ball for the next life
                    ballLaunched = false;
                    ball.x = paddle.x + paddle.width / 2;
                    ball.y = paddle.y - BALL_RADIUS - 1;
                    // Reset ball speed to a default launch state
                    ball.dx = 2;
                    ball.dy = -4;
                }
            }
        }

        // Ball-Paddle Collision
        if (ballLaunched && ball.dy > 0) { // Only check if ball is moving downwards
            if (
                ball.x + ball.radius > paddle.x &&
                ball.x - ball.radius < paddle.x + paddle.width &&
                ball.y + ball.radius > paddle.y &&
                ball.y - ball.radius < paddle.y + paddle.height // Ensure it's not already past
            ) {
                ball.y = paddle.y - ball.radius; // Place ball on top of paddle
                ball.dy *= -1;

                // Optional: Vary ball.dx based on hit location on paddle
                // let collidePoint = ball.x - (paddle.x + paddle.width / 2);
                // ball.dx = collidePoint * 0.1; // Adjust multiplier for desired effect
            }
        }

        // Ball-Brick Collision
        if (ballLaunched) {
            for (let r = 0; r < BRICK_ROWS; r++) {
                for (let c = 0; c < BRICK_COLS; c++) {
                    const brick = bricks[r][c];
                    if (brick.status === 1) {
                        if (
                            ball.x + ball.radius > brick.x && // ball right edge vs brick left edge
                            ball.x - ball.radius < brick.x + brick.width && // ball left edge vs brick right edge
                            ball.y + ball.radius > brick.y && // ball bottom edge vs brick top edge
                            ball.y - ball.radius < brick.y + brick.height // ball top edge vs brick bottom edge
                        ) {
                            ball.dy *= -1; // Reverse ball's vertical direction
                            brick.status = 0; // Mark brick as broken
                            score += 10; // Increment score
                            scoreDisplay.textContent = score; // Update score display

                            // Optional: Add a small offset to ball y to prevent immediate re-collision
                            // if (ball.dy < 0) ball.y += 1; else ball.y -=1;

                            // A single brick hit per frame is usually enough.
                            // Could break loops here if performance becomes an issue with many bricks.
                        }
                    }
                }
            }
        }

        drawPaddle();
        drawBall();
        drawBricks(); // Will handle hiding/removing broken bricks

        requestAnimationFrame(update);
    }

    function handleGameOver() {
        gameRunning = false;
        gameOverMessage.style.display = 'block'; // Show the game over message
        console.log("Game Over!");
    }

    // --- Event Listeners for Controls (add these within DOMContentLoaded) ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            paddle.moveLeft = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            paddle.moveRight = true;
        } else if ((e.key === ' ' || e.code === 'Space') && !ballLaunched) {
            launchBall();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            paddle.moveLeft = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            paddle.moveRight = false;
        }
    });

    gameArea.addEventListener('mousemove', (e) => {
        const rect = gameArea.getBoundingClientRect();
        let newPaddleX = e.clientX - rect.left - paddle.width / 2;

        // Constrain paddle to game area
        if (newPaddleX < 0) {
            newPaddleX = 0;
        }
        if (newPaddleX + paddle.width > GAME_WIDTH) {
            newPaddleX = GAME_WIDTH - paddle.width;
        }
        paddle.x = newPaddleX;
        // If ball not launched, it follows the paddle
        if (!ballLaunched) {
            ball.x = paddle.x + paddle.width / 2;
        }
    });

    gameArea.addEventListener('click', () => {
        if (!ballLaunched) {
            launchBall();
        }
    });

    function launchBall() {
        if (!ballLaunched) {
            ballLaunched = true;
            // Start with a fixed upward speed and a slight angle or straight up
            // ball.dx is already set, ball.dy is already set
            // Or, if you want to randomize dx slightly on launch:
            // ball.dx = Math.random() > 0.5 ? 2 : -2;
        }
    }

    // --- Initialization ---
    function init() {
        setupGameContainer(); // Sets fixed dimensions

        score = 0;
        lives = 3; // Reset lives to 3
        scoreDisplay.textContent = score;
        livesDisplay.textContent = lives; // Update display

        gameOverMessage.style.display = 'none'; // Hide game over message
        gameRunning = true; // Set game to running state

        // Reset paddle to center
        paddle.x = GAME_WIDTH / 2 - PADDLE_WIDTH / 2;

        // Reset ball position on paddle, unlaunched, with default speeds
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - BALL_RADIUS - 1;
        ballLaunched = false;
        ball.dx = 2;
        ball.dy = -4;

        initializeBricks(); // Clears old brick elements and re-populates the bricks array

        // Ensure elements are drawn in their initial state
        drawPaddle();
        drawBall();
        drawBricks(); // Draw the newly initialized bricks
    }

    init(); // Initialize game state
    update(); // Start the game loop
});
