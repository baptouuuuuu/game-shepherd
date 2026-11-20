import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, update, LEVELS, DOG_SPEED, PEN } from '../src/game.js';

test('six levels cover three distinct maps', () => {
  assert.equal(LEVELS.length, 6);
  assert.equal(new Set(LEVELS.map(level => level.map)).size, 3);
  for (let i = 0; i < LEVELS.length; i++) assert.equal(createGame(i).sheep.length, LEVELS[i].sheep);
});

test('dog accelerates, respects maximum speed and retains inertia', () => {
  const game = createGame();
  game.target = { x: 700, y: 460 };
  update(game, 0.05);
  assert.ok(game.dog.vx > 0 && game.dog.vx < DOG_SPEED);
  for (let i = 0; i < 30; i++) update(game, 0.05);
  assert.ok(Math.hypot(game.dog.vx, game.dog.vy) <= DOG_SPEED + 1e-8);
  const before = game.dog.vx;
  game.target = { x: 0, y: game.dog.y };
  update(game, 0.05);
  assert.ok(game.dog.vx < before && game.dog.vx > 0);
});

test('sheep flee the dog, interact with neighbors and avoid obstacles', () => {
  const game = createGame();
  game.level = { ...game.level, obstacles: [] };
  game.sheep = [{ x: 500, y: 300, vx: 0, vy: 0, r: 12, phase: 0, penned: false }];
  game.dog.x = 450; game.dog.y = 300;
  update(game, 0.05);
  assert.ok(game.sheep[0].vx > 0);

  const flock = createGame();
  flock.level = { ...flock.level, obstacles: [] };
  flock.dog.x = 0; flock.dog.y = 0;
  flock.sheep = [{ x: 500, y: 300, vx: 0, vy: 0, r: 12, phase: 0, penned: false }, { x: 510, y: 300, vx: 0, vy: 0, r: 12, phase: 0, penned: false }];
  update(flock, 0.05);
  assert.ok(flock.sheep[0].vx < 0);

  const terrain = createGame();
  terrain.level = { ...terrain.level, obstacles: [{ x: 500, y: 300, r: 30 }] };
  terrain.dog.x = 0; terrain.dog.y = 0;
  terrain.sheep = [{ x: 530, y: 300, vx: -10, vy: 0, r: 12, phase: 0, penned: false }];
  update(terrain, 0.05);
  assert.ok(Math.hypot(terrain.sheep[0].x - 500, terrain.sheep[0].y - 300) >= 42 - 1e-8);
});

test('pen walls block animals while the opening admits and counts them', () => {
  const game = createGame();
  game.level = { ...game.level, obstacles: [] };
  game.dog.x = 100; game.dog.y = 500;
  game.sheep = [{ x: PEN.x + 20, y: PEN.y + PEN.h + 12, vx: 0, vy: -80, r: 12, phase: 0, penned: false }];
  update(game, 0.05);
  assert.equal(game.sheep[0].penned, false);
  assert.ok(game.sheep[0].y >= PEN.y + PEN.h + 12 - 1e-8);
  game.sheep[0].x = (PEN.gateLeft + PEN.gateRight) / 2;
  game.sheep[0].y = PEN.y + PEN.h + 12;
  game.sheep[0].vy = -80;
  for (let i = 0; i < 30 && !game.complete; i++) update(game, 0.05);
  assert.equal(game.sheep[0].penned, true);
  assert.equal(game.complete, true);
});
