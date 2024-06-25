const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 70,
    height: 70,
    speed: 8,
    bullets: [],
    life: 100,
    score: 0,
    shootCooldown: 20
};

const keys = {};
let enemies = [];
let enemyBullets = [];
const enemyImages = [];
let level = 1;
let enemySpeed = 2;
let enemyBulletSpeed = 4;
let enemySpawnInterval = 2000;
let lastEnemySpawn = 0;
let gameTime = 0;

const heroImg = new Image();
heroImg.src = 'hero.png';
heroImg.onerror = () => console.error('Failed to load hero image');

const heroBulletImg = new Image();
heroBulletImg.src = 'hero_bomb.png';
heroBulletImg.onerror = () => console.error('Failed to load hero bullet image');

const enemyBulletImg = new Image();
enemyBulletImg.src = 'enemy_bomb.png';
enemyBulletImg.onerror = () => console.error('Failed to load enemy bullet image');

const enemyData = [
    { src: 'enemy1.png', points: 5, minLevel: 1 },
    { src: 'enemy2.png', points: 10, minLevel: 1 },
    { src: 'enemy3.png', points: 15, minLevel: 1 },
    { src: 'enemy4.png', points: 20, minLevel: 1 },
    { src: 'enemy5.png', points: 25, minLevel: 1 },
    { src: 'enemy6.png', points: 50, minLevel: 4 },
    { src: 'enemy7.png', points: 75, minLevel: 4 },
    { src: 'enemy8.png', points: 100, minLevel: 4 }
];

enemyData.forEach((data, index) => {
    const img = new Image();
    img.src = data.src;
    img.onload = () => enemyImages.push({ img, points: data.points, minLevel: data.minLevel });
    img.onerror = () => console.error(`Failed to load enemy image ${data.src}`);
});

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function drawPlayer() {
    if (heroImg.complete && heroImg.naturalHeight !== 0) {
        ctx.drawImage(heroImg, player.x, player.y, player.width, player.height);
    } else {
        console.error('Hero image is not loaded correctly.');
    }
}

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) player.y += player.speed;
}

function shoot() {
    if (keys[' '] && player.shootCooldown === 0) {
        player.bullets.push({ x: player.x + player.width / 2 - 12.5, y: player.y, width: 25, height: 25 });
        player.shootCooldown = Math.max(10, 20 - Math.floor(level / 5));
    }
}

function drawBullets() {
    player.bullets.forEach((bullet, index) => {
        bullet.y -= 10;
        if (heroBulletImg.complete && heroBulletImg.naturalHeight !== 0) {
            ctx.drawImage(heroBulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            console.error('Hero bullet image is not loaded correctly.');
        }
        if (bullet.y < 0) player.bullets.splice(index, 1);
    });
}

function getEnemyToSpawn() {
    const adjustedRarities = enemyImages
        .filter(enemy => level >= enemy.minLevel)
        .map(enemy => ({
            ...enemy,
            adjustedRarity: Math.max(enemy.points / (level + 1), 1)
        }));
    const totalRarity = adjustedRarities.reduce((sum, enemy) => sum + enemy.adjustedRarity, 0);
    const rand = Math.random() * totalRarity;
    let sum = 0;
    for (let i = 0; i < adjustedRarities.length; i++) {
        sum += adjustedRarities[i].adjustedRarity;
        if (rand < sum) return adjustedRarities[i];
    }
    return adjustedRarities[0];
}

function spawnEnemy() {
    const now = Date.now();
    if (now - lastEnemySpawn > enemySpawnInterval) {
        const enemyToSpawn = getEnemyToSpawn();
        if (enemyToSpawn) {
            const shootCooldown = level >= 5 ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 200) + 50 - level * 2;
            enemies.push({ x: Math.random() * (canvas.width - 70), y: -70, width: 70, height: 70, img: enemyToSpawn.img, points: enemyToSpawn.points, shootCooldown });
            lastEnemySpawn = now;
        }
    }
}

function drawEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemySpeed;
        if (enemy.img.complete && enemy.img.naturalHeight !== 0) {
            ctx.drawImage(enemy.img, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            console.error('Enemy image is not loaded correctly.');
        }
        if (enemy.y > canvas.height) enemies.splice(index, 1);
        if (enemy.shootCooldown === 0) {
            enemyBullets.push({ x: enemy.x + enemy.width / 2 - 12.5, y: enemy.y + enemy.height, width: 25, height: 25 });
            enemy.shootCooldown = level >= 5 ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 100) + 50 - level * 2;
        } else {
            enemy.shootCooldown--;
        }
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.y += enemyBulletSpeed;
        if (enemyBulletImg.complete && enemyBulletImg.naturalHeight !== 0) {
            ctx.drawImage(enemyBulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
        } else {
            console.error('Enemy bullet image is not loaded correctly.');
        }
        if (bullet.y > canvas.height) enemyBullets.splice(index, 1);
    });
}

function checkCollisions() {
    enemies.forEach((enemy, enemyIndex) => {
        player.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemies.splice(enemyIndex, 1);
                player.bullets.splice(bulletIndex, 1);
                player.score += enemy.points;
                document.getElementById('score').innerText = player.score;
            }
        });

        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            gameOver();
        }
    });

    enemyBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            gameOver();
        }
    });
}

function updateLevel() {
    const nextLevelScore = Math.floor(100 * Math.pow(1.5, level - 1));
    if (player.score >= nextLevelScore) {
        level++;
        enemySpeed += 0.5;
        enemyBulletSpeed = Math.min(20, 4 * Math.pow(1.1, level - 1));
        if (level >= 5) {
            enemySpawnInterval = Math.max(100, enemySpawnInterval - 100);
        } else {
            enemySpawnInterval = Math.max(200, enemySpawnInterval - 200);
        }
        document.getElementById('level').innerText = level;
        document.getElementById('level-background').innerText = level;
    }
}

function updateTime() {
    gameTime++;
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    document.getElementById('time').innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function gameOver() {
    const finalScore = player.score + gameTime * 10;
    window.location.href = `gameover.html?score=${player.score}&time=${gameTime}`;
}

function resetGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.bullets = [];
    player.life = 100;
    player.score = 0;
    player.shootCooldown = 20;
    enemies = [];
    enemyBullets = [];
    level = 1;
    enemySpeed = 2;
    enemyBulletSpeed = 4;
    enemySpawnInterval = 2000;
    lastEnemySpawn = 0;
    gameTime = 0;
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = level;
    document.getElementById('level-background').innerText = level;
    document.getElementById('time').innerText = '0:00';
}

function drawLevelBackground() {
    const levelBackground = document.getElementById('level-background');
    const rect = canvas.getBoundingClientRect();
    levelBackground.style.top = `${rect.top + window.scrollY + rect.height / 4}px`;
}

function gameLoop() {
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPlayer();
        movePlayer();
        shoot();
        if (player.shootCooldown > 0) player.shootCooldown--;
        drawBullets();
        spawnEnemy();
        drawEnemies();
        drawEnemyBullets();
        checkCollisions();
        updateLevel();
        drawLevelBackground();
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error("Error in gameLoop:", error);
    }
}

function startGame() {
    setInterval(updateTime, 1000);
    gameLoop();
}

startGame();
