// Page boot. The site is complete without any of this; each step only enhances it.
import { initScroll } from './ui/scroll.js';
import { initNavigation } from './ui/navigation.js';
import { initCases } from './ui/cases.js';
import { initReveals } from './ui/reveal.js';
import { initSoundControl } from './ui/sound.js';
import { initIntro } from './ui/intro.js';
import { createSoundscape, audioSupported } from './audio/soundscape.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (!reduced) root.classList.add('motion');

const scroll = initScroll({ reduced });
const sound = audioSupported() ? createSoundscape() : null;
const cases = initCases({ scroll, sound });
initNavigation({ scroll });
initReveals({ reduced, scroll });
if (sound) initSoundControl(sound);

const worldReady = bootWorld();
initIntro({ reduced, worldReady, scroll });

async function bootWorld() {
  const container = document.querySelector('[data-world]');
  // Let the page paint and settle first; the world is an enhancement, not the content.
  await new Promise((resolve) => (window.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 1200 }) : setTimeout(resolve, 300)));
  if (!container || !webglAvailable()) {
    root.classList.add('no-webgl');
    return null;
  }
  try {
    const { createWorld } = await import('./world/engine.js');
    const data = JSON.parse(document.getElementById('world-data').textContent);
    const world = await createWorld({
      container,
      reduced,
      ...data,
      onPick: (id) => cases.open(id),
      onHover: () => sound?.hover(),
      onFrame: (camera) => sound?.updateListener(camera),
      onStation: ({ index, station }) => {
        if (index > 0 || !root.classList.contains('is-intro')) sound?.arrive(station?.target, index);
      },
    });
    sound?.setEmitters(world.emitters);
    container.classList.add('is-ready');

    // Skill chips light their stars.
    document.querySelectorAll('[data-skill]').forEach((chip) => {
      const on = () => world.lightSkill(chip.dataset.skill, true);
      const off = () => world.lightSkill(chip.dataset.skill, false);
      chip.addEventListener('pointerenter', on);
      chip.addEventListener('pointerleave', off);
      chip.addEventListener('focus', on);
      chip.addEventListener('blur', off);
    });
    document.querySelectorAll('[data-skill-group]').forEach((group) => {
      group.addEventListener('pointerenter', () => world.lightSkill(group.dataset.skillGroup, true));
      group.addEventListener('pointerleave', () => world.lightSkill(group.dataset.skillGroup, false));
    });

    // Layout changes (fonts, images, resizes) move the stations.
    scroll.onLayout(() => world.refresh());
    window.__world = world; // handy for debugging in the console
    return world;
  } catch (error) {
    console.warn('3D world unavailable, continuing without it.', error);
    root.classList.add('no-webgl');
    container.remove();
    return null;
  }
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
