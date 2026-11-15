// Tuning and palette for Duskline Courier. Every magic number the game
// plays by lives here, so the feel can be tuned in one place.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const GROUND_Y = 648;

export const DELIVERY_QUOTA = 12;
export const START_LIVES = 3;
export const MAX_OFFERS = 3;

export const DRONE_RADIUS = 16;
export const DRONE_THRUST = 900;
export const DRONE_BOOST_MULTIPLIER = 2.1;
export const DRONE_DRAG = 1.6;
export const DRONE_MAX_SPEED = 340;
export const DRONE_BOOST_MAX_SPEED = 560;
export const BOOST_MAX = 100;
export const BOOST_DRAIN_PER_SECOND = 45;
export const BOOST_REFILL_PER_SECOND = 22;
export const CRASH_INVULNERABLE_SECONDS = 2.0;
export const PAD_TOUCH_RADIUS = 46;

export const PARCEL_BASE_PAYOUT = 100;
export const PARCEL_DISTANCE_BONUS = 0.12;
export const PARCEL_TIME_LIMIT_SECONDS = 26;
export const PARCEL_LATE_PAYOUT_FRACTION = 0.5;
export const PARCEL_OFFER_LIFETIME_SECONDS = 30;
export const COMBO_MAX_MULTIPLIER = 5;
export const ON_TIME_BONUS_PER_SECOND_LEFT = 4;

export const TRAFFIC_LANES = [150, 240, 330, 420, 470];
export const TRAFFIC_BASE_COUNT = 5;
export const TRAFFIC_PER_TIER = 2;
export const TRAFFIC_MIN_SPEED = 55;
export const TRAFFIC_MAX_SPEED = 150;
export const TRAFFIC_RADIUS = 15;

// Tier 0: the first four deliveries. Tier 1: the middle four. Tier 2: the
// last four, when the sky is busiest and the clocks are tightest.
export const TIER_TIME_LIMIT = [26, 22, 18];
export const TIER_TRAFFIC_SPEED = [1.0, 1.25, 1.5];

export const PALETTE = {
  skyTop: '#1b1740',
  skyMid: '#3b2364',
  skyLow: '#8a3b5e',
  horizon: '#e8804a',
  moon: '#ffe9b8',
  moonGlow: 'rgba(255, 233, 184, 0.25)',
  star: '#ffffff',
  farBuilding: '#2a2350',
  farWindow: '#f7c873',
  nearBuilding: '#1d1836',
  nearWindow: '#ffd98a',
  roofEdge: '#4a3a72',
  ground: '#14102a',
  pad: '#3d3168',
  padEdge: '#8f7fd6',
  padBeacon: '#7ef0d4',
  droneBody: '#ffcf5c',
  droneDark: '#c98f2b',
  droneGlass: '#bfe9ff',
  rotor: 'rgba(220, 235, 255, 0.75)',
  trafficBody: '#ff5d6c',
  trafficDark: '#b32c3c',
  trafficLight: '#ff8f9a',
  parcel: '#7ef0d4',
  parcelDark: '#2fae8f',
  danger: '#ff5d6c',
  good: '#7ef0d4',
  gold: '#ffcf5c',
  hudPanel: 'rgba(16, 12, 38, 0.72)',
  hudText: '#f4efff',
  hudDim: '#b9aede',
};

export const PAD_DEFS = [
  { letter: 'A', x: 118, roof: 560, color: '#7ef0d4' },
  { letter: 'B', x: 322, roof: 512, color: '#ffcf5c' },
  { letter: 'C', x: 526, roof: 576, color: '#ff9ecb' },
  { letter: 'D', x: 730, roof: 520, color: '#9ecbff' },
  { letter: 'E', x: 934, roof: 568, color: '#c3ff9e' },
  { letter: 'F', x: 1140, roof: 528, color: '#ffb27e' },
];

export const DEPOT_PAD_INDEX = 2;

export const WORLD_SEED = 20261116;
