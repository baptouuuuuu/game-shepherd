export const WIDTH = 1000;
export const HEIGHT = 600;
export const PEN = { x: 790, y: 65, w: 165, h: 175, gateLeft: 835, gateRight: 910 };
export const DOG_SPEED = 155;

const wall = (x, y, w, h) => ({ x, y, w, h });
export const PEN_WALLS = [
  wall(PEN.x, PEN.y, PEN.w, 8),
  wall(PEN.x, PEN.y, 8, PEN.h),
  wall(PEN.x + PEN.w - 8, PEN.y, 8, PEN.h),
  wall(PEN.x, PEN.y + PEN.h - 8, PEN.gateLeft - PEN.x, 8),
  wall(PEN.gateRight, PEN.y + PEN.h - 8, PEN.x + PEN.w - PEN.gateRight, 8),
];

export const LEVELS = [
  { name: 'La prairie tranquille', map: 'La prairie', sheep: 4, obstacles: [{ x: 330, y: 175, r: 39, type: 'tree' }, { x: 575, y: 410, r: 29, type: 'bush' }] },
  { name: 'Un peu de compagnie', map: 'La prairie', sheep: 6, obstacles: [{ x: 270, y: 175, r: 38, type: 'tree' }, { x: 535, y: 340, r: 35, type: 'bush' }, { x: 390, y: 475, r: 28, type: 'bush' }] },
  { name: 'Le verger fleuri', map: 'Le verger', sheep: 5, obstacles: [{ x: 300, y: 175, r: 44, type: 'tree' }, { x: 510, y: 270, r: 42, type: 'tree' }, { x: 315, y: 430, r: 37, type: 'tree' }] },
  { name: 'Entre les pommiers', map: 'Le verger', sheep: 7, obstacles: [{ x: 260, y: 160, r: 39, type: 'tree' }, { x: 455, y: 310, r: 42, type: 'tree' }, { x: 290, y: 465, r: 37, type: 'tree' }, { x: 650, y: 435, r: 33, type: 'tree' }] },
  { name: 'Les collines dorées', map: 'Les collines', sheep: 6, obstacles: [{ x: 325, y: 210, r: 42, type: 'rock' }, { x: 550, y: 360, r: 47, type: 'rock' }, { x: 300, y: 470, r: 30, type: 'bush' }] },
  { name: 'Le grand rassemblement', map: 'Les collines', sheep: 8, obstacles: [{ x: 275, y: 180, r: 43, type: 'rock' }, { x: 480, y: 260, r: 38, type: 'bush' }, { x: 370, y: 440, r: 43, type: 'rock' }, { x: 650, y: 430, r: 38, type: 'bush' }] },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const length = (x, y) => Math.hypot(x, y);

function limit(x, y, max) {
  const magnitude = length(x, y);
  return magnitude > max ? { x: x * max / magnitude, y: y * max / magnitude } : { x, y };
}

function moveBody(body, dt, obstacles) {
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  body.x = clamp(body.x, body.r, WIDTH - body.r);
  body.y = clamp(body.y, body.r, HEIGHT - body.r);
  for (const obstacle of obstacles) {
    let dx = body.x - obstacle.x;
    let dy = body.y - obstacle.y;
    let distance = length(dx, dy);
    const minDistance = body.r + obstacle.r;
    if (distance < minDistance) {
      if (distance === 0) { dx = 1; dy = 0; distance = 1; }
      const nx = dx / distance, ny = dy / distance;
      body.x = obstacle.x + nx * minDistance;
      body.y = obstacle.y + ny * minDistance;
      const inward = body.vx * nx + body.vy * ny;
      if (inward < 0) { body.vx -= inward * nx; body.vy -= inward * ny; }
    }
  }
  for (const rect of PEN_WALLS) {
    const nearX = clamp(body.x, rect.x, rect.x + rect.w);
    const nearY = clamp(body.y, rect.y, rect.y + rect.h);
    let dx = body.x - nearX, dy = body.y - nearY;
    let distance = length(dx, dy);
    if (distance < body.r) {
      if (distance === 0) {
        const sides = [
          { d: body.x - rect.x, x: -1, y: 0 },
          { d: rect.x + rect.w - body.x, x: 1, y: 0 },
          { d: body.y - rect.y, x: 0, y: -1 },
          { d: rect.y + rect.h - body.y, x: 0, y: 1 },
        ].sort((a, b) => a.d - b.d);
        const side = sides[0];
        body.x += side.x * (side.d + body.r);
        body.y += side.y * (side.d + body.r);
        dx = side.x; dy = side.y; distance = 1;
      } else {
        body.x += dx / distance * (body.r - distance);
        body.y += dy / distance * (body.r - distance);
      }
      const nx = dx / distance, ny = dy / distance;
      const inward = body.vx * nx + body.vy * ny;
      if (inward < 0) { body.vx -= inward * nx; body.vy -= inward * ny; }
    }
  }
}

export function createGame(index = 0) {
  const level = LEVELS[index];
  if (!level) throw new RangeError('Niveau inconnu');
  const positions = [[390,310],[435,350],[355,365],[465,295],[390,415],[520,220],[550,500],[205,350]];
  return {
    index, level, time: 0, complete: false,
    dog: { x: 140, y: 460, vx: 0, vy: 0, r: 15, angle: -0.5 },
    target: null,
    sheep: positions.slice(0, level.sheep).map(([x, y], i) => ({ x, y, vx: 0, vy: 0, r: 12, phase: i * 2.4, penned: false })),
  };
}

export function update(game, dt, keyboard = { x: 0, y: 0 }) {
  if (game.complete) return;
  dt = clamp(dt, 0, 0.05);
  game.time += dt;
  const dog = game.dog;
  let dx = keyboard.x, dy = keyboard.y;
  let desiredSpeed = DOG_SPEED;
  if (dx || dy) {
    game.target = null;
  } else if (game.target) {
    dx = game.target.x - dog.x;
    dy = game.target.y - dog.y;
    desiredSpeed = DOG_SPEED * Math.min(1, length(dx, dy) / 55);
  }
  const distance = length(dx, dy);
  const desired = distance > 1 ? { x: dx / distance * desiredSpeed, y: dy / distance * desiredSpeed } : { x: 0, y: 0 };
  const acceleration = limit(desired.x - dog.vx, desired.y - dog.vy, 360 * dt);
  dog.vx += acceleration.x; dog.vy += acceleration.y;
  const velocity = limit(dog.vx, dog.vy, DOG_SPEED);
  dog.vx = velocity.x; dog.vy = velocity.y;
  moveBody(dog, dt, game.level.obstacles);
  if (length(dog.vx, dog.vy) > 5) dog.angle = Math.atan2(dog.vy, dog.vx);

  for (const sheep of game.sheep) {
    if (sheep.penned) continue;
    let fx = Math.cos(game.time * 0.45 + sheep.phase) * 7;
    let fy = Math.sin(game.time * 0.38 + sheep.phase) * 7;
    const dogX = sheep.x - dog.x, dogY = sheep.y - dog.y;
    const dogDistance = length(dogX, dogY);
    if (dogDistance < 155 && dogDistance > 0) {
      const force = (1 - dogDistance / 155) * 300 + 30;
      fx += dogX / dogDistance * force; fy += dogY / dogDistance * force;
    }
    let centerX = 0, centerY = 0, neighbors = 0;
    for (const other of game.sheep) {
      if (other === sheep || other.penned) continue;
      const ox = sheep.x - other.x, oy = sheep.y - other.y;
      const d = length(ox, oy);
      if (d > 0 && d < 38) { fx += ox / d * (38 - d) * 4; fy += oy / d * (38 - d) * 4; }
      if (d < 175) { centerX += other.x; centerY += other.y; neighbors++; }
    }
    if (neighbors) {
      fx += (centerX / neighbors - sheep.x) * 0.18;
      fy += (centerY / neighbors - sheep.y) * 0.18;
    }
    for (const obstacle of game.level.obstacles) {
      const ox = sheep.x - obstacle.x, oy = sheep.y - obstacle.y;
      const d = length(ox, oy), range = obstacle.r + 55;
      if (d > 0 && d < range) { fx += ox / d * (range - d) * 2; fy += oy / d * (range - d) * 2; }
    }
    sheep.vx += (fx - sheep.vx * 1.8) * dt;
    sheep.vy += (fy - sheep.vy * 1.8) * dt;
    const speed = limit(sheep.vx, sheep.vy, 95);
    sheep.vx = speed.x; sheep.vy = speed.y;
    moveBody(sheep, dt, game.level.obstacles);
    if (sheep.x > PEN.x + 14 && sheep.x < PEN.x + PEN.w - 14 && sheep.y > PEN.y + 14 && sheep.y < PEN.y + PEN.h - 14) {
      sheep.penned = true;
      sheep.vx = sheep.vy = 0;
    }
  }
  game.complete = game.sheep.every(sheep => sheep.penned);
}
