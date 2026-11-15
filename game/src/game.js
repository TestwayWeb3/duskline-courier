// The game itself: the state machine (title, playing, paused, won, lost),
// the update loop, crashes, screen shake, and the best score kept across
// nights in this browser.

import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  DELIVERY_QUOTA,
  START_LIVES,
  TRAFFIC_BASE_COUNT,
  TRAFFIC_PER_TIER,
  TIER_TRAFFIC_SPEED,
  DEPOT_PAD_INDEX,
  PALETTE,
} from './config.js';
import { NightCity } from './world.js';
import { CourierDrone } from './drone.js';
import { TrafficSystem } from './traffic.js';
import { ParcelBoard } from './parcels.js';
import { SoundEngine } from './audio.js';
import { Button, ParticleBurst, drawHud, drawTitleScreen, drawPauseScreen, drawEndScreen } from './render.js';

export const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  WON: 'won',
  LOST: 'lost',
};

const BEST_SCORE_KEY = 'duskline-courier-best-score';

export class DusklineGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.city = new NightCity();
    const depot = this.city.pads[DEPOT_PAD_INDEX];
    this.drone = new CourierDrone(depot.x, depot.roof - 60);
    this.traffic = new TrafficSystem();
    this.board = new ParcelBoard(this.city.pads);
    this.sound = new SoundEngine();
    this.state = GAME_STATE.TITLE;
    this.lives = START_LIVES;
    this.time = 0;
    this.shakeSeconds = 0;
    this.shakeStrength = 0;
    this.bursts = [];
    this.bestScore = this.loadBestScore();
    this.muted = false;
    this.lowTimeWarned = false;
    this.startButton = new Button(VIEW_WIDTH / 2 - 170, 528, 340, 56, 'START FLYING');
    this.restartButton = new Button(VIEW_WIDTH / 2 - 170, 528, 340, 56, 'FLY AGAIN');
    this.traffic.reset(TRAFFIC_BASE_COUNT, TIER_TRAFFIC_SPEED[0]);
    this.board.reset();
  }

  loadBestScore() {
    try {
      const stored = window.localStorage.getItem(BEST_SCORE_KEY);
      const parsed = stored === null ? 0 : parseInt(stored, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (error) {
      return 0;
    }
  }

  saveBestScore() {
    if (this.board.score <= this.bestScore) return;
    this.bestScore = this.board.score;
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(this.bestScore));
    } catch (error) {
      // Storage unavailable; the best score simply does not persist.
    }
  }

  startNight() {
    this.sound.unlock();
    this.sound.playClick();
    this.board.reset();
    this.drone.reset();
    this.drone.invulnerableSeconds = 1.5;
    this.traffic.reset(TRAFFIC_BASE_COUNT, TIER_TRAFFIC_SPEED[0]);
    this.lives = START_LIVES;
    this.bursts = [];
    this.shakeSeconds = 0;
    this.lowTimeWarned = false;
    this.state = GAME_STATE.PLAYING;
  }

  endNight(won) {
    this.state = won ? GAME_STATE.WON : GAME_STATE.LOST;
    this.saveBestScore();
    if (won) this.sound.playWin();
    else this.sound.playLose();
    this.sound.stopBoostHum();
  }

  crashDrone() {
    this.lives -= 1;
    this.board.dropCarried();
    this.bursts.push(new ParticleBurst(this.drone.x, this.drone.y, PALETTE.danger, 34, 260));
    this.bursts.push(new ParticleBurst(this.drone.x, this.drone.y, PALETTE.gold, 20, 180));
    this.shakeSeconds = 0.4;
    this.shakeStrength = 10;
    this.sound.playCrash();
    this.sound.stopBoostHum();
    if (this.lives <= 0) {
      this.endNight(false);
    } else {
      this.drone.respawnAfterCrash();
    }
  }

  update(dt, input) {
    this.time += dt;

    if (input.wasPressed('KeyM')) {
      this.muted = !this.muted;
      this.sound.setMuted(this.muted);
    }

    if (this.state === GAME_STATE.TITLE) {
      const clickedStart = input.wasClicked() && this.startButton.contains(input.pointerX, input.pointerY);
      if (input.wasPressed('Enter') || clickedStart) this.startNight();
      return;
    }

    if (this.state === GAME_STATE.WON || this.state === GAME_STATE.LOST) {
      const clickedRestart =
        input.wasClicked() && this.restartButton.contains(input.pointerX, input.pointerY);
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || clickedRestart) this.startNight();
      return;
    }

    if (this.state === GAME_STATE.PAUSED) {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.wasClicked()) {
        this.state = GAME_STATE.PLAYING;
        this.sound.playClick();
      }
      return;
    }

    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      this.state = GAME_STATE.PAUSED;
      this.sound.stopBoostHum();
      return;
    }

    const tier = this.board.tier();
    const trafficTarget = TRAFFIC_BASE_COUNT + TRAFFIC_PER_TIER * tier;
    const trafficSpeed = TIER_TRAFFIC_SPEED[tier];

    let thrust = input.thrustDirection();
    if (thrust.x === 0 && thrust.y === 0 && input.pointerHeld) {
      const dx = input.pointerX - this.drone.x;
      const dy = input.pointerY - this.drone.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 24) {
        thrust = { x: dx / distance, y: dy / distance };
      }
    }
    const boosting = input.isBoostHeld();
    if (boosting && this.drone.boost > 1) this.sound.startBoostHum();
    else this.sound.stopBoostHum();

    this.drone.update(dt, thrust, boosting, this.time);
    this.traffic.update(dt, trafficTarget, trafficSpeed);

    this.board.update(dt, (kind) => {
      if (kind === 'carried') {
        this.board.addPopup(this.drone.x, this.drone.y - 40, 'PARCEL LOST', PALETTE.danger);
      }
      this.sound.playExpire();
    });

    if (this.board.carried && this.board.carried.timeLeft < 5 && this.board.carried.timeLeft > 0) {
      if (!this.lowTimeWarned) {
        this.lowTimeWarned = true;
        this.sound.playTick();
      }
    } else if (!this.board.carried || this.board.carried.timeLeft >= 5) {
      this.lowTimeWarned = false;
    }

    const picked = this.board.tryPickup(this.drone.x, this.drone.y, this.city.pads);
    if (picked) {
      this.drone.carrying = picked;
      this.bursts.push(new ParticleBurst(this.drone.x, this.drone.y, PALETTE.parcel, 16, 140));
      this.sound.playPickup();
      this.lowTimeWarned = false;
    }

    const delivered = this.board.tryDeliver(this.drone.x, this.drone.y, this.city.pads);
    if (delivered) {
      this.drone.carrying = null;
      this.bursts.push(new ParticleBurst(delivered.x, delivered.y, PALETTE.good, 26, 200));
      this.bursts.push(new ParticleBurst(delivered.x, delivered.y, PALETTE.gold, 14, 150));
      this.sound.playDeliver(delivered.combo);
      if (this.board.deliveredCount >= DELIVERY_QUOTA) {
        this.endNight(true);
      }
    }

    if (!this.drone.isInvulnerable()) {
      const hit = this.traffic.checkCollision(this.drone.x, this.drone.y, 16);
      if (hit) this.crashDrone();
    }

    for (const burst of this.bursts) burst.update(dt);
    this.bursts = this.bursts.filter((burst) => !burst.isDone());
    if (this.shakeSeconds > 0) this.shakeSeconds -= dt;
  }

  draw(input) {
    const ctx = this.ctx;
    if (this.state === GAME_STATE.TITLE) {
      const hovered = this.startButton.contains(input.pointerX, input.pointerY);
      drawTitleScreen(ctx, this.city, this.time, this.bestScore, this.startButton, hovered);
      return;
    }

    ctx.save();
    if (this.shakeSeconds > 0) {
      const strength = this.shakeStrength * (this.shakeSeconds / 0.4);
      ctx.translate((Math.random() - 0.5) * 2 * strength, (Math.random() - 0.5) * 2 * strength);
    }

    const highlighted = new Set();
    for (const offer of this.board.offers) highlighted.add(offer.pickupIndex);
    if (this.board.carried) highlighted.add(this.board.carried.destinationIndex);
    this.city.draw(ctx, this.time, highlighted);

    this.board.drawOfferMarkers(ctx, this.city.pads, this.time);
    this.traffic.draw(ctx, this.time);
    this.drone.draw(ctx, this.time);
    for (const burst of this.bursts) burst.draw(ctx);
    this.board.drawDestinationGuide(ctx, this.city.pads, this.drone.x, this.drone.y, this.time);
    this.board.drawPopups(ctx);
    ctx.restore();

    if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.PAUSED) {
      drawHud(ctx, this, this.time);
    }
    if (this.state === GAME_STATE.PAUSED) {
      drawPauseScreen(ctx);
    }
    if (this.state === GAME_STATE.WON || this.state === GAME_STATE.LOST) {
      const hovered = this.restartButton.contains(input.pointerX, input.pointerY);
      drawEndScreen(ctx, this, this.state === GAME_STATE.WON, this.restartButton, hovered);
    }
  }
}
