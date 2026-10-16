// Opening sequence. Plays only when the page opens at the top with motion allowed (decided by
// an inline script in <head> before first paint, which sets html.is-intro). First visit: about
// three seconds; return visits: a shorter arrival. Any scroll, key or the Skip button ends it.
import { gsap } from 'gsap';

const SEEN = 'aakaash:intro-seen';

export function initIntro({ reduced, worldReady, scroll }) {
  const root = document.documentElement;
  const overlay = document.querySelector('[data-intro]');
  const chars = document.querySelectorAll('[data-hero-ch]');
  // Buttons slide in at full opacity so they never sit at a half-faded, low-contrast state.
  const rest = document.querySelectorAll('#home [data-reveal]:not(.actions)');
  const actions = document.querySelectorAll('#home .actions[data-reveal]');

  if (reduced || !root.classList.contains('is-intro') || !overlay) {
    root.classList.remove('is-intro');
    return;
  }

  let seen = false;
  try {
    seen = localStorage.getItem(SEEN) === '1';
  } catch {
    /* ignore */
  }

  const status = overlay.querySelector('[data-intro-status]');
  const skipBtn = document.querySelector('[data-intro-skip]');
  const line = overlay.querySelector('[data-intro-line]');
  scroll.stop();
  gsap.set(chars, { yPercent: 110, opacity: 0 });
  gsap.set(rest, { opacity: 0, y: 24 });
  gsap.set(actions, { y: 24 });
  gsap.from(line, { opacity: 0, letterSpacing: '0.6em', duration: 1.4, ease: 'expo.out' });

  // Only say we're loading if loading is actually what we're waiting on.
  const slow = setTimeout(() => status && (status.textContent = 'Loading the 3D world…'), 600);

  let tl = null;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(slow);
    if (tl) tl.progress(1);
    else {
      gsap.set(chars, { yPercent: 0, opacity: 1 });
      gsap.set(rest, { opacity: 1, y: 0 });
      gsap.set(actions, { y: 0 });
      gsap.set(overlay, { autoAlpha: 0 });
    }
    cleanup();
  };

  function cleanup() {
    // The Skip button disappears with the intro; don't leave focus on a hidden control.
    if (document.activeElement === skipBtn) document.getElementById('hero-title')?.focus({ preventScroll: true });
    root.classList.remove('is-intro');
    scroll.start();
    removeEventListener('wheel', finish);
    removeEventListener('touchmove', finish);
    removeEventListener('keydown', onKey);
    try {
      localStorage.setItem(SEEN, '1');
    } catch {
      /* ignore */
    }
  }

  const onKey = (e) => {
    if (e.key !== 'Tab') finish();
  };
  skipBtn?.addEventListener('click', finish);
  addEventListener('wheel', finish, { passive: true });
  addEventListener('touchmove', finish, { passive: true });
  addEventListener('keydown', onKey);

  const timeout = new Promise((resolve) => setTimeout(resolve, 4500, null));
  Promise.race([worldReady, timeout]).then((world) => {
    clearTimeout(slow);
    if (done) {
      if (world) world.rig.intro.value = 1;
      return;
    }
    const flight = world ? (seen ? 1.9 : 3.4) : 0;
    const proxy = world ? world.rig.intro : { value: 1 };
    proxy.value = world ? 0 : 1;
    if (status) status.textContent = '';

    tl = gsap.timeline({ onComplete: () => !done && ((done = true), cleanup()) });
    tl.to(line, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
      .to(overlay, { autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, 0.3)
      .to(proxy, { value: 1, duration: flight || 0.01, ease: 'power3.inOut' }, 0.2)
      .to(chars, { yPercent: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.06 }, 0.2 + flight * 0.45)
      .to(rest, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.6 + flight * 0.55)
      .to(actions, { y: 0, duration: 1, ease: 'expo.out' }, 0.7 + flight * 0.55);
  });
}
