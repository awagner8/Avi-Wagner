(() => {
    "use strict";

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreEl = document.getElementById("score");
    const levelEl = document.getElementById("level");
    const livesEl = document.getElementById("lives");
    const bestScoreEl = document.getElementById("bestScore");
    const nextLevelLabel = document.getElementById("nextLevelLabel");
    const levelNote = document.getElementById("levelNote");
    const miniGrid = document.getElementById("miniGrid");
    const screenMessage = document.getElementById("screenMessage");
    const messageKicker = document.getElementById("messageKicker");
    const messageTitle = document.getElementById("messageTitle");
    const messageBody = document.getElementById("messageBody");
    const startButton = document.getElementById("startButton");
    const pauseBadge = document.getElementById("pauseBadge");
    const resetButton = document.getElementById("resetButton");

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const PADDLE = { width: 118, height: 10, y: HEIGHT - 42, speed: 8 };
    const BALL_RADIUS = 7;
    const COLORS = ["#ff513d", "#ffd83d", "#8268ff", "#6fe8e2"];
    const levelConfigs = [
        { rows: 4, cols: 9, gap: 9, speed: 5.15, note: "More bricks. Less room for error." },
        { rows: 5, cols: 10, gap: 8, speed: 5.7, note: "The grid gets tighter. Stay sharp." },
        { rows: 6, cols: 11, gap: 7, speed: 6.3, note: "Final round. Leave nothing standing." },
    ];

    let level = 1;
    let score = 0;
    let lives = 3;
    let bricks = [];
    let running = false;
    let paused = false;
    let gameOver = false;
    let won = false;
    let leftPressed = false;
    let rightPressed = false;
    let lastTime = 0;
    let animationId;
    let bestScore = Number(localStorage.getItem("breakout-best") || 0);

    const paddle = { x: WIDTH / 2 - PADDLE.width / 2, y: PADDLE.y, width: PADDLE.width, height: PADDLE.height };
    const ball = { x: WIDTH / 2, y: PADDLE.y - 15, dx: 0, dy: 0, speed: 5.15, stuck: true };

    function formatScore(value) { return String(value).padStart(6, "0"); }

    function updateHud() {
        scoreEl.textContent = formatScore(score);
        levelEl.textContent = String(level).padStart(2, "0");
        livesEl.textContent = `${"● ".repeat(Math.max(0, lives)).trim()}${lives < 3 ? " ○".repeat(3 - lives) : ""}`;
        livesEl.setAttribute("aria-label", `${lives} ${lives === 1 ? "life" : "lives"}`);
        bestScoreEl.textContent = formatScore(bestScore);
        nextLevelLabel.textContent = level < 3 ? String(level + 1).padStart(2, "0") : "—";
        levelNote.textContent = levelConfigs[level - 1].note;
        renderMiniGrid();
    }

    function renderMiniGrid() {
        const config = levelConfigs[Math.min(level, 2)];
        miniGrid.innerHTML = "";
        const total = config.rows * 8;
        for (let i = 0; i < total; i += 1) {
            const cell = document.createElement("i");
            cell.style.opacity = String(Math.max(0.35, 1 - Math.max(0, i - 24) * 0.018));
            miniGrid.appendChild(cell);
        }
    }

    function buildBricks() {
        const config = levelConfigs[level - 1];
        const marginX = 40;
        const top = 52;
        const brickWidth = (WIDTH - marginX * 2 - config.gap * (config.cols - 1)) / config.cols;
        const brickHeight = 20;
        bricks = [];
        for (let row = 0; row < config.rows; row += 1) {
            for (let col = 0; col < config.cols; col += 1) {
                bricks.push({
                    x: marginX + col * (brickWidth + config.gap),
                    y: top + row * (brickHeight + config.gap),
                    width: brickWidth,
                    height: brickHeight,
                    color: COLORS[row % COLORS.length],
                    alive: true,
                    hit: 0,
                });
            }
        }
    }

    function resetBall() {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - BALL_RADIUS - 3;
        ball.speed = levelConfigs[level - 1].speed;
        ball.dx = ball.speed * (Math.random() > 0.5 ? 0.58 : -0.58);
        ball.dy = -Math.sqrt(ball.speed ** 2 - ball.dx ** 2);
        ball.stuck = true;
    }

    function resetRun() {
        cancelAnimationFrame(animationId);
        level = 1;
        score = 0;
        lives = 3;
        running = false;
        paused = false;
        gameOver = false;
        won = false;
        paddle.x = WIDTH / 2 - PADDLE.width / 2;
        buildBricks();
        resetBall();
        pauseBadge.classList.remove("visible");
        showMessage("READY WHEN YOU ARE", "BREAK THE<br /><span>ROUTINE.</span>", "Clear every brick to advance. The ball launches automatically.", "START GAME <span>→</span>");
        updateHud();
        draw();
    }

    function showMessage(kicker, title, body, button) {
        messageKicker.textContent = kicker;
        messageTitle.innerHTML = title;
        messageBody.textContent = body;
        startButton.innerHTML = button;
        screenMessage.classList.remove("hidden");
    }

    function hideMessage() { screenMessage.classList.add("hidden"); }

    function launch() {
        if (!running) {
            running = true;
            paused = false;
            hideMessage();
            lastTime = performance.now();
            animationId = requestAnimationFrame(loop);
        }
        ball.stuck = false;
    }

    function togglePause() {
        if (!running || gameOver || won) return;
        paused = !paused;
        pauseBadge.classList.toggle("visible", paused);
        if (!paused) {
            lastTime = performance.now();
            animationId = requestAnimationFrame(loop);
        }
    }

    function loseLife() {
        lives -= 1;
        updateHud();
        if (lives <= 0) {
            running = false;
            gameOver = true;
            showMessage("RUN ENDED", "ONE MORE<br /><span>TRY?</span>", `You scored ${formatScore(score)} points. The grid is waiting.`, "RESTART RUN <span>↻</span>");
            return;
        }
        resetBall();
        running = false;
        paused = false;
        pauseBadge.classList.remove("visible");
        showMessage("LIFE LOST", "READY TO<br /><span>BOUNCE?</span>", "Press ↑ or Space to launch the ball.", "LAUNCH BALL <span>↑</span>");
        draw();
    }

    function completeLevel() {
        if (level >= levelConfigs.length) {
            running = false;
            won = true;
            bestScore = Math.max(bestScore, score);
            localStorage.setItem("breakout-best", String(bestScore));
            updateHud();
            showMessage("GRID CLEARED", "YOU<br /><span>MADE IT.</span>", `Final score: ${formatScore(score)}. That was a clean run.`, "PLAY AGAIN <span>→</span>");
            return;
        }
        level += 1;
        buildBricks();
        resetBall();
        updateHud();
    }

    function movePaddle(delta) {
        paddle.x = Math.max(12, Math.min(WIDTH - paddle.width - 12, paddle.x + delta));
        if (ball.stuck) ball.x = paddle.x + paddle.width / 2;
    }

    function update(dt) {
        const motion = PADDLE.speed * dt * 60;
        if (leftPressed) movePaddle(-motion);
        if (rightPressed) movePaddle(motion);
        if (ball.stuck) {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - BALL_RADIUS - 3;
            return;
        }

        ball.x += ball.dx * dt * 60;
        ball.y += ball.dy * dt * 60;
        if (ball.x - BALL_RADIUS <= 0 || ball.x + BALL_RADIUS >= WIDTH) {
            ball.dx *= -1;
            ball.x = Math.max(BALL_RADIUS, Math.min(WIDTH - BALL_RADIUS, ball.x));
        }
        if (ball.y - BALL_RADIUS <= 0) {
            ball.dy *= -1;
            ball.y = BALL_RADIUS;
        }
        if (ball.dy > 0 && ball.y + BALL_RADIUS >= paddle.y && ball.y - BALL_RADIUS <= paddle.y + paddle.height && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
            const relative = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            const angle = relative * (Math.PI / 3);
            const speed = Math.min(8.2, Math.hypot(ball.dx, ball.dy) + 0.03);
            ball.dx = speed * Math.sin(angle);
            ball.dy = -speed * Math.cos(angle);
            ball.y = paddle.y - BALL_RADIUS - 1;
        }
        if (ball.y - BALL_RADIUS > HEIGHT) {
            loseLife();
            return;
        }

        for (const brick of bricks) {
            if (!brick.alive) continue;
            const hitX = ball.x + BALL_RADIUS >= brick.x && ball.x - BALL_RADIUS <= brick.x + brick.width;
            const hitY = ball.y + BALL_RADIUS >= brick.y && ball.y - BALL_RADIUS <= brick.y + brick.height;
            if (hitX && hitY) {
                brick.alive = false;
                brick.hit = 1;
                score += 100 * level;
                bestScore = Math.max(bestScore, score);
                localStorage.setItem("breakout-best", String(bestScore));
                const nearestX = Math.min(Math.abs(ball.x - brick.x), Math.abs(ball.x - (brick.x + brick.width)));
                const nearestY = Math.min(Math.abs(ball.y - brick.y), Math.abs(ball.y - (brick.y + brick.height)));
                if (nearestX < nearestY) ball.dx *= -1;
                else ball.dy *= -1;
                updateHud();
                if (bricks.every((item) => !item.alive)) completeLevel();
                break;
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#080a15";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        drawAmbient();
        for (const brick of bricks) drawBrick(brick);
        drawPaddle();
        drawBall();
    }

    function drawAmbient() {
        const gradient = ctx.createRadialGradient(WIDTH * .5, HEIGHT * .38, 20, WIDTH * .5, HEIGHT * .38, WIDTH * .65);
        gradient.addColorStop(0, "rgba(47, 48, 110, .18)");
        gradient.addColorStop(1, "rgba(8, 10, 21, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.strokeStyle = "rgba(111, 232, 226, .08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(22, HEIGHT - 21);
        ctx.lineTo(WIDTH - 22, HEIGHT - 21);
        ctx.stroke();
    }

    function drawBrick(brick) {
        if (!brick.alive) {
            if (brick.hit > 0) brick.hit -= .035;
            return;
        }
        ctx.fillStyle = brick.color;
        ctx.globalAlpha = .93;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.globalAlpha = .22;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
        ctx.globalAlpha = 1;
    }

    function drawPaddle() {
        ctx.shadowColor = "rgba(111, 232, 226, .7)";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#6fe8e2";
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.fillRect(paddle.x + 3, paddle.y + 2, paddle.width - 6, 2);
    }

    function drawBall() {
        ctx.shadowColor = "rgba(255,216,61,.9)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#ffd83d";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function loop(timestamp) {
        if (!running || paused) return;
        const dt = Math.min((timestamp - lastTime) / 1000, .025);
        lastTime = timestamp;
        update(dt);
        draw();
        if (running && !paused) animationId = requestAnimationFrame(loop);
    }

    function keyState(event, pressed) {
        if (["ArrowLeft", "a", "A"].includes(event.key)) {
            leftPressed = pressed;
            event.preventDefault();
        }
        if (["ArrowRight", "d", "D"].includes(event.key)) {
            rightPressed = pressed;
            event.preventDefault();
        }
        if (event.code === "ArrowUp" && pressed && !event.repeat) { event.preventDefault(); if (!running && (gameOver || won)) resetRun(); if (!running) launch(); }
        if (event.code === "Space" && pressed && !event.repeat) {
            event.preventDefault();
            if (!running && (gameOver || won)) resetRun();
            else if (!running) launch();
            else togglePause();
        }
    }

    startButton.addEventListener("click", () => {
        if (gameOver || won) resetRun();
        launch();
    });
    resetButton.addEventListener("click", resetRun);
    window.addEventListener("keydown", (event) => keyState(event, true));
    window.addEventListener("keyup", (event) => keyState(event, false));
    canvas.addEventListener("pointermove", (event) => {
        const rect = canvas.getBoundingClientRect();
        paddle.x = (event.clientX - rect.left) / rect.width * WIDTH - paddle.width / 2;
        paddle.x = Math.max(12, Math.min(WIDTH - paddle.width - 12, paddle.x));
        if (ball.stuck) ball.x = paddle.x + paddle.width / 2;
    });
    canvas.addEventListener("pointerdown", () => { if (!running) launch(); });

    buildBricks();
    resetBall();
    updateHud();
    draw();
})();