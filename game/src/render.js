// Screens and the HUD: the title screen, pause, win and loss screens,
// the in-play heads-up display, buttons, and the particle bursts that
// answer every pickup, delivery and crash.

import { VIEW_WIDTH, VIEW_HEIGHT, DELIVERY_QUOTA, PALETTE } from './config.js';

export function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export class ParticleBurst {
  constructor(x, y, color, count, speed) {
    this.particles = [];
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        age: 0,
        life: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  update(dt) {
    for (const particle of this.particles) {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 160 * dt;
    }
    this.particles = this.particles.filter((particle) => particle.age < particle.life);
  }

  draw(ctx) {
    for (const particle of this.particles) {
      ctx.globalAlpha = Math.max(0, 1 - particle.age / particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  isDone() {
    return this.particles.length === 0;
  }
}

export class Button {
  constructor(x, y, width, height, label) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.label = label;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
  }

  draw(ctx, hovered) {
    ctx.fillStyle = hovered ? '#ffd97a' : PALETTE.gold;
    roundRect(ctx, this.x, this.y, this.width, this.height, 12);
    ctx.fill();
    ctx.fillStyle = '#1b1740';
    ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2 + 1);
  }
}

export function drawHud(ctx, game, time) {
  const { board, drone, lives } = game;
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 14, 12, 1252, 58, 12);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`SCORE ${board.score}`, 32, 42);

  ctx.fillStyle = board.combo >= 2 ? PALETTE.gold : PALETTE.hudDim;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`COMBO x${board.multiplier()}`, 250, 42);

  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`DELIVERIES ${board.deliveredCount}/${DELIVERY_QUOTA}`, 640, 30);
  const barWidth = 240;
  const barX = 640 - barWidth / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, barX, 48, barWidth, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.good;
  const progress = board.deliveredCount / DELIVERY_QUOTA;
  if (progress > 0) {
    roundRect(ctx, barX, 48, barWidth * progress, 10, 5);
    ctx.fill();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('DRONES', 1078, 30);
  for (let i = 0; i < 3; i += 1) {
    const cx = 1104 + i * 30;
    ctx.fillStyle = i < lives ? PALETTE.gold : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, 30, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('BOOST', 1104, 58);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, 1150, 52, 96, 10, 5);
  ctx.fill();
  ctx.fillStyle = drone.boost > 25 ? '#9ecbff' : PALETTE.danger;
  roundRect(ctx, 1150, 52, 96 * (drone.boost / 100), 10, 5);
  ctx.fill();

  if (board.carried) {
    const carried = board.carried;
    const urgent = carried.timeLeft < 6;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.hudPanel;
    roundRect(ctx, 14, 80, 250, 46, 10);
    ctx.fill();
    ctx.fillStyle = urgent && Math.floor(time * 4) % 2 === 0 ? PALETTE.danger : PALETTE.hudText;
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    const seconds = Math.max(0, carried.timeLeft);
    ctx.fillText(`TO PAD ${game.city.pads[carried.destinationIndex].letter}  ${seconds.toFixed(1)}s`, 30, 104);
  }
}

export function drawTitleScreen(ctx, city, time, bestScore, startButton, hovered) {
  city.draw(ctx, time, new Set());
  ctx.fillStyle = 'rgba(16, 12, 38, 0.45)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.moon;
  ctx.font = 'bold 84px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('DUSKLINE', 640, 168);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 84px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('COURIER', 640, 252);

  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Fly the last light. Carry every parcel home before dawn.', 640, 316);

  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 390, 348, 500, 118, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '20px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('WASD / Arrows — fly      Mouse hold — steer to pointer', 640, 372);
  ctx.fillText('SPACE — boost      P — pause      M — sound', 640, 398);
  ctx.fillText('Pick up parcels at glowing pads and deliver on time.', 640, 424);
  ctx.fillText('Dodge the red traffic drones. 12 deliveries wins the night.', 640, 450);

  if (bestScore > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`BEST SCORE  ${bestScore}`, 640, 500);
  }

  startButton.draw(ctx, hovered);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('or press ENTER', 640, 610);
}

export function drawPauseScreen(ctx) {
  ctx.fillStyle = 'rgba(16, 12, 38, 0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 56px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('PAUSED', 640, 320);
  ctx.font = '24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Press P or click to keep flying', 640, 372);
}

export function drawEndScreen(ctx, game, won, restartButton, hovered) {
  const { board } = game;
  ctx.fillStyle = 'rgba(16, 12, 38, 0.62)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? PALETTE.good : PALETTE.danger;
  ctx.font = 'bold 62px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(won ? 'NIGHT COMPLETE!' : 'NIGHT OVER', 640, 168);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '26px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(
    won ? 'Every parcel home before dawn. The city sleeps easy.' : 'The sky wins this round. The parcels will wait.',
    640,
    216,
  );

  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 430, 248, 420, 190, 14);
  ctx.fill();
  ctx.font = 'bold 24px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`FINAL SCORE  ${board.score}`, 640, 286);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`Deliveries  ${board.deliveredCount} / ${DELIVERY_QUOTA}`, 640, 326);
  ctx.fillText(`On time  ${board.deliveriesOnTime}      Best combo  x${Math.max(1, board.bestCombo)}`, 640, 360);
  ctx.fillText(`Parcels lost  ${board.parcelsExpired}`, 640, 394);
  if (board.score >= game.bestScore && board.score > 0) {
    ctx.fillStyle = PALETTE.good;
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('NEW BEST SCORE!', 640, 424);
  }

  restartButton.draw(ctx, hovered);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '18px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('or press R', 640, 610);
}
