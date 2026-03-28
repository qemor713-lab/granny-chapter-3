// --- CORE CONFIGURATION ---
const gameCanvas = document.getElementById("game-canvas");
const ctx = gameCanvas.getContext("2d");
gameCanvas.width = 800;
gameCanvas.height = 600;

// Save System
let currentPoints = parseInt(localStorage.getItem('grannyPoints')) || 0;
const updateUI = () => {
    document.getElementById('point-display').innerText = currentPoints;
    const detail = document.getElementById('point-detail');
    if(detail) detail.innerText = currentPoints;
};
updateUI();

let isGameRunning = false;
const worldMap = { width: 2500, height: 2500 }; 
const gameCamera = { x: 0, y: 0 };

// --- ENTITIES ---
const playerEntity = { x: 0, y: 0, size: 25, speed: 7.5, color: "#00ff00" };
const enemyEntity = { x: 0, y: 0, size: 30, speed: 0, color: "#ff0000" };
const escapeDoor = { x: 0, y: 0, size: 85 };
const escapeKey = { x: 0, y: 0, isCollected: false };

const inputState = {};

window.addEventListener("keydown", (e) => inputState[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => inputState[e.key.toLowerCase()] = false);

// --- NAVIGATION SYSTEM ---
function navigateTo(targetId) {
    const screens = document.querySelectorAll('.screen-overlay');
    screens.forEach(s => s.classList.add('hidden'));
    
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        gameCanvas.classList.add('hidden'); // Hide canvas when in menu
    }
    
    if (targetId === 'none') {
        gameCanvas.classList.remove('hidden');
    }
}

// --- RESET & RANDOMIZE ---
function randomizeLocations() {
    playerEntity.x = worldMap.width / 2;
    playerEntity.y = worldMap.height / 2;
    enemyEntity.x = 200;
    enemyEntity.y = 200;

    escapeDoor.x = Math.random() * (worldMap.width - 200);
    escapeDoor.y = Math.random() * (worldMap.height - 200);

    let distance = 0;
    while (distance < 1300) {
        escapeKey.x = Math.random() * (worldMap.width - 100);
        escapeKey.y = Math.random() * (worldMap.height - 100);
        distance = Math.hypot(escapeKey.x - escapeDoor.x, escapeKey.y - escapeDoor.y);
    }
    escapeKey.isCollected = false;
}

// --- GAME ACTIONS ---
function startGame(difficulty) {
    const speeds = {
        'practice': 0, 'easy': 2.5, 'normal': 3.8, 
        'hard': 5.5, 'extreme': 7.0, 'scary': 9.5, 'so-extreme': 13.5
    };
    enemyEntity.speed = speeds[difficulty];
    
    randomizeLocations();
    navigateTo('none');
    isGameRunning = true;
    requestAnimationFrame(mainLoop);
}

function handleGameOver(message) {
    isGameRunning = false;
    alert(message);
    navigateTo('main-menu'); // Return to menu instead of reloading
}

function update() {
    if (!isGameRunning) return;

    // Movement
    if (inputState['w'] && playerEntity.y > 0) playerEntity.y -= playerEntity.speed;
    if (inputState['s'] && playerEntity.y < worldMap.height - playerEntity.size) playerEntity.y += playerEntity.speed;
    if (inputState['a'] && playerEntity.x > 0) playerEntity.x -= playerEntity.speed;
    if (inputState['d'] && playerEntity.x < worldMap.width - playerEntity.size) playerEntity.x += playerEntity.speed;

    // Camera follow
    gameCamera.x = Math.max(0, Math.min(playerEntity.x - gameCanvas.width / 2, worldMap.width - gameCanvas.width));
    gameCamera.y = Math.max(0, Math.min(playerEntity.y - gameCanvas.height / 2, worldMap.height - gameCanvas.height));

    // Interaction checks
    if (Math.hypot(playerEntity.x - escapeKey.x, playerEntity.y - escapeKey.y) < 50 && !escapeKey.isCollected) {
        escapeKey.isCollected = true;
    }

    if (Math.hypot(playerEntity.x - escapeDoor.x, playerEntity.y - escapeDoor.y) < 110 && inputState['e']) {
        if (escapeKey.isCollected) {
            currentPoints++;
            localStorage.setItem('grannyPoints', currentPoints);
            updateUI();
            handleGameOver("YOU ESCAPED!");
        }
    }

    // AI Tracking
    let distToEnemy = Math.hypot(playerEntity.x - enemyEntity.x, playerEntity.y - enemyEntity.y);
    if (distToEnemy > 0 && enemyEntity.speed > 0) {
        enemyEntity.x += ((playerEntity.x - enemyEntity.x) / distToEnemy) * enemyEntity.speed;
        enemyEntity.y += ((playerEntity.y - enemyEntity.y) / distToEnemy) * enemyEntity.speed;
    }

    // Death Check
    if (distToEnemy < playerEntity.size) {
        handleGameOver("GAME OVER! CAUGHT BY GRANNY.");
    }
}

function renderHUD() {
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Courier New";
    ctx.fillText("KEY STATUS: " + (escapeKey.isCollected ? "READY" : "MISSING"), 20, 40);
}

function draw() {
    if (!isGameRunning) return;
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    ctx.save();
    ctx.translate(-gameCamera.x, -gameCamera.y);

    // Grid lines
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, worldMap.width, worldMap.height);
    ctx.strokeStyle = "#1a1a1a";
    for(let i=0; i<=worldMap.width; i+=200) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,worldMap.height); ctx.stroke();
    }
    for(let j=0; j<=worldMap.height; j+=200) {
        ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(worldMap.width,j); ctx.stroke();
    }

    // Render Assets
    ctx.fillStyle = escapeKey.isCollected ? "#00ff00" : "#331a00";
    ctx.fillRect(escapeDoor.x, escapeDoor.y, escapeDoor.size, escapeDoor.size);
    if (!escapeKey.isCollected) {
        ctx.fillStyle = "gold";
        ctx.beginPath(); ctx.arc(escapeKey.x, escapeKey.y, 15, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = playerEntity.color;
    ctx.fillRect(playerEntity.x, playerEntity.y, playerEntity.size, playerEntity.size);
    ctx.fillStyle = enemyEntity.color;
    ctx.beginPath(); ctx.arc(enemyEntity.x + 15, enemyEntity.y + 15, 15, 0, Math.PI*2); ctx.fill();

    ctx.restore();
    renderHUD();
}

function mainLoop() {
    update();
    draw();
    if (isGameRunning) requestAnimationFrame(mainLoop);
}