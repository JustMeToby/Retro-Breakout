## Product Requirements Document: Retro Breakout Game

**1. Introduction**

This document outlines the product requirements for "Retro Breakout," a web-based game inspired by the classic Breakout. The game will feature pixelated graphics using the 'VT323' Google Font for text, sound effects and background music from local MP3 files, multiple levels with diverse brick types including power-ups, and responsive design. It will be built using HTML, CSS, and vanilla JavaScript with no external library dependencies. Game state and high scores will be saved using local storage. The game is intended to be free with no advertisements.

**2. Overall Project Goals**

*   Develop a fully functional Breakout-style game.
*   Implement a retro aesthetic with pixelated graphics using CSS, inline SVG, and the 'VT323' Google Font.
*   Ensure the game is playable and enjoyable on desktop, tablet, and mobile devices, designed for landscape view.
*   Incorporate sound effects and background music from `.mp3` files to enhance the retro experience.
*   Allow players to save their progress (every second) and resume playing later.
*   Implement a local high score system.
*   Deliver a polished and bug-free game.

**3. Target Audience**

*   Players who enjoy classic arcade games.
*   Casual gamers looking for a simple yet engaging experience.
*   Users who appreciate retro aesthetics and pixel art.

**4. Development Phases**

---

**Phase 1: Core Game Mechanics & Basic Rendering**

*   **Phase Goals:**
    *   Implement the fundamental gameplay loop of Breakout.
    *   Render the game elements (paddle, ball, a single layer of basic bricks, walls) using CSS and inline SVG.
    *   Establish basic collision detection and response.
    *   Implement a scoring system and lives display.
*   **Features:**
    *   **Paddle:**
        *   Player-controlled paddle at the bottom of the screen.
        *   Movement restricted horizontally within game boundaries.
        *   Desktop: Controlled by keyboard (arrow keys or A/D) AND horizontal mouse movement.
    *   **Ball:**
        *   A single ball that moves and bounces off the paddle, walls, and bricks.
        *   Ball launch mechanism (e.g., spacebar or click/tap after a life is lost/game starts).
    *   **Bricks (Basic):**
        *   A static layout of single-hit bricks at the top of the screen.
        *   Bricks disappear upon collision with the ball.
    *   **Walls:**
        *   Top and side walls for the ball to bounce off.
        *   Bottom "wall" (or lack thereof) results in losing a life.
    *   **Scoring:**
        *   Points awarded for destroying bricks.
        *   Score displayed on screen using the 'VT323' font.
    *   **Lives:**
        *   Player starts with a fixed number of lives (e.g., 3).
        *   Losing a life when the ball goes past the paddle.
        *   Lives displayed on screen using the 'VT323' font.
        *   Game over when lives reach zero.
    *   **Basic Game Loop:**
        *   Start game -> Play -> Lose life / Destroy bricks -> Game over / Level clear (basic version).
*   **Technical Requirements:**
    *   **Rendering:** All game elements (paddle, ball, bricks, score/lives display) rendered using HTML, CSS, and inline SVG. Text elements must use the 'VT323' Google Font.
    *   **Graphics Style:** Simple, pixelated retro look.
    *   **Fixed Aspect Ratio:** Game canvas/stage maintains a fixed width/height ratio.
    *   **Collision Detection:**
        *   Ball and paddle.
        *   Ball and bricks.
        *   Ball and game boundaries (walls).
    *   **Controls:** Keyboard and mouse input for paddle movement on desktop.
    *   **Game Logic:** Implemented in vanilla JavaScript.
    *   **Structure:** Clean separation of HTML structure, CSS styling, and JavaScript game logic.
*   **Acceptance Criteria:**
    *   Paddle moves left and right via keyboard and mouse.
    *   Ball launches and bounces realistically off the paddle, walls.
    *   Basic bricks disappear when hit by the ball.
    *   Score and lives update correctly and are displayed using 'VT323' font.
    *   Player loses a life when the ball hits the bottom of the screen.
    *   Game ends when all lives are lost (simple "Game Over" message).
    *   Game elements have a basic pixelated appearance; game stage maintains a fixed aspect ratio.
    *   **Status: Completed**

---

**Phase 2: Levels, Difficulty Progression, Enhanced Brick Types & Power-ups**

*   **Phase Goals:**
    *   Introduce multiple levels with varying brick layouts and types.
    *   Implement a system for progressing through levels.
    *   Gradually increase difficulty.
    *   Implement proper "Game Over" and "Level Cleared" screens/states.
    *   Introduce advanced brick types, including power-ups.
