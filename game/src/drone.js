// The courier drone: thrust physics with drag, a boost meter, a rotor
// trail, crash knockback and a short invulnerability blink after a hit.

import {
  VIEW_WIDTH,
  VIEW_HEIGHT,
  GROUND_Y,
  DRONE_RADIUS,
  DRONE_THRUST,
  DRONE_BOOST_MULTIPLIER,
  DRONE_DRAG,
  DRONE_MAX_SPEED,
  DRONE_BOOST_MAX_SPEED,
  BOOST_MAX,
  BOOST_DRAIN_PER_SECOND,
  BOOST_REFILL_PER_SECOND,
  CRASH_INVULNERABLE_SECONDS,
  PALETTE,
} from './config.js';

export class CourierDrone {
  constructor(spawnX, spawnY) {
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    this.reset();
  }

  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.boost = BOOST_MAX;
    this.boosting = false;
    this.invulnerableSeconds = 0;
    this.tilt = 0;
    this.rotorPhase = 0;
    this.trail = [];
    this.carrying = null;
  }

  respawnAfterCrash() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.invulnerableSeconds = CRASH_INVULNERABLE_SECONDS;
    this.carrying = null;
    this.trail = [];
  }

  update(dt, thrust, boosting, time) {
    this.rotorPhase += dt * 30;
    if (this.invulnerableSeconds > 0) this.invulnerableSeconds -= dt;

    const wantBoost = boosting && this.boost > 1;
    this.boosting = wantBoost;
    if (wantBoost) {
      this.boost = Math.max(0, this.boost - BOOST_DRAIN_PER_SECOND * dt);
    } else {
      this.boost = Math.min(BOOST_MAX, this.boost + BOOST_REFILL_PER_SECOND * dt);
    }

    const power = wantBoost ? DRONE_THRUST * DRONE_BOOST_MULTIPLIER : DRONE_THRUST;
    this.vx += thrust.x * power * dt;
    this.vy += thrust.y * power * dt;

    const drag = Math.exp(-DRONE_DRAG * dt);
    this.vx *= drag;
    this.vy *= drag;

    const maxSpeed = wantBoost ? DRONE_BOOST_MAX_SPEED : DRONE_MAX_SPEED;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const minY = 70;
    const maxY = GROUND_Y - 34;
    if (this.x < DRONE_RADIUS) {
      this.x = DRONE_RADIUS;
      this.vx = Math.abs(this.vx) * 0.4;
    }
    if (this.x > VIEW_WIDTH - DRONE_RADIUS) {
      this.x = VIEW_WIDTH - DRONE_RADIUS;
      this.vx = -Math.abs(this.vx) * 0.4;
    }
    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy) * 0.4;
    }
    if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy) * 0.4;
    }

    const targetTilt = Math.max(-0.35, Math.min(0.35, this.vx / 900));
    this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 8);

    this.trail.push({ x: this.x, y: this.y + 8, age: 0 });
    for (const point of this.trail) point.age += dt;
    while (this.trail.length > 0 && this.trail[0].age > 0.35) this.trail.shift();
    return time;
  }

  isInvulnerable() {
    return this.invulnerableSeconds > 0;
  }

  draw(ctx, time) {
    if (this.isInvulnerable() && Math.floor(time * 10) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    for (const point of this.trail) {
      const alpha = 0.25 * (1 - point.age / 0.35);
      ctx.fillStyle = `rgba(255, 207, 92, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6 * (1 - point.age / 0.35) + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    const rotorWobble = Math.sin(this.rotorPhase) * 2;
    ctx.fillStyle = PALETTE.rotor;
    ctx.fillRect(-34, -14 + rotorWobble * 0.2, 22, 3);
    ctx.fillRect(12, -14 - rotorWobble * 0.2, 22, 3);
    ctx.fillStyle = PALETTE.droneDark;
    ctx.fillRect(-26, -12, 3, 8);
    ctx.fillRect(23, -12, 3, 8);

    ctx.fillStyle = PALETTE.droneBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.droneDark;
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 8, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = PALETTE.droneGlass;
    ctx.beginPath();
    ctx.ellipse(6, -3, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff5d6c';
    ctx.beginPath();
    ctx.arc(-20, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ef0d4';
    ctx.beginPath();
    ctx.arc(20, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    if (this.carrying) {
      ctx.fillStyle = PALETTE.parcel;
      ctx.fillRect(-9, 12, 18, 14);
      ctx.fillStyle = PALETTE.parcelDark;
      ctx.fillRect(-9, 12, 18, 4);
      ctx.strokeStyle = '#1b1740';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, 12, 18, 14);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    if (this.boosting) {
      ctx.fillStyle = 'rgba(126, 240, 212, 0.5)';
      ctx.beginPath();
      ctx.moveTo(this.x - 22, this.y + 2);
      ctx.lineTo(this.x - 44 - Math.random() * 10, this.y + 6);
      ctx.lineTo(this.x - 22, this.y + 10);
      ctx.closePath();
      ctx.fill();
    }
  }
}
