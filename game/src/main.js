// Boot: wire the canvas, the input state and the game together, run the
// fixed-step update loop, and expose the live game for play-testing.

import { VIEW_WIDTH, VIEW_HEIGHT } from './config.js';
import { InputState } from './input.js';
import { DusklineGame } from './game.js';

const canvas = document.getElementById('game-canvas');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const input = new InputState(canvas);
const game = new DusklineGame(canvas);

window.__duskline = game;

let lastTime = performance.now();
let accumulated = 0;
const STEP_SECONDS = 1 / 60;

function frame() {
  // Wall-clock time, not the animation-frame timestamp: under software
  // rendering a frame can arrive late while its timestamp still steps by
  // one vsync, which would run the game in slow motion. performance.now
  // keeps game time honest on slow machines. The one-second cap lets a
  // long hitch catch up in fixed 1/60 s steps (no tunneling, updates are
  // cheap) instead of dropping wall time; beyond a second, time is shed
  // rather than queued, so a stall can never spiral.
  const now = performance.now();
  const elapsed = Math.min(1.0, (now - lastTime) / 1000);
  lastTime = now;
  accumulated += elapsed;
  let ranUpdate = false;
  while (accumulated >= STEP_SECONDS) {
    game.update(STEP_SECONDS, input);
    accumulated -= STEP_SECONDS;
    ranUpdate = true;
  }
  game.draw(input);
  // Only retire edge-triggered presses once an update has had a chance to
  // read them: on a display faster than 60 Hz some frames run no update,
  // and clearing every frame would swallow presses that arrived in those
  // frames. A press is still retired by the first frame that updates, so
  // it can never leak into a later game state.
  if (ranUpdate) input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
