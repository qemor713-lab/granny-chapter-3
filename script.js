// --- CORE CONFIGURATION ---
const gameCanvas = document.getElementById("game-canvas");
const ctx = gameCanvas.getContext("2d");
gameCanvas.width = 800;
gameCanvas.height = 600;

// Save System (Persistent Storage)
let currentPoints = parseInt(localStorage.getItem('grannyPoints')) || 0;
const updateUI = () => {
    const pointDisplay = document.getElementById('point-display');
    const pointDetail = document.getElementById('point-detail');
    if (pointDisplay) pointDisplay.innerText = currentPoints;
    if (pointDetail) pointDetail.innerText = currentPoints;
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

// --- INPUT HANDLERS ---
window.addEventListener("keydown", (e) => inputState[e.key.toLowerCase()] = true);
window.addEventListener("keyup", (e) => inputState[e.key.toLowerCase()] = false);

// Reset all keys to prevent "auto-walking" bug after game over
function clearInputState() {
    Object.keys(inputState).forEach(key => {
        inputState[key] = false;
    });
}

// --- NAVIGATION SYSTEM ---
function navigateTo(targetId) {
    const screens = document.querySelectorAll('.screen-overlay');
    screens.forEach(s => s.classList.add('hidden'));
    
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        gameCanvas.classList.add('hidden'); 
    }
    
    if (targetId === 'none') {
        gameCanvas.classList.remove('hidden');
    }
}

// --- WORLD GENERATION ---
function randomizeLocations() {
    // Reset Entity Positions
    playerEntity.x = worldMap.width / 2;
    playerEntity.y = worldMap.height / 2;
    enemyEntity.x = 200;
    enemyEntity.y = 200;

    // Reset Camera
    gameCamera.x = playerEntity.x - gameCanvas.width / 2;
    gameCamera.y = playerEntity.y - gameCanvas.height / 2;

    // Randomize Door Location
    escapeDoor.x = Math.random() * (worldMap.width - 200);
    escapeDoor.y = Math.random() * (worldMap.height - 200);

    // Randomize Key (Ensure it's far from the door)
    let spawnDistance = 0;
    while (spawnDistance < 1300) {
        escapeKey.x = Math.random() * (worldMap.width - 100);
        escapeKey.y = Math.random() * (worldMap.height - 100);
        spawnDistance = Math.hypot(escapeKey.x - escapeDoor.x, escapeKey.y - escapeDoor.y);
    }
    escapeKey.isCollected = false;
}

// --- GAME CORE LOGIC ---
function startGame(difficulty) {
    const speeds = {
        'practice': 0, 'easy': 2.5, 'normal': 3.8, 
        'hard': 5.5, 'extreme': 7.0, 'scary': 9.5, 'so-extreme': 13.5
    };
    enemyEntity.speed = speeds[difficulty];
    
    clearInputState();
    randomizeLocations();
    navigateTo('none');
    isGameRunning = true;
    requestAnimationFrame(mainLoop);
}

function handleGameOver(message) {
    isGameRunning = false;
    clearInputState();
    alert(message);
    navigateTo('main-menu');
}

function update() {
    if (!isGameRunning) return;

    // Movement WASD
    if (inputState['w'] && playerEntity.y > 0) playerEntity.y -= playerEntity.speed;
    if (inputState['s'] && playerEntity.y < worldMap.height - playerEntity.size) playerEntity.y += playerEntity.speed;
    if (inputState['a'] && playerEntity.x > 0) playerEntity.x -= playerEntity.speed;
    if (inputState['d'] && playerEntity.x < worldMap.width - playerEntity.size) playerEntity.x += playerEntity.speed;

    // Camera follow player
    gameCamera.x = Math.max(0, Math.min(playerEntity.x - gameCanvas.width / 2, worldMap.width - gameCanvas.width));
    gameCamera.y = Math.max(0, Math.min(playerEntity.y - gameCanvas.height / 2, worldMap.height - gameCanvas.height));

    // Key Collection
    if (Math.hypot(playerEntity.x - escapeKey.x, playerEntity.y - escapeKey.y) < 50 && !escapeKey.isCollected) {
        escapeKey.isCollected = true;
        alert("EXIT KEY FOUND!");
    }

    // Door Interaction (Press E)
    if (Math.hypot(playerEntity.x - escapeDoor.x, playerEntity.y - escapeDoor.y) < 110 && inputState['e']) {
        if (escapeKey.isCollected) {
            currentPoints++;
            localStorage.setItem('grannyPoints', currentPoints);
            updateUI();
            handleGameOver("YOU ESCAPED!");
        }
    }

    // AI Chasing
    let distToEnemy = Math.hypot(playerEntity.x - enemyEntity.x, playerEntity.y - enemyEntity.y);
    if (distToEnemy > 0 && enemyEntity.speed > 0) {
        enemyEntity.x += ((playerEntity.x - enemyEntity.x) / distToEnemy) * enemyEntity.speed;
        enemyEntity.y += ((playerEntity.y - enemyEntity.y) / distToEnemy) * enemyEntity.speed;
    }

    // Death Detection
    if (distToEnemy < playerEntity.size) {
        handleGameOver("GAME OVER! CAUGHT BY GRANNY.");
    }
}

// --- RENDERING ---
function renderHUD() {
    // UI Text only (No Radar Map)
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Courier New";
    ctx.fillText("KEY STATUS: " + (escapeKey.isCollected ? "READY" : "MISSING"), 20, 40);
}

function draw() {
    if (!isGameRunning) return;
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    ctx.save();
    ctx.translate(-gameCamera.x, -gameCamera.y);

    // Render Dark Floor
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, worldMap.width, worldMap.height);

    // Render Map Grid Lines
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    for(let i = 0; i <= worldMap.width; i += 200) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldMap.height); ctx.stroke();
    }
    for(let j = 0; j <= worldMap.height; j += 200) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(worldMap.width, j); ctx.stroke();
    }

    // Render Door
    ctx.fillStyle = escapeKey.isCollected ? "#00ff00" : "#331a00";
    ctx.fillRect(escapeDoor.x, escapeDoor.y, escapeDoor.size, escapeDoor.size);
    
    // Render Key (If not collected)
    if (!escapeKey.isCollected) {
        ctx.fillStyle = "gold";
        ctx.beginPath(); ctx.arc(escapeKey.x, escapeKey.y, 15, 0, Math.PI*2); ctx.fill();
    }
    
    // Render Player
    ctx.fillStyle = playerEntity.color;
    ctx.fillRect(playerEntity.x, playerEntity.y, playerEntity.size, playerEntity.size);
    
    // Render Granny
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