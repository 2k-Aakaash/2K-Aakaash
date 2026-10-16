// Project case files: native <dialog> elements, opened from the page or by clicking an
// artifact in the world. The dialog handles focus trapping and Escape; we pause smooth
// scrolling underneath it.

export function initCases({ scroll, sound }) {
  const dialogs = new Map([...document.querySelectorAll('dialog[data-case]')].map((d) => [d.dataset.case, d]));
  let opener = null;

  function open(id, trigger) {
    const dialog = dialogs.get(id);
    if (!dialog || dialog.open) return;
    opener = trigger || document.activeElement;
    dialog.showModal();
    dialog.querySelector('.case-scroll')?.scrollTo(0, 0);
    scroll.stop();
    sound?.open();
  }

  dialogs.forEach((dialog) => {
    dialog.addEventListener('close', () => {
      scroll.start();
      sound?.close();
      if (opener && document.contains(opener)) opener.focus();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close(); // click on the backdrop
    });
    dialog.querySelector('[data-case-close]')?.addEventListener('click', () => dialog.close());
  });

  document.querySelectorAll('[data-open-case]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.openCase, btn));
  });

  // Deep link: /#case-iweb opens that case file.
  const hash = location.hash.match(/^#case-(.+)$/);
  if (hash && dialogs.has(hash[1])) requestAnimationFrame(() => open(hash[1]));

  return { open };
}
