import { createGame, update, LEVELS, PEN, WIDTH, HEIGHT } from './game.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const levelNumber = document.querySelector('#level-number');
const levelCount = document.querySelector('#level-count');
const levelName = document.querySelector('#level-name');
const count = document.querySelector('#count');
const complete = document.querySelector('#complete');
const next = document.querySelector('#next');
const hint = document.querySelector('#field-hint');
const keys = new Set();
let game = createGame();
let lastTime = 0;
let pointerDown = false;

function start(index) {
  game = createGame(index);
  keys.clear();
  complete.hidden = true;
  levelNumber.textContent = String(index + 1).padStart(2, '0');
  levelCount.textContent = `${index + 1} / ${LEVELS.length}`;
  levelName.textContent = game.level.name;
  updateCount();
}

function updateCount() {
  count.textContent = `${game.sheep.filter(s => s.penned).length} / ${game.sheep.length}`;
}

function setTarget(event) {
  const bounds = canvas.getBoundingClientRect();
  game.target = {
    x: Math.max(0, Math.min(WIDTH, (event.clientX - bounds.left) * WIDTH / bounds.width)),
    y: Math.max(0, Math.min(HEIGHT, (event.clientY - bounds.top) * HEIGHT / bounds.height)),
  };
  hint.classList.add('dismissed');
}

canvas.addEventListener('pointerdown', event => {
  if (game.complete) return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  pointerDown = true;
  canvas.setPointerCapture(event.pointerId);
  setTarget(event);
});
canvas.addEventListener('pointermove', event => { if (pointerDown) setTarget(event); });
canvas.addEventListener('pointerup', () => { pointerDown = false; });
canvas.addEventListener('pointercancel', () => { pointerDown = false; });
window.addEventListener('blur', () => { keys.clear(); pointerDown = false; });

const keyNames = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'z', 'q']);
window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (!keyNames.has(key) || game.complete) return;
  event.preventDefault();
  keys.add(key);
  hint.classList.add('dismissed');
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
document.querySelector('#restart').addEventListener('click', () => start(game.index));
next.addEventListener('click', () => start(game.index + 1 < LEVELS.length ? game.index + 1 : 0));

function ellipse(x, y, rx, ry, color, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function roundedRect(x, y, w, h, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function drawGround() {
  const palette = game.index < 2 ? ['#b9d1a2', '#a8c695', '#c8dbb1'] : game.index < 4 ? ['#c5d5a5', '#b3c998', '#d2dfb6'] : ['#d3d4a0', '#c3c892', '#e0dfb1'];
  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ellipse(165, 80, 225, 85, palette[1], -.2);
  ellipse(740, 530, 260, 100, palette[1], -.1);
  ellipse(520, 80, 210, 80, palette[2], .1);
  ellipse(110, 510, 200, 80, palette[2], -.2);
  // Fixed, deterministic details keep the field stable while the animals move.
  for (let i = 0; i < 95; i++) {
    const x = 20 + ((i * 173 + 37) % 960), y = 18 + ((i * 109 + 71) % 560);
    ctx.strokeStyle = i % 4 === 0 ? '#e5e9c5' : '#92b483';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x + 3, y - 2); ctx.stroke();
    if (i % 9 === 0) {
      ellipse(x, y - 4, 2, 2, '#fff3d4');
      ellipse(x + 3, y - 3, 1.5, 1.5, '#eab985');
    }
  }
  ctx.strokeStyle = '#e5e8c1'; ctx.lineWidth = 3; ctx.setLineDash([5, 12]);
  ctx.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24); ctx.setLineDash([]);
}

function drawPen() {
  roundedRect(PEN.x, PEN.y, PEN.w, PEN.h, 12, '#d6c99b');
  roundedRect(PEN.x + 10, PEN.y + 10, PEN.w - 20, PEN.h - 20, 6, '#e0d7ae');
  for (let i = 0; i < 20; i++) ellipse(PEN.x + 19 + (i * 49 % 130), PEN.y + 20 + (i * 67 % 130), 2, 1, '#cbbd8c');
  ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = '#9b7652';
  ctx.beginPath();
  ctx.moveTo(PEN.x, PEN.y + PEN.h); ctx.lineTo(PEN.x, PEN.y); ctx.lineTo(PEN.x + PEN.w, PEN.y);
  ctx.lineTo(PEN.x + PEN.w, PEN.y + PEN.h); ctx.lineTo(PEN.gateRight, PEN.y + PEN.h);
  ctx.moveTo(PEN.gateLeft, PEN.y + PEN.h); ctx.lineTo(PEN.x, PEN.y + PEN.h); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = '#dec29a';
  ctx.beginPath();
  ctx.moveTo(PEN.x + 2, PEN.y + PEN.h - 3); ctx.lineTo(PEN.x + 2, PEN.y + 2); ctx.lineTo(PEN.x + PEN.w - 2, PEN.y + 2);
  ctx.lineTo(PEN.x + PEN.w - 2, PEN.y + PEN.h - 3); ctx.stroke();
  for (const [x, y] of [[PEN.x,PEN.y],[PEN.x+PEN.w,PEN.y],[PEN.x,PEN.y+PEN.h],[PEN.gateLeft,PEN.y+PEN.h],[PEN.gateRight,PEN.y+PEN.h],[PEN.x+PEN.w,PEN.y+PEN.h]]) {
    roundedRect(x - 5, y - 6, 10, 12, 3, '#876548');
  }
  ctx.fillStyle = '#927856'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.letterSpacing = '1px';
  ctx.fillText('LA MAISON', PEN.x + PEN.w / 2, PEN.y + 26);
}

