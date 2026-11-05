var gameContainer = document.getElementById('gameContainer');
var playerEl = document.getElementById('player');
var finishEl = document.getElementById('finish');

var selectedMap = '';
var startTime = null;
var elapsedTime = 0;
var lives = 5;

var playerPosition = { x: 0, y: 0 };
var monstersHit = 0;
var trapsHit = 0;
var inSafeZone = false;

var timerRAF = null;
var spawnTimer = null;
var monsterIntervals = [];
var trapIntervals = [];

function selectMap(mapName, mapImage) {
  selectedMap = mapName;

  var img = document.getElementById('mapImage');
  img.src = mapImage;
  img.style.display = 'block';

  document.getElementById('gameSelectionScreen').style.display = 'none';
  document.getElementById('inputScreen').style.display = 'block';
}

function startGame() {
  var name = document.getElementById('playerName').value;
  if (name) {
  } else {
    alert('Пожалуйста, введите ваше имя.');
    return;
  }

  lives = 5;
  monstersHit = 0;
  trapsHit = 0;
  elapsedTime = 0;
  inSafeZone = false;
  playerPosition = { x: 0, y: 0 };
  playerEl.style.left = '0px';
  playerEl.style.top = '0px';

  document.getElementById('playerDisplay').innerText = name;
  document.getElementById('livesCounter').innerText = lives;
  document.getElementById('elapsedTime').innerText = '00:00';
  document.getElementById('zoneStatus').innerText = 'Зона: открыто';

  var mapSrc = document.getElementById('mapImage').src;
  gameContainer.style.backgroundImage = "url('" + mapSrc + "')";

  clearField();
  clearAllTimers();

  document.getElementById('inputScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';

  startTime = new Date();
  updateGame();
  startSpawning();
  window.focus();
}

function updateGame() {
  var now = new Date();
  elapsedTime = Math.floor((now - startTime) / 1000);

  var minutes = Math.floor(elapsedTime / 60);
  var seconds = elapsedTime % 60;

  document.getElementById('elapsedTime').innerText =
    (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  document.getElementById('currentTime').innerText = now.toLocaleTimeString();

  timerRAF = requestAnimationFrame(updateGame);
}

function clearAllTimers() {
  if (timerRAF) cancelAnimationFrame(timerRAF);
  if (spawnTimer) clearInterval(spawnTimer);
  monsterIntervals.forEach(function (id) { clearInterval(id); });
  trapIntervals.forEach(function (id) { clearInterval(id); });
  monsterIntervals = [];
  trapIntervals = [];
  timerRAF = null;
  spawnTimer = null;
}

function startSpawning() {
  for (var i = 0; i < 5; i++) {
    spawnMonster();
  }
  for (var j = 0; j < 3; j++) {
    spawnTrap();
  }

  spawnTimer = setInterval(function () {
    for (var i = 0; i < 2; i++) {
      spawnMonster();
    }
    if (document.querySelectorAll('.trap').length < 6) {
      spawnTrap();
    }
  }, 3000);
}

function spawnMonster() {
  var monster = document.createElement('div');
  monster.className = 'monster';
  monster.style.left = Math.random() * (gameContainer.clientWidth - 20) + 'px';
  monster.style.top = Math.random() * (gameContainer.clientHeight - 20) + 'px';
  gameContainer.appendChild(monster);
  moveMonster(monster);
}

function spawnTrap() {
  var trap = document.createElement('div');
  trap.className = 'trap';
  trap.style.left = Math.random() * (gameContainer.clientWidth - 40) + 'px';
  trap.style.top = Math.random() * (gameContainer.clientHeight - 40) + 'px';
  gameContainer.appendChild(trap);
}

function moveMonster(monster) {
  var direction = Math.random() * 2 * Math.PI;
  var dx = Math.cos(direction) * 1;
  var dy = Math.sin(direction) * 1;

  var interval = setInterval(function () {
    if (!monster.isConnected) {
      clearInterval(interval);
      return;
    }

    var currentX = parseFloat(monster.style.left);
    var currentY = parseFloat(monster.style.top);

    var newX = currentX + dx;
    var newY = currentY + dy;

    if (newX < 0 || newX > gameContainer.clientWidth - 20) dx = -dx;
    if (newY < 0 || newY > gameContainer.clientHeight - 20) dy = -dy;

    newX = Math.max(0, Math.min(newX, gameContainer.clientWidth - 20));
    newY = Math.max(0, Math.min(newY, gameContainer.clientHeight - 20));

    monster.style.left = newX + 'px';
    monster.style.top = newY + 'px';

    checkCollisionWithPlayer(monster, 'monster');
  }, 100);

  monsterIntervals.push(interval);
}

function movePlayer(dx, dy) {
  if (!startTime) return;

  playerPosition.x += dx;
  playerPosition.y += dy;

  var maxX = gameContainer.clientWidth - playerEl.clientWidth;
  var maxY = gameContainer.clientHeight - playerEl.clientHeight;

  if (playerPosition.x < 0) playerPosition.x = 0;
  if (playerPosition.x > maxX) playerPosition.x = maxX;
  if (playerPosition.y < 0) playerPosition.y = 0;
  if (playerPosition.y > maxY) playerPosition.y = maxY;

  playerEl.style.left = playerPosition.x + 'px';
  playerEl.style.top = playerPosition.y + 'px';

  updateZoneStatus();
  checkFinish();
}

document.addEventListener('keydown', function (event) {
  if (document.getElementById('gameScreen').style.display !== 'block') return;
  switch (event.key) {
    case 'ArrowUp':
      movePlayer(0, -5);
      event.preventDefault();
      break;
    case 'ArrowDown':
      movePlayer(0, 5);
      event.preventDefault();
      break;
    case 'ArrowLeft':
      movePlayer(-5, 0);
      event.preventDefault();
      break;
    case 'ArrowRight':
      movePlayer(5, 0);
      event.preventDefault();
      break;
  }
});

function isPlayerInSafeZone() {
  var p = playerEl.getBoundingClientRect();
  var result = false;

  document.querySelectorAll('.trap').forEach(function (zone) {
    var z = zone.getBoundingClientRect();
    var overlap = !(
      z.left > p.right ||
      z.right < p.left ||
      z.top > p.bottom ||
      z.bottom < p.top
    );
    if (overlap) result = true;
  });

  return result;
}

function updateZoneStatus() {
  var now = isPlayerInSafeZone();

  if (now && !inSafeZone) {
    trapsHit++;
  }
  inSafeZone = now;

  document.getElementById('zoneStatus').innerText =
    now ? 'Зона: укрытие' : 'Зона: открыто';
}

function checkCollisionWithPlayer(object, type) {
  if (!startTime) return;

  if (type === 'monster' && isPlayerInSafeZone()) return;

  var rect1 = playerEl.getBoundingClientRect();
  var rect2 = object.getBoundingClientRect();

  var overlap = !(
    rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top
  );

  if (overlap) {
    object.remove();

    if (type === 'monster') {
      monstersHit++;
    }

    lives--;
    document.getElementById('livesCounter').innerText = Math.max(lives, 0);

    if (lives <= 0) {
      endGame(false);
    }
  }
}

function checkFinish() {
  var p = playerEl.getBoundingClientRect();
  var f = finishEl.getBoundingClientRect();

  var overlap = !(
    f.left > p.right ||
    f.right < p.left ||
    f.top > p.bottom ||
    f.bottom < p.top
  );

  if (overlap) {
    endGame(true);
  }
}

function endGame(win) {
  clearAllTimers();

  document.getElementById('resultTitle').innerText =
    win ? 'Вы победили!' : 'Игра окончена';
  document.getElementById('resName').innerText =
    document.getElementById('playerDisplay').innerText;
  document.getElementById('resTime').innerText =
    document.getElementById('elapsedTime').innerText;
  document.getElementById('resMonsters').innerText = monstersHit;
  document.getElementById('resTraps').innerText = trapsHit;
  document.getElementById('resLives').innerText = Math.max(lives, 0);

  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'block';
}

function restartGame() {
  document.getElementById('resultScreen').style.display = 'none';
  document.getElementById('gameSelectionScreen').style.display = 'block';
  document.getElementById('inputScreen').style.display = 'none';
  document.getElementById('playerName').value = '';
  selectedMap = '';
  startTime = null;
  inSafeZone = false;
  clearField();
  clearAllTimers();
}

function clearField() {
  document.querySelectorAll('.monster, .trap').forEach(function (el) {
    el.remove();
  });
}