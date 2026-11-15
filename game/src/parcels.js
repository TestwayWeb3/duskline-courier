// Parcels: the offers a courier chooses between, the pickup and delivery
// rules, the payout and combo scoring, and the floating score popups.

import {
  PARCEL_BASE_PAYOUT,
  PARCEL_DISTANCE_BONUS,
  PARCEL_LATE_PAYOUT_FRACTION,
  PARCEL_OFFER_LIFETIME_SECONDS,
  ON_TIME_BONUS_PER_SECOND_LEFT,
  COMBO_MAX_MULTIPLIER,
  MAX_OFFERS,
  TIER_TIME_LIMIT,
  PAD_TOUCH_RADIUS,
} from './config.js';

let parcelIdCounter = 1;

export class ParcelOffer {
  constructor(pickupIndex, destinationIndex, payout, timeLimit, lifetime) {
    this.id = parcelIdCounter;
    parcelIdCounter += 1;
    this.pickupIndex = pickupIndex;
    this.destinationIndex = destinationIndex;
    this.payout = payout;
    this.timeLimit = timeLimit;
    this.lifetime = lifetime;
    this.carried = false;
    this.timeLeft = timeLimit;
  }
}

export class ParcelBoard {
  constructor(pads) {
    this.pads = pads;
    this.offers = [];
    this.carried = null;
    this.deliveredCount = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.score = 0;
    this.popups = [];
    this.deliveriesOnTime = 0;
    this.parcelsExpired = 0;
  }

  reset() {
    this.offers = [];
    this.carried = null;
    this.deliveredCount = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.score = 0;
    this.popups = [];
    this.deliveriesOnTime = 0;
    this.parcelsExpired = 0;
    this.refillOffers(0);
  }

  tier() {
    if (this.deliveredCount >= 8) return 2;
    if (this.deliveredCount >= 4) return 1;
    return 0;
  }

  makeOffer() {
    const count = this.pads.length;
    let pickupIndex = Math.floor(Math.random() * count);
    let destinationIndex = Math.floor(Math.random() * count);
    while (destinationIndex === pickupIndex) {
      destinationIndex = Math.floor(Math.random() * count);
    }
    const from = this.pads[pickupIndex];
    const to = this.pads[destinationIndex];
    const distance = Math.hypot(to.x - from.x, to.roof - from.roof);
    const payout = Math.round(PARCEL_BASE_PAYOUT + distance * PARCEL_DISTANCE_BONUS);
    return new ParcelOffer(
      pickupIndex,
      destinationIndex,
      payout,
      TIER_TIME_LIMIT[this.tier()],
      PARCEL_OFFER_LIFETIME_SECONDS,
    );
  }

  refillOffers() {
    while (this.offers.length < MAX_OFFERS) {
      this.offers.push(this.makeOffer());
    }
  }

  update(dt, onExpire) {
    for (const popup of this.popups) {
      popup.age += dt;
      popup.y -= 34 * dt;
    }
    this.popups = this.popups.filter((popup) => popup.age < 1.2);

    if (this.carried) {
      this.carried.timeLeft -= dt;
      if (this.carried.timeLeft <= -6) {
        this.carried = null;
        this.combo = 0;
        this.parcelsExpired += 1;
        onExpire('carried');
      }
    }
    for (const offer of this.offers) {
      offer.lifetime -= dt;
    }
    const expired = this.offers.filter((offer) => offer.lifetime <= 0);
    if (expired.length > 0) {
      this.offers = this.offers.filter((offer) => offer.lifetime > 0);
      this.parcelsExpired += expired.length;
      onExpire('offer');
      this.refillOffers();
    }
  }