function drawObstacle(obstacle) {
  const { x, y, r, type } = obstacle;
  ellipse(x + 5, y + r * .65, r * 1.05, r * .38, '#78996d55');
  if (type === 'rock') {
    ellipse(x, y, r, r * .72, '#9ba696', -.15);
    ellipse(x - r * .15, y - r * .18, r * .7, r * .46, '#b8c0ab', -.2);
    ellipse(x - r * .25, y - r * .28, r * .22, r * .08, '#d6dac4', -.2);
  } else {
    if (type === 'tree') roundedRect(x - 6, y + r * .15, 12, r * .7, 4, '#896c4c');
    const dark = type === 'tree' ? '#769c6a' : '#87aa75';
    const light = type === 'tree' ? '#92b67c' : '#a1c18b';
    ellipse(x, y, r, r * .83, dark);
    ellipse(x - r * .25, y - r * .25, r * .7, r * .58, light);
    ellipse(x + r * .3, y - r * .18, r * .55, r * .48, light);
    if (game.index >= 2 && game.index < 4 && type === 'tree') {
      for (const [dx, dy] of [[-.35,0],[.35,.15],[0,-.4]]) ellipse(x + r * dx, y + r * dy, 3.5, 3.5, '#d88e6e');
    }
  }
}

function drawSheep(sheep) {
  const { x, y } = sheep;
  ellipse(x + 2, y + 10, 15, 5, '#66865c55');
  const angle = Math.hypot(sheep.vx, sheep.vy) > 5 ? Math.atan2(sheep.vy, sheep.vx) : .15;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ellipse(0, 0, 13, 10, '#f8f6e8');
  for (const [sx, sy] of [[-8,-5],[-3,-8],[4,-7],[8,-3],[-8,4],[-2,7],[5,6]]) ellipse(sx, sy, 5, 5, '#fffdf0');
  ellipse(10, 0, 6, 5, '#776e61');
  ellipse(9, -5, 3, 2, '#776e61', -.4); ellipse(9, 5, 3, 2, '#776e61', .4);
  ellipse(12, -2, 1, 1, '#fff');
  ctx.restore();
}

function drawDog(dog) {
  ellipse(dog.x + 2, dog.y + 12, 16, 6, '#68825e66');
  ctx.save(); ctx.translate(dog.x, dog.y); ctx.rotate(dog.angle);
  ellipse(-12, 0, 9, 4, '#8b5a3b');
  ellipse(-2, 0, 15, 10, '#b87d51');
  ellipse(-4, 0, 7, 7, '#f5e4bd');
  ellipse(9, 0, 9, 8, '#b87d51');
  ellipse(7, -8, 6, 4, '#774d38', -.45);
  ellipse(7, 8, 6, 4, '#774d38', .45);
  ellipse(16, 0, 3, 3, '#473c32');
  ellipse(11, -4, 1.4, 1.4, '#352f2a');
  ctx.restore();
}

function draw() {
  drawGround();
  drawPen();
  const objects = [...game.level.obstacles.map(obstacle => ({ y: obstacle.y + obstacle.r * .5, draw: () => drawObstacle(obstacle) })),
    ...game.sheep.map(sheep => ({ y: sheep.y, draw: () => drawSheep(sheep) })),
    { y: game.dog.y, draw: () => drawDog(game.dog) }];
  objects.sort((a, b) => a.y - b.y).forEach(object => object.draw());
}

function frame(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;
  lastTime = timestamp;
  const keyboard = {
    x: Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a') || keys.has('q')),
    y: Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w') || keys.has('z')),
  };
  const wasComplete = game.complete;
  update(game, dt, keyboard);
  updateCount();
  if (!wasComplete && game.complete) {
    const final = game.index === LEVELS.length - 1;
    document.querySelector('#complete-title').textContent = final ? 'Quel talent de berger !' : 'Tout le monde est rentré.';
    document.querySelector('#complete-message').textContent = final ? 'Tu as traversé tous les prés. Bravo !' : 'Une belle journée pour être berger.';
    next.firstChild.textContent = final ? 'Rejouer ' : 'Niveau suivant ';
    complete.hidden = false;
    next.focus({ preventScroll: true });
  }
  draw();
  requestAnimationFrame(frame);
}

start(0);
requestAnimationFrame(frame);
