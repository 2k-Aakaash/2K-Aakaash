// The world: one renderer, one scene, one camera, a route of regions. Created lazily after the
// page is interactive; if WebGL is unavailable the caller simply never gets a world and the
// page stays a complete, readable site.
import * as THREE from 'three';
import { createQuality } from './quality.js';
import { createEnvironment } from './environment.js';
import { createCameraRig } from './camera.js';
import { createObservatory } from './regions/observatory.js';
import { createLens } from './regions/lens.js';
import { createArtifacts } from './regions/artifacts.js';
import { createConstellation } from './regions/constellation.js';
import { createTimeline } from './regions/timeline.js';
import { createBeacon } from './regions/beacon.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Give the browser a chance to handle input and paint between heavy setup steps.
const mark = (name, start) => performance.measure?.(`world:${name}`, { start });

const yieldToMain = () =>
  globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0));

export async function createWorld({ container, reduced, projects, skillGroups, milestoneCount, images, onPick, onStation, onHover, onFrame }) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.append(canvas);

  const t0 = performance.now();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  mark('renderer', t0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 4000);

  let composer = null;
  let bloomPass = null;
  const quality = createQuality((settings) => applyQuality(settings));
  await yieldToMain();
  let t = performance.now();
  const environment = createEnvironment(renderer, scene, quality.settings);
  mark('environment', t);
  await yieldToMain();
  t = performance.now();
  environment.bakeReflections();
  mark('reflections', t);
  await yieldToMain();

  // Regions along the route, built one at a time so setup never blocks for long.
  t = performance.now();
  const observatory = createObservatory();
  mark('observatory', t);
  await yieldToMain();
  t = performance.now();
  const lens = createLens();
  mark('lens', t);
  await yieldToMain();
  t = performance.now();
  const artifacts = createArtifacts(projects, images);
  mark('artifacts', t);
  await yieldToMain();
  t = performance.now();
  const constellation = createConstellation(skillGroups);
  const timeline = createTimeline(milestoneCount);
  const beacon = createBeacon();
  mark('outer regions', t);
  await yieldToMain();
  const regions = { home: observatory, about: lens, skills: constellation, journey: timeline, contact: beacon };
  scene.add(observatory.group, lens.group, artifacts.group, constellation.group, timeline.group, beacon.group);
  scene.add(new THREE.AmbientLight('#6c7aa8', 0.35));
  const sun = new THREE.DirectionalLight('#ffe2bf', 1.2);
  sun.position.set(40, 60, 30);
  scene.add(sun);

  const stations = {
    ...observatory.stations,
    ...lens.stations,
    ...artifacts.stations,
    ...constellation.stations,
    ...timeline.stations,
    ...beacon.stations,
  };
  const rig = createCameraRig(camera, stations, { reduced });

  async function ensureComposer() {
    if (composer) return;
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/examples/jsm/postprocessing/EffectComposer.js'),
      import('three/examples/jsm/postprocessing/RenderPass.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/OutputPass.js'),
    ]);
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.55, 0.6, 0.82);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    resize();
  }

  function applyQuality(settings) {
    const dpr = Math.min(window.devicePixelRatio || 1, settings.dpr);
    renderer.setPixelRatio(dpr);
    environment.applyQuality(settings);
    environment.setPixelRatio(dpr);
    constellation.setPixelRatio(dpr);
    if (settings.bloom) ensureComposer();
    resize();
    requestRender();
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait screens: widen the lens so subjects stay in frame.
    camera.fov = w / h < 0.8 ? 58 : 42;
    camera.updateProjectionMatrix();
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    }
    rig.measure();
    requestRender();
  }

  // ── Input ─────────────────────────────────────────────────────────────────────────────
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, ndc: new THREE.Vector2(9, 9), dirty: false };
  const fine = window.matchMedia('(pointer: fine)').matches;
  const raycaster = new THREE.Raycaster();
  let hoverId = null;

  function onPointerMove(e) {
    pointer.x = e.clientX / window.innerWidth - 0.5;
    pointer.y = e.clientY / window.innerHeight - 0.5;
    pointer.ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    pointer.dirty = true;
  }

  function pick() {
    raycaster.setFromCamera(pointer.ndc, camera);
    const hit = raycaster.intersectObjects(artifacts.pickables, true)[0];
    return hit?.object.userData.projectId ?? null;
  }

  // The canvas never takes pointer events, so clicks arrive on the page. Only treat one as a
  // pick when it landed on empty space, not on copy or a control.
  function onClick(e) {
    if (e.target.closest('a, button, input, label, dialog, p, h1, h2, h3, li, [data-no-pick]')) return;
    onPointerMove(e);
    const id = pick();
    if (id) onPick(id);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('click', onClick);
  window.addEventListener('resize', resize);

  // ── Loop ──────────────────────────────────────────────────────────────────────────────
  let running = true;
  let needsRender = true;
  let last = performance.now();
  let time = 0;
  let frameId = 0;
  let lastStation = -1;
  let pickAt = 0;

  function requestRender() {
    needsRender = true;
  }

  function activeKeys() {
    const { index, blend } = rig.focus;
    const i = blend > 0.5 ? Math.min(index + 1, rig.stationCount - 1) : index;
    return { i, key: rig.elementAt(i)?.dataset.station };
  }

  function frame(now) {
    frameId = requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // first rAF can predate `last`
    last = now;
    if (!reduced) time += dt;

    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;

    const cut = rig.update(dt, window.scrollY, fine ? { x: pointer.sx, y: pointer.sy } : null);
    camera.updateMatrixWorld();
    onFrame?.(camera);
    if (cut) {
      container.classList.add('is-cut');
      setTimeout(() => container.classList.remove('is-cut'), 360);
    }

    const { i, key } = activeKeys();
    if (i !== lastStation) {
      lastStation = i;
      const station = rig.stationAt(i);
      onStation?.({ index: i, key, station });
      needsRender = true;
    }
    const station = rig.stationAt(i);
    if (station?.mood) environment.setMood(station.mood[0], station.mood[1], reduced ? 1 : 0.02);

    // Reduced motion renders on demand only: after cuts, resizes and hover changes.
    if (reduced && !needsRender && !pointer.dirty) return;

    if (fine && pointer.dirty && now > pickAt) {
      pickAt = now + 80;
      pointer.dirty = false;
      const id = pick();
      if (id !== hoverId) {
        hoverId = id;
        document.documentElement.classList.toggle('world-hover', !!id);
        if (id) onHover?.(id);
        needsRender = true;
      }
    }

    const region = key?.startsWith('project:') ? 'work' : key;
    const activeProject = key?.startsWith('project:') ? key.slice(8) : null;
    observatory.update(time, region === 'home');
    lens.update(time, region === 'about');
    artifacts.update(time, activeProject, hoverId);
    constellation.update(time, region === 'skills');
    timeline.update(time, region === 'journey');
    beacon.update(time, region === 'contact');
    environment.update(time, camera);

    if (composer && quality.settings.bloom) composer.render();
    else renderer.render(scene, camera);
    needsRender = false;
  }

  // Frame-time sampling: measure the full interval between frames, which is what the user
  // feels, rather than only CPU submit time.
  let prevFrame = 0;
  const measure = (now) => {
    if (running && prevFrame && !reduced) quality.sample(now - prevFrame, now);
    prevFrame = now;
    measureId = requestAnimationFrame(measure);
  };
  let measureId = requestAnimationFrame(measure);

  function onVisibility() {
    running = document.visibilityState === 'visible';
    last = performance.now();
    prevFrame = 0;
    if (running) needsRender = true;
  }
  document.addEventListener('visibilitychange', onVisibility);

  t = performance.now();
  applyQuality(quality.settings);
  mark('quality', t);
  t = performance.now();
  // Compile every shader before the first visible frame so regions never hitch on arrival.
  // compileAsync uses KHR_parallel_shader_compile where available, keeping the page responsive.
  if (renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  mark('compile', t);
  frameId = requestAnimationFrame(frame);

  return {
    camera,
    rig,
    get quality() {
      return quality.settings.name;
    },
    get hoverId() {
      return hoverId;
    },
    regions,
    emitters: [
      { key: 'home', position: observatory.emitter },
      { key: 'about', position: lens.emitter },
      { key: 'work', position: artifacts.emitters[0] ?? lens.emitter },
      { key: 'skills', position: constellation.emitter },
      { key: 'journey', position: timeline.emitter },
      { key: 'contact', position: beacon.emitter },
    ],
    lightSkill(key, on) {
      constellation.light(key, on);
      requestRender();
    },
    refresh() {
      rig.rebuild();
      requestRender();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(measureId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      environment.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => {
          Object.values(m).forEach((v) => v?.isTexture && v.dispose());
          m.uniforms && Object.values(m.uniforms).forEach((u) => u.value?.isTexture && u.value.dispose());
          m.dispose();
        });
      });
      composer?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