  tryPickup(droneX, droneY, pads) {
    if (this.carried) return null;
    for (const offer of this.offers) {
      const pad = pads[offer.pickupIndex];
      const dx = pad.x - droneX;
      const dy = pad.roof - 8 - droneY;
      if (dx * dx + dy * dy < PAD_TOUCH_RADIUS * PAD_TOUCH_RADIUS) {
        this.offers = this.offers.filter((item) => item.id !== offer.id);
        offer.carried = true;
        offer.timeLeft = offer.timeLimit;
        this.carried = offer;
        this.refillOffers();
        return offer;
      }
    }
    return null;
  }

  tryDeliver(droneX, droneY, pads) {
    const carried = this.carried;
    if (!carried) return null;
    const pad = pads[carried.destinationIndex];
    const dx = pad.x - droneX;
    const dy = pad.roof - 8 - droneY;
    if (dx * dx + dy * dy >= PAD_TOUCH_RADIUS * PAD_TOUCH_RADIUS) return null;

    const onTime = carried.timeLeft > 0;
    if (onTime) {
      this.combo = Math.min(COMBO_MAX_MULTIPLIER, this.combo + 1);
      this.deliveriesOnTime += 1;
    } else {
      this.combo = 0;
    }
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const multiplier = Math.max(1, this.combo);
    let earned = Math.round(carried.payout * (onTime ? 1 : PARCEL_LATE_PAYOUT_FRACTION));
    if (onTime) earned += Math.round(carried.timeLeft * ON_TIME_BONUS_PER_SECOND_LEFT);
    earned *= multiplier;
    this.score += earned;
    this.deliveredCount += 1;
    this.carried = null;
    const result = { earned, onTime, multiplier, x: pad.x, y: pad.roof - 60, combo: this.combo };
    this.addPopup(result.x, result.y, `+${earned}`, onTime ? '#7ef0d4' : '#ffcf5c');
    if (this.combo >= 2) {
      this.addPopup(result.x, result.y - 26, `COMBO x${multiplier}`, '#ffcf5c');
    }
    return result;
  }

  dropCarried() {
    if (!this.carried) return;
    this.carried = null;
    this.combo = 0;
  }

  addPopup(x, y, text, color) {
    this.popups.push({ x, y, text, color, age: 0 });
  }

  multiplier() {
    return Math.max(1, this.combo);
  }

  drawOfferMarkers(ctx, pads, time) {
    for (const offer of this.offers) {
      const pad = pads[offer.pickupIndex];
      const dest = pads[offer.destinationIndex];
      const bob = Math.sin(time * 3 + offer.id) * 4;
      const y = pad.roof - 44 + bob;
      ctx.fillStyle = '#7ef0d4';
      ctx.fillRect(pad.x - 11, y - 9, 22, 18);
      ctx.fillStyle = '#2fae8f';
      ctx.fillRect(pad.x - 11, y - 9, 22, 5);
      ctx.strokeStyle = '#1b1740';
      ctx.lineWidth = 2;
      ctx.strokeRect(pad.x - 11, y - 9, 22, 18);
      ctx.fillStyle = '#f4efff';
      ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dest.letter, pad.x, y + 22);
      ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
      ctx.fillStyle = '#ffcf5c';
      ctx.fillText(`$${offer.payout}`, pad.x, y - 20);
    }
  }

  drawDestinationGuide(ctx, pads, droneX, droneY, time) {
    if (!this.carried) return;
    const dest = pads[this.carried.destinationIndex];
    const dx = dest.x - droneX;
    const dy = dest.roof - 8 - droneY;
    const distance = Math.hypot(dx, dy);
    if (distance < 130) return;
    const angle = Math.atan2(dy, dx);
    const ax = droneX + Math.cos(angle) * 52;
    const ay = droneY + Math.sin(angle) * 52;
    const urgent = this.carried.timeLeft < 6;
    const pulse = urgent ? 0.6 + 0.4 * Math.sin(time * 8) : 0.9;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = dest.color;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawPopups(ctx) {
    for (const popup of this.popups) {
      const alpha = 1 - popup.age / 1.2;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = popup.color;
      ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(popup.text, popup.x, popup.y);
    }
    ctx.globalAlpha = 1;
  }
}