*   **Features:**
    *   **Level System:**
        *   Minimum of 3-5 unique levels.
        *   Each level has a different configuration of bricks, designed for the fixed aspect ratio.
        *   Transition to the next level when all clearable bricks are destroyed.
    *   **Difficulty Progression:**
        *   Increase ball speed with each new level or after a certain time/score (excluding effects of speed-related power-ups).
    *   **Advanced Brick Types (Visual distinction for each using inline SVG):**
        *   **Multi-Hit Bricks:**
            *   Bricks requiring 2 hits (visual feedback for 1st hit).
            *   Bricks requiring 3 hits (visual feedback for 1st and 2nd hits).
        *   **Unbreakable Bricks:** Bricks that the ball bounces off but cannot be destroyed.
        *   **Power-up Bricks (destroying these activates a temporary effect or grants a bonus):**
            *   **Life Brick:** Awards an extra life to the player.
            *   **Slow Ball Brick:** Temporarily decreases the ball's speed.
            *   **Multi-Ball Brick:** Temporarily adds a second ball to the playfield.
            *   **Speed Ball Brick (Negative Power-up):** Temporarily increases the ball's speed.
    *   **Power-up Management:**
        *   Clear visual indication when a power-up is active (e.g., UI element, paddle change).
        *   Timed duration for temporary power-ups.
        *   Effects of multiple power-ups (e.g., how slow ball and multi-ball interact if active simultaneously - define clear rules).
    *   **Game Screens (using 'VT323' font for text):**
        *   **Start Screen:** Simple screen with "Start New Game" and "Resume Game" (if save data exists) buttons.
        *   **Level Cleared Screen:** Message displayed between levels.
        *   **Game Over Screen:** Displays final score, high scores, and a "Play Again" option.
*   **Technical Requirements:**
    *   **Level Data:** Store level layouts (brick positions, types, hit points, power-up assignments) in a structured way in JavaScript.
    *   **State Management:** Robust handling of game states (e.g., `MENU`, `PLAYING`, `LEVEL_TRANSITION`, `GAME_OVER`, `POWERUP_ACTIVE`).
    *   **Power-up Logic:** Implementation of power-up activation, duration, effects, and deactivation. Stacking or overriding rules for multiple power-ups.
    *   **Multiple Balls:** Logic to handle physics, collisions, and loss conditions for multiple balls.
*   **Acceptance Criteria:**
    *   Player can progress through multiple distinct levels.
    *   All specified brick types (multi-hit, unbreakable, power-ups) are implemented and function correctly with distinct visual styles.
    *   Power-ups activate, provide their defined effect for the specified duration (if applicable), and have clear visual feedback.
    *   Difficulty demonstrably increases.
    *   Functional "Start Screen," "Level Cleared Screen," and "Game Over Screen" with specified options.
    *   **Status: Completed**

---

**Phase 3: Sound Effects & Background Music**

*   **Phase Goals:**
    *   Enhance the retro feel with appropriate sound effects from MP3 files.
    *   Add looping background music from an MP3 file.
    *   Provide an option to mute/unmute audio.
*   **Features:**
    *   **Sound Effects (from `.mp3` files in `sounds/` directory):**
        *   Ball hitting paddle.
        *   Ball hitting brick (distinct sounds for break vs. hit on multi-hit/unbreakable brick if possible).
        *   Ball hitting wall.
        *   Losing a life.
        *   Level complete.
        *   Game over.
        *   Power-up activation.
        *   Power-up deactivation/timeout.
    *   **Background Music (from an `.mp3` file in `sounds/` directory):**
        *   Retro-style looping background track during gameplay.
    *   **Audio Control:**
        *   A visible mute/unmute button for all game audio.
*   **Technical Requirements:**
    *   **Web Audio API or HTML5 Audio:** Use appropriate web audio technology for playing `.mp3` files. Web Audio API is preferred for lower latency with sound effects.
    *   **Sound Assets:** Game will load `.mp3` files from a local `sounds/` subdirectory.
    *   **Audio Management:** Logic to trigger sounds at appropriate game events. Logic for looping background music.
*   **Acceptance Criteria:**
    *   All specified sound effects play correctly from MP3 files at corresponding game events.
    *   Background music plays and loops from an MP3 file during gameplay.
    *   Mute/unmute button correctly controls all game audio.
    *   Audio contributes positively to the retro theme.
    *   **Status: Completed**

---

**Phase 4: Responsiveness & Mobile Playability**

*   **Phase Goals:**
    *   Ensure the game is playable and looks good on various screen sizes, maintaining its fixed aspect ratio.
    *   Implement draggable touch controls for mobile and tablet devices.
    *   Enforce landscape orientation.
*   **Features:**
    *   **Responsive Layout & Scaling:**
        *   Game area scales to fit the full page width for viewport widths below 1024px, while maintaining its fixed aspect ratio.
        *   For viewport widths of 1024px and above, the game stage stops scaling (maintains its 1024px-equivalent size based on aspect ratio) and is horizontally centered on the page.
        *   UI elements (score, lives, mute button) remain legible and accessible.
    *   **Touch Controls:**
        *   Paddle movement controlled by dragging the paddle directly with a finger.
    *   **Orientation Handling:**
        *   Game is designed for landscape view.
        *   If the device is in portrait mode, display a message prompting the user to rotate their device. Game should not be playable in portrait.
*   **Technical Requirements:**
    *   **CSS:** Use responsive CSS techniques (media queries, flexbox/grid for centering, viewport units where appropriate).
    *   **JavaScript:**
        *   Detect touch events and implement draggable paddle control.
        *   Detect screen orientation and display a prompt if in portrait.
        *   Implement scaling logic for the game canvas/stage.
    *   **Testing:** Test on various browsers (Chrome, Firefox, Safari, Edge) and device emulators/actual devices.
