// Text and interface reveals. Elements marked [data-reveal] rise in as they enter and settle
// back out as they leave, in step with the camera travelling between stations.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initReveals({ reduced }) {
  if (reduced) return;
  const groups = new Map();
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    const scope = el.closest('[data-reveal-scope]') || el.parentElement;
    if (!groups.has(scope)) groups.set(scope, []);
    groups.get(scope).push(el);
  });

  groups.forEach((items, scope) => {
    // The hero is revealed by the intro instead.
    if (scope.closest('#home')) return;
    const last = scope.closest('#contact');
    gsap.set(items, { opacity: 0, y: 28 });
    ScrollTrigger.create({
      trigger: scope,
      start: 'top 78%',
      end: 'bottom 22%',
      onEnter: () => gsap.to(items, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, overwrite: true }),
      onEnterBack: () => gsap.to(items, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05, overwrite: true }),
      onLeave: () => !last && gsap.to(items, { opacity: 0, y: -24, duration: 0.6, ease: 'power2.in', stagger: 0.03, overwrite: true }),
      onLeaveBack: () => gsap.to(items, { opacity: 0, y: 28, duration: 0.6, ease: 'power2.in', overwrite: true }),
    });
  });
}
