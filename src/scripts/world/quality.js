// Adaptive quality. A starting tier is picked from coarse capability hints (never above medium),
// then measured frame times move it down (never back up after a drop, so it cannot oscillate)
// or, after five seconds of clearly fast frames, up to high. Bloom is only paid for once earned.

export const TIERS = [
  { name: 'low', dpr: 1, stars: 2600, dust: 350, bloom: false, octaves: 2 },
  { name: 'medium', dpr: 1.5, stars: 5200, dust: 800, bloom: false, octaves: 3 },
  { name: 'high', dpr: 2, stars: 8000, dust: 1300, bloom: true, octaves: 4 },
];

function startingTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (cores >= 4 && !(small && memory < 4) && !(coarse && memory < 4)) return 1;
  return 0;
}

export function createQuality(onChange) {
  let tier = startingTier();
  let dropped = false;
  let samples = [];
  let fastSince = 0;
  let cooldownUntil = performance.now() + 2500; // ignore shader-compile frames at start

  function set(next) {
    if (next === tier || next < 0 || next >= TIERS.length) return;
    tier = next;
    samples = [];
    fastSince = 0;
    cooldownUntil = performance.now() + 2500;
    onChange(TIERS[tier], tier);
  }

  return {
    get tier() {
      return tier;
    },
    get settings() {
      return TIERS[tier];
    },
    /** Feed one frame duration (ms). Only call for frames that actually rendered. */
    sample(ms, now) {
      if (now < cooldownUntil || ms > 250) return; // tab switches, GC pauses
      samples.push(ms);
      if (samples.length < 60) return;
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      samples = [];
      if (avg > 24 && tier > 0) {
        dropped = true;
        set(tier - 1);
      } else if (avg < 11 && !dropped && tier < TIERS.length - 1) {
        fastSince ||= now;
        if (now - fastSince > 5000) set(tier + 1);
      } else {
        fastSince = 0;
      }
    },
  };
}
