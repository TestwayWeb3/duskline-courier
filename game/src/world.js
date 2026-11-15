// The night city: a seeded skyline, rooftop delivery pads, stars and the
// moon. The layout is fixed by the world seed so every run opens on the
// same readable city.

import { VIEW_WIDTH, VIEW_HEIGHT, GROUND_Y, PALETTE, PAD_DEFS, WORLD_SEED } from './config.js';
import { mulberry32, randomInRange, randomIntInRange } from './random.js';

export class NightCity {
  constructor() {
    const random = mulberry32(WORLD_SEED);
    this.stars = [];
    for (let i = 0; i < 90; i += 1) {
      this.stars.push({
        x: random() * VIEW_WIDTH,
        y: random() * 300,
        radius: randomInRange(random, 0.6, 1.8),
        twinkle: random() * Math.PI * 2,
      });
    }
    this.farBuildings = this.buildSkyline(random, 26, 300, 470, 60, 120);
    this.nearBuildings = this.buildSkyline(random, 15, 430, 610, 90, 170);
    this.pads = PAD_DEFS.map((def, index) => ({
      ...def,
      index,
      beaconPhase: index * 1.1,
      litWindows: this.buildPadWindows(random, def),
    }));
    this.background = this.bakeBackground();
  }

  bakeBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = VIEW_WIDTH;
    canvas.height = VIEW_HEIGHT;
    const ctx = canvas.getContext('2d');
    this.drawSky(ctx, 0, false);
    this.drawSkylineLayer(ctx, this.farBuildings, PALETTE.farBuilding, PALETTE.farWindow, 0.55);
    this.drawSkylineLayer(ctx, this.nearBuildings, PALETTE.nearBuilding, PALETTE.nearWindow, 0.85);
    this.drawGround(ctx);
    return canvas;
  }

  buildSkyline(random, count, topMin, topMax, widthMin, widthMax) {
    const buildings = [];
    let x = -20;
    for (let i = 0; i < count; i += 1) {
      const width = randomInRange(random, widthMin, widthMax);
      const top = randomInRange(random, topMin, topMax);
      const windows = [];
      const cols = Math.max(2, Math.floor(width / 22));
      const rows = Math.max(2, Math.floor((GROUND_Y - top) / 30));
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          if (random() < 0.34) {
            windows.push({
              x: x + 8 + col * ((width - 16) / cols),
              y: top + 12 + row * 28,
              lit: random() < 0.8,
            });
          }
        }
      }
      buildings.push({ x, width, top, windows, antenna: random() < 0.3 });
      x += width + randomInRange(random, 2, 14);
      if (x > VIEW_WIDTH + 40) break;
    }
    return buildings;
  }

  buildPadWindows(random, def) {
    const windows = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        windows.push({ dx: -30 + col * 20, dy: 18 + row * 22, lit: random() < 0.6 });
      }
    }
    return windows;
  }

  drawSky(ctx, time, animate = true) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, PALETTE.skyTop);
    gradient.addColorStop(0.45, PALETTE.skyMid);
    gradient.addColorStop(0.75, PALETTE.skyLow);
    gradient.addColorStop(1, PALETTE.horizon);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    for (const star of this.stars) {
      const alpha = animate ? 0.45 + 0.45 * Math.sin(time * 1.4 + star.twinkle) : 0.75;
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.fillStyle = PALETTE.star;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = PALETTE.moonGlow;
    ctx.beginPath();
    ctx.arc(1085, 108, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.moon;
    ctx.beginPath();
    ctx.arc(1085, 108, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(210, 180, 130, 0.5)';
    ctx.beginPath();
    ctx.arc(1072, 98, 8, 0, Math.PI * 2);
    ctx.arc(1098, 118, 6, 0, Math.PI * 2);
    ctx.arc(1090, 92, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSkylineLayer(ctx, buildings, bodyColor, windowColor, dim) {
    for (const building of buildings) {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(building.x, building.top, building.width, GROUND_Y - building.top);
      if (building.antenna) {
        ctx.fillRect(building.x + building.width / 2 - 1, building.top - 18, 2, 18);
        ctx.fillStyle = '#ff5d6c';
        ctx.beginPath();
        ctx.arc(building.x + building.width / 2, building.top - 19, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const window of building.windows) {
        ctx.fillStyle = window.lit ? windowColor : 'rgba(0,0,0,0.25)';
        ctx.globalAlpha = window.lit ? dim : 1;
        ctx.fillRect(window.x, window.y, 9, 12);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawGround(ctx) {
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
    ctx.fillStyle = 'rgba(232, 128, 74, 0.18)';
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 3);
  }

  drawPad(ctx, pad, time, highlight) {
    const { x, roof } = pad;
    ctx.fillStyle = PALETTE.nearBuilding;
    ctx.fillRect(x - 52, roof, 104, GROUND_Y - roof);
    ctx.fillStyle = PALETTE.roofEdge;
    ctx.fillRect(x - 52, roof, 104, 5);
    for (const window of pad.litWindows) {
      ctx.fillStyle = window.lit ? PALETTE.nearWindow : 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + window.dx, roof + window.dy, 10, 12);
    }
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4 + pad.beaconPhase);
    const beaconAlpha = highlight ? 0.55 + 0.45 * pulse : 0.18 + 0.2 * pulse;
    const beamGradient = ctx.createLinearGradient(0, roof - 130, 0, roof);
    beamGradient.addColorStop(0, 'rgba(126, 240, 212, 0)');
    beamGradient.addColorStop(1, `rgba(126, 240, 212, ${beaconAlpha})`);
    ctx.fillStyle = beamGradient;
    ctx.beginPath();
    ctx.moveTo(x - 10, roof - 130);
    ctx.lineTo(x + 10, roof - 130);
    ctx.lineTo(x + 30, roof);
    ctx.lineTo(x - 30, roof);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = highlight ? pad.color : PALETTE.pad;
    ctx.beginPath();
    ctx.ellipse(x, roof, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = highlight ? '#ffffff' : PALETTE.padEdge;
    ctx.lineWidth = highlight ? 3 : 2;
    ctx.beginPath();
    ctx.ellipse(x, roof, 46, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = highlight ? '#1b1740' : PALETTE.hudText;
    ctx.font = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pad.letter, x, roof - 20);
  }

  draw(ctx, time, highlightedPads) {
    ctx.drawImage(this.background, 0, 0);
    for (const pad of this.pads) {
      this.drawPad(ctx, pad, time, highlightedPads.has(pad.index));
    }
  }
}
