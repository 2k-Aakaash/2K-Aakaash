// Section navigator, location readout and mobile menu.
import { gsap } from 'gsap';

export function initNavigation({ scroll }) {
  const root = document.documentElement;
  const sections = [...document.querySelectorAll('[data-section]')];
  const links = [...document.querySelectorAll('[data-nav]')];
  const sector = document.querySelector('[data-locator-sector]');
  const label = document.querySelector('[data-locator-label]');
  const index = document.querySelector('[data-locator-index]');
  const bar = document.querySelector('[data-locator-bar]');
  const toggle = document.querySelector('[data-menu-toggle]');
  let current = '';

  // Anchor links glide through the world instead of jumping.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scroll.to(el, {
      onComplete: () => {
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      },
    });
    history.replaceState(null, '', `#${id}`);
  });

  function update() {
    const probe = window.innerHeight * 0.45;
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= probe) active = s;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) gsap.set(bar, { scaleX: max > 0 ? window.scrollY / max : 0 });
    if (!active || active.id === current) return;
    current = active.id;
    links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${current}`)));
    if (sector) sector.textContent = active.dataset.sector;
    if (label) label.textContent = active.dataset.label;
    if (index) index.textContent = String(sections.indexOf(active) + 1).padStart(2, '0');
  }

  function closeMenu() {
    if (!root.classList.contains('nav-open')) return;
    root.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) toggle.textContent = 'Menu';
    scroll.start();
  }

  toggle?.addEventListener('click', () => {
    const open = !root.classList.contains('nav-open');
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    if (open) {
      scroll.stop();
      document.querySelector('.nav-rail a')?.focus();
    } else scroll.start();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) {
      closeMenu();
      toggle?.focus();
    }
  });

  window.addEventListener('scroll', update, { passive: true });
  update();
}
