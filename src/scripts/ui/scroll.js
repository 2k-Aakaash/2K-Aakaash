// Smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger and the world stay in sync.
// With reduced motion, native scrolling is used and jumps are instant.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScroll({ reduced }) {
  const layoutCallbacks = new Set();
  let lenis = null;

  if (!reduced) {
    lenis = new Lenis({ duration: 1.25, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Every source of layout change funnels into one debounced pass, and only runs when the
  // page geometry actually changed (each refresh forces a full layout).
  let lastKey = '';
  const relayout = () => {
    const key = `${document.body.scrollHeight}x${window.innerWidth}x${window.innerHeight}`;
    if (key === lastKey) return;
    lastKey = key;
    ScrollTrigger.refresh();
    layoutCallbacks.forEach((fn) => fn());
  };
  let resizeTimer;
  const queue = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 200);
  };
  document.fonts?.ready.then(queue);
  window.addEventListener('load', queue);
  window.addEventListener('resize', queue);
  // Content height changes (images, fonts, late styles) move every station; re-measure.
  if ('ResizeObserver' in window) new ResizeObserver(queue).observe(document.body);

  return {
    lenis,
    to(target, { immediate = false, onComplete } = {}) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      if (lenis) {
        lenis.scrollTo(el, { offset: 0, immediate, duration: 2.2, onComplete });
      } else {
        el.scrollIntoView({ behavior: 'auto' });
        onComplete?.();
      }
    },
    stop() {
      lenis?.stop();
    },
    start() {
      lenis?.start();
    },
    onLayout(fn) {
      layoutCallbacks.add(fn);
      lastKey = ''; // make sure a late subscriber sees the next pass
      queue();
    },
  };
}
