// A small seeded random number generator, so the city skyline is the
// same on every load while gameplay randomness stays free to vary.

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInRange(random, min, max) {
  return min + random() * (max - min);
}

export function randomIntInRange(random, min, max) {
  return Math.floor(randomInRange(random, min, max + 1));
}

export function pickRandom(random, list) {
  return list[Math.floor(random() * list.length)];
}