*   **Acceptance Criteria:**
    *   Game layout adapts and centers correctly based on viewport width as specified.
    *   Game maintains its fixed aspect ratio across all supported screen sizes.
    *   Game is fully playable using draggable touch controls on mobile/tablet devices in landscape mode.
    *   A clear message prompts for device rotation if in portrait mode.
    *   All UI elements remain visible and usable on all supported screen sizes.
    *   Pixelated aesthetic and 'VT323' font are maintained across different resolutions.
    *   **Status: Completed**

---

**Phase 5: Game State Persistence & High Scores (Local Storage)**

*   **Phase Goals:**
    *   Allow players to save their progress.
    *   Enable players to resume their game.
    *   Implement a local high score list.
*   **Features:**
    *   **Automatic Save:**
        *   Game state (current level, score, lives, active power-ups and their remaining durations, ball positions/velocities) is automatically saved to browser local storage every second during active gameplay.
    *   **Resume Game:**
        *   Start screen checks for saved data.
        *   If saved data is found, "Resume Game" button is enabled.
        *   "Start New Game" option always available, which would clear any existing saved session state before starting.
        *   Resuming loads the player's exact saved state.
    *   **High Score List:**
        *   A list of top high scores (e.g., top 5 or 10) is maintained in local storage.
        *   Player's name/initials for high score entry (simple prompt after a qualifying game over).
        *   High scores displayed on the Game Over screen and potentially on the Start Screen.
*   **Technical Requirements:**
    *   **Local Storage API:** Use browser `localStorage` to store game state data and high scores (e.g., as JSON strings).
    *   **Data Serialization:** Convert game state objects and high score arrays to JSON for storage and parse JSON back into objects when loading.
    *   **Frequent Saves:** Implement efficient saving every second without impacting performance.
    *   **Error Handling:** Handle cases where local storage might be unavailable (though unlikely for this scope).
*   **Acceptance Criteria:**
    *   Game state is saved every second during gameplay.
    *   On returning, player can choose to "Resume Game" (restoring level, score, lives, power-ups, ball states) or "Start New Game".
    *   A list of top high scores is stored and updated.
    *   Players can enter initials if they achieve a high score.
    *   High scores are displayed correctly.
    *   **Status: Completed**

---

**Phase 6: Final Touches, Polish & Testing**

*   **Phase Goals:**
    *   Refine all aspects of the game for a polished user experience.
    *   Implement pause functionality.
    *   Conduct thorough testing across different browsers and devices.
*   **Features:**
    *   **Pause Functionality:**
        *   Ability to pause the game during gameplay (e.g., pressing 'P' key or a pause button).
        *   Game state (ball movement, power-up timers) is frozen.
        *   Game resumes from the paused state.
        *   A "Paused" message is displayed.
    *   **UI/UX Polish:**
        *   Consistent styling using 'VT323' font and pixelated SVGs. Clear visual feedback for all interactions.
        *   Smooth transitions between game states/screens.
        *   Clear instructions or intuitive design.
    *   **Refined Pixel Art & Animations:**
        *   Ensure all SVG elements (bricks, paddle, ball, power-up effects) are consistently pixelated and contribute to the retro theme.
        *   Smooth and fitting animations for ball movement, brick breaking, power-up activations.
    *   **High Score Display:** Polished display of high scores.
*   **Technical Requirements:**
    *   **Cross-Browser Compatibility:** Ensure consistent appearance and functionality on latest versions of major desktop and mobile browsers.
    *   **Performance Optimization:** Game runs smoothly without noticeable lag, especially during complex scenes (multiple balls, active power-ups) and on mobile devices.
    *   **Code Quality:** Well-organized, commented, and maintainable HTML, CSS, and JavaScript.
    *   **Accessibility (Basic):**
        *   Keyboard navigability for controls and menu options.
        *   Sufficient color contrast (within the retro style constraints).
        *   Pause button easily accessible.
*   **Acceptance Criteria:**
    *   Pause functionality works as expected, freezing all game action.
    *   The game feels polished, with smooth animations and transitions. 'VT323' font used everywhere for text.
    *   The retro visual style, including all new brick types and power-up effects, is consistently and effectively applied.
    *   No major bugs or glitches on supported browsers and devices.
    *   The game is enjoyable and intuitive to play.
    *   Code is well-structured and documented.
    *   **Status: Completed**

---

**7. Non-Functional Requirements**

*   **Performance:** The game must run smoothly at a consistent frame rate (e.g., 30-60 FPS) on target devices.
*   **Maintainability:** Code should be modular, well-commented, and easy to understand for future updates.
*   **Security:** Client-side only; no server-side interactions.
*   **Dependencies:**
    *   Allowed external resources:
        *   'VT323' Google Font.
        *   `.mp3` audio files located in a `sounds/` subdirectory.
    *   No external JavaScript libraries or frameworks. All graphics via inline SVG and CSS.
    *   **Status: Completed**
