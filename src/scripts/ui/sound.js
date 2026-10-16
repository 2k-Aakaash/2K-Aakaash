// Sound control: a persistent toggle plus a small panel for volume and categories.

export function initSoundControl(sound) {
  const root = document.querySelector('[data-sound]');
  if (!root) return;
  root.hidden = false;
  const toggle = root.querySelector('[data-sound-toggle]');
  const panelBtn = root.querySelector('[data-sound-more]');
  const panel = root.querySelector('[data-sound-panel]');
  const text = root.querySelector('[data-sound-text]');
  const stateLabel = root.querySelector('[data-sound-state]');
  const volume = root.querySelector('[data-sound-volume]');
  const ambient = root.querySelector('[data-sound-ambient]');
  const interaction = root.querySelector('[data-sound-interaction]');
  const output = root.querySelector('[data-sound-output]');

  toggle.addEventListener('click', () => sound.setEnabled(!sound.state.enabled));
  panelBtn.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    panelBtn.setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      panelBtn.setAttribute('aria-expanded', 'false');
      panelBtn.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.hidden && !root.contains(e.target)) {
      panel.hidden = true;
      panelBtn.setAttribute('aria-expanded', 'false');
    }
  });
  volume.addEventListener('input', () => sound.setVolume(Number(volume.value) / 100));
  ambient.addEventListener('change', () => sound.setCategory('ambient', ambient.checked));
  interaction.addEventListener('change', () => sound.setCategory('interaction', interaction.checked));

  sound.subscribe((s) => {
    if (!s.supported) {
      toggle.disabled = true;
      text.textContent = 'Sound unavailable';
      return;
    }
    const on = s.enabled;
    root.dataset.on = String(on && s.running);
    toggle.setAttribute('aria-pressed', String(on));
    // Constant accessible name ("Sound") + aria-pressed for state; on/off is visual only.
    stateLabel.textContent = on ? 'on' : 'off';
    volume.value = String(Math.round(s.volume * 100));
    ambient.checked = s.ambient;
    interaction.checked = s.interaction;
    output.textContent = s.output;
  });
}
