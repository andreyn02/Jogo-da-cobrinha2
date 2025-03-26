const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const winMessage = document.getElementById("win-message");

const gridSize = 20;
const canvasSize = 400;
const initialSpeed = 100;
const maxBodySize = (canvasSize / gridSize) * (canvasSize / gridSize); // Tamanho máximo do corpo

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let direction = { x: 0, y: 0 };
let score = 0;
let speed = initialSpeed;
let gameInterval;
let isInvincible = false; // Invencibilidade
let isFrozen = false; // Congelamento
let powerUps = []; // Lista de power-ups
const powerUpTypes = ["golden", "freeze", "explosive"]; // Tipos de power-ups

// Função para gerar comida ou power-up
function generateFood() {
    const isPowerUp = Math.random() < 0.2; // 20% de chance de ser power-up
    if (isPowerUp) {
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        powerUps.push({
            x: Math.floor(Math.random() * (canvasSize / gridSize)),
            y: Math.floor(Math.random() * (canvasSize / gridSize)),
            type: type,
        });
    } else {
        food = {
            x: Math.floor(Math.random() * (canvasSize / gridSize)),
            y: Math.floor(Math.random() * (canvasSize / gridSize)),
        };
    }
}

// Função para desenhar a cobrinha
function drawSnake() {
    ctx.fillStyle = "#00FF00";
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

// Função para desenhar a comida
function drawFood() {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

// Função para desenhar os power-ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.type === "golden") {
            ctx.fillStyle = "#FFD700"; // Cor dourada
        } else if (powerUp.type === "freeze") {
            ctx.fillStyle = "#00FFFF"; // Cor azul clara
        } else if (powerUp.type === "explosive") {
            ctx.fillStyle = "#800080"; // Cor roxa
        }
        ctx.fillRect(powerUp.x * gridSize, powerUp.y * gridSize, gridSize, gridSize);
    });
}

// Função para verificar colisões
function checkCollision() {
    const head = snake[0];

    // Colisão com o próprio corpo
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

// Função para verificar se a cobrinha bateu na parede
function checkWallCollision() {
    const head = snake[0];

    if (
        head.x < 0 || head.x >= canvasSize / gridSize ||
        head.y < 0 || head.y >= canvasSize / gridSize
    ) {
        return true;
    }

    return false;
}

// Função para verificar vitória
function checkWin() {
    if (snake.length === maxBodySize) {
        clearInterval(gameInterval);
        winMessage.classList.add("visible"); // Mostra a mensagem de vitória
        setTimeout(() => {
            location.reload(); // Reinicia o jogo após 15 segundos
        }, 15000);
    }
}

// Função para animação de morte
function deathAnimation() {
    let segments = [...snake];
    let particles = [];

    // Cria partículas para a animação de morte
    segments.forEach(segment => {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: segment.x * gridSize,
                y: segment.y * gridSize,
                vx: (Math.random() - 0.5) * 4, // Velocidade horizontal
                vy: (Math.random() - 0.5) * 4, // Velocidade vertical
                size: Math.random() * 4 + 2, // Tamanho da partícula
            });
        }
    });

    const explode = setInterval(() => {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        drawFood();
        drawPowerUps();

        // Desenha as partículas
        particles.forEach(particle => {
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.size *= 0.95; // Reduz o tamanho da partícula
        });

        // Remove partículas muito pequenas
        particles = particles.filter(particle => particle.size > 0.5);

        // Finaliza a animação
        if (particles.length === 0) {
            clearInterval(explode);
            alert(`Fim de jogo! Pontuação: ${score}`);
            location.reload();
        }
    }, 16); // ~60 FPS
}

// Função para ativar invencibilidade
function activateInvincibility() {
    isInvincible = true;
    setTimeout(() => {
        isInvincible = false;
    }, 15000); // 15 segundos de invencibilidade
}

// Função para aplicar efeitos dos power-ups
function applyPowerUp(powerUp) {
    if (powerUp.type === "golden") {
        score += 50; // Pontuação extra
        snake.push({ ...snake[snake.length - 1] }); // Cresce mais rápido
    } else if (powerUp.type === "freeze") {
        isFrozen = true; // Congela a cobrinha
        setTimeout(() => {
            isFrozen = false; // Volta ao normal após 3 segundos
        }, 3000);
    } else if (powerUp.type === "explosive") {
        if (snake.length <= 3) {
            // Se a cobrinha tiver 3 ou menos segmentos, ela morre
            clearInterval(gameInterval);
            deathAnimation();
        } else {
            // Remove 3 segmentos do corpo
            snake.splice(-3, 3);
        }
    }
}

// Função para atualizar o jogo
function updateGame() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Verifica se a cobrinha bateu na parede
    if (checkWallCollision() && !isInvincible) {
        clearInterval(gameInterval);
        deathAnimation();
        return;
    }

    // Verifica se a cobrinha comeu a comida
    if (head.x === food.x && head.y === food.y) {
        snake.unshift(head);
        score += 10;
        generateFood();

        // Ativa invencibilidade a cada 100 pontos
        if (score % 100 === 0) {
            activateInvincibility();
        }
    } else {
        snake.unshift(head);
        snake.pop();
    }

    // Verifica se a cobrinha comeu um power-up
    powerUps.forEach((powerUp, index) => {
        if (head.x === powerUp.x && head.y === powerUp.y) {
            applyPowerUp(powerUp);
            powerUps.splice(index, 1); // Remove o power-up
        }
    });

    // Verifica colisões com o próprio corpo
    if (checkCollision() && !isInvincible) {
        clearInterval(gameInterval);
        deathAnimation();
    }

    // Verifica se a cobrinha ganhou o jogo
    checkWin();

    // Atualiza a pontuação
    scoreDisplay.textContent = `Pontos: ${score}`;
}

// Função para desenhar o jogo
function drawGame() {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawSnake();
    drawFood();
    drawPowerUps();
}

// Loop do jogo
function gameLoop() {
    if (!isFrozen) { // Só atualiza o jogo se a cobrinha não estiver congelada
        updateGame();
    }
    drawGame();
}

// Inicia o jogo
function startGame() {
    generateFood();
    gameInterval = setInterval(gameLoop, speed);
}

// Controles
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case "ArrowDown":
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case "ArrowLeft":
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case "ArrowRight":
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
});

startGame();
