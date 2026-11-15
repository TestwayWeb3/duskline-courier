// Sky traffic: delivery and commuter drones crossing the city in fixed
// lanes. Their paths are steady and readable, so a careful courier can
// always find a gap, and every drone carries a warning light.

import {
  VIEW_WIDTH,
  TRAFFIC_LANES,
  TRAFFIC_MIN_SPEED,
  TRAFFIC_MAX_SPEED,
  TRAFFIC_RADIUS,
  PALETTE,
} from './config.js';

export class TrafficDrone {
  constructor(laneY, direction, speed, x) {
    this.y = laneY;
    this.direction = direction;
    this.speed = speed;
    this.x = x;
    this.radius = TRAFFIC_RADIUS;
    this.blinkPhase = Math.random() * Math.PI * 2;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.x += this.direction * this.speed * dt;
    this.bobPhase += dt * 2;
  }

  isOffScreen() {
    return this.x < -60 || this.x > VIEW_WIDTH + 60;
  }

  draw(ctx, time) {
    const bob = Math.sin(this.bobPhase) * 3;
    const y = this.y + bob;
    const blink = Math.sin(time * 6 + this.blinkPhase) > 0;
    ctx.save();
    ctx.translate(this.x, y);
    if (this.direction < 0) ctx.scale(-1, 1);

    ctx.fillStyle = PALETTE.rotor;
    ctx.fillRect(-26, -13, 18, 3);
    ctx.fillRect(8, -13, 18, 3);
    ctx.fillStyle = PALETTE.trafficDark;
    ctx.fillRect(-20, -11, 3, 7);
    ctx.fillRect(17, -11, 3, 7);

    ctx.fillStyle = PALETTE.trafficBody;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.trafficDark;
    ctx.beginPath();
    ctx.ellipse(0, 3, 19, 7, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#2b1a33';
    ctx.beginPath();
    ctx.ellipse(5, -2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = blink ? '#ffd24d' : '#7a5a20';
    ctx.beginPath();
    ctx.arc(0, -12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.trafficLight;
    ctx.beginPath();
    ctx.arc(-17, 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class TrafficSystem {
  constructor() {
    this.drones = [];
  }

  reset(targetCount, speedMultiplier) {
    this.drones = [];
    for (let i = 0; i < targetCount; i += 1) {
      this.spawnInitial(speedMultiplier);
    }
  }

  spawnInitial(speedMultiplier) {
    const laneY = TRAFFIC_LANES[Math.floor(Math.random() * TRAFFIC_LANES.length)];
    const direction = Math.random() < 0.5 ? 1 : -1;
    const speed = (TRAFFIC_MIN_SPEED + Math.random() * (TRAFFIC_MAX_SPEED - TRAFFIC_MIN_SPEED)) * speedMultiplier;
    const x = Math.random() * VIEW_WIDTH;
    this.drones.push(new TrafficDrone(laneY, direction, speed, x));
  }

  spawnFromEdge(speedMultiplier) {
    const laneY = TRAFFIC_LANES[Math.floor(Math.random() * TRAFFIC_LANES.length)];
    const direction = Math.random() < 0.5 ? 1 : -1;
    const speed = (TRAFFIC_MIN_SPEED + Math.random() * (TRAFFIC_MAX_SPEED - TRAFFIC_MIN_SPEED)) * speedMultiplier;
    const x = direction > 0 ? -40 : VIEW_WIDTH + 40;
    this.drones.push(new TrafficDrone(laneY, direction, speed, x));
  }

  update(dt, targetCount, speedMultiplier) {
    for (const drone of this.drones) drone.update(dt);
    this.drones = this.drones.filter((drone) => !drone.isOffScreen());
    while (this.drones.length < targetCount) this.spawnFromEdge(speedMultiplier);
  }

  checkCollision(x, y, radius) {
    for (const drone of this.drones) {
      const dx = drone.x - x;
      const dy = drone.y - y;
      const minDistance = drone.radius + radius - 6;
      if (dx * dx + dy * dy < minDistance * minDistance) return drone;
    }
    return null;
  }

  draw(ctx, time) {
    for (const drone of this.drones) drone.draw(ctx, time);
  }
}
