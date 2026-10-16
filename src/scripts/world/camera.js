// Scroll-driven camera. Every DOM element with [data-station] maps to a camera station
// (position, look-at target and lens shift) declared by the world regions. The page's scroll
// position is the single source of truth: navigating, skipping the intro or scrolling fast all
// just move the scroll, so camera moves can never fight each other.
//
// Between stations the camera follows centripetal Catmull-Rom splines and "dwells" near each
// station (smootherstep), so it settles while the visitor reads, then travels.
import * as THREE from 'three';

const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function createCameraRig(camera, stationDefs, { reduced }) {
  let elements = [];
  let stations = [];
  let anchors = [];
  let posCurve = null;
  let targetCurve = null;
  const desiredPos = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  const target = new THREE.Vector3();
  const base = new THREE.Vector3(); // damped position before pointer parallax
  const tmp = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  let offset = 0;
  let focus = { index: 0, blend: 0 };
  let snapped = -1;

  // Intro: the camera arrives from deep space toward the first station.
  const intro = { value: 1, from: new THREE.Vector3(0, 46, 320), fromTarget: new THREE.Vector3(0, 10, -60) };

  function build() {
    elements = [...document.querySelectorAll('[data-station]')].filter((el) => stationDefs[el.dataset.station]);
    stations = elements.map((el) => stationDefs[el.dataset.station]);
    if (stations.length < 2) return;
    posCurve = new THREE.CatmullRomCurve3(stations.map((s) => s.position), false, 'centripetal');
    targetCurve = new THREE.CatmullRomCurve3(stations.map((s) => s.target), false, 'centripetal');
    measure();
  }

  function measure() {
    const vh = window.innerHeight;
    anchors = elements.map((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      // A station is "arrived" when its element is centred (tall elements: their top third).
      return Math.max(0, top + Math.min(r.height, vh * 1.2) / 2 - vh / 2);
    });
    // Keep anchors strictly increasing so every segment has length.
    for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
  }

  function locate(scrollY) {
    const n = anchors.length;
    if (scrollY <= anchors[0]) return { index: 0, f: 0 };
    if (scrollY >= anchors[n - 1]) return { index: n - 1, f: 0 };
    let i = 0;
    while (i < n - 2 && scrollY >= anchors[i + 1]) i++;
    return { index: i, f: (scrollY - anchors[i]) / (anchors[i + 1] - anchors[i]) };
  }

  function lensShift(station) {
    // Desktop: shift the frame so the subject sits beside the copy. Narrow screens: centred.
    const wide = window.innerWidth >= 900;
    return wide ? (station.offset ?? 0) : (station.offsetNarrow ?? 0);
  }

  build();
  base.copy(intro.from);
  camera.position.copy(intro.from);

  return {
    intro,
    get focus() {
      return focus;
    },
    get stationCount() {
      return stations.length;
    },
    stationAt(i) {
      return stations[i];
    },
    elementAt(i) {
      return elements[i];
    },
    rebuild: build,
    measure,
    get anchors() {
      return anchors;
    },
    /**
     * Advance the camera. Returns true when the reduced-motion snap changed station
     * (the caller cross-fades the canvas to hide the cut).
     */
    update(dt, scrollY, pointer) {
      if (!posCurve) return false;
      const n = stations.length;
      const { index, f } = locate(scrollY);
      const g = smoother(clamp01((f - 0.18) / 0.64));
      let cut = false;

      if (reduced) {
        // No travel: jump to the nearest station.
        const nearest = Math.min(n - 1, f < 0.5 ? index : index + 1);
        if (nearest !== snapped) {
          cut = snapped !== -1;
          snapped = nearest;
          const s = stations[nearest];
          base.copy(s.position);
          target.copy(s.target);
          offset = lensShift(s);
        }
        focus = { index: nearest, blend: 0 };
      } else {
        const u = n > 1 ? (index + g) / (n - 1) : 0;
        posCurve.getPoint(u, desiredPos);
        targetCurve.getPoint(u, desiredTarget);
        const a = stations[index];
        const b = stations[Math.min(n - 1, index + 1)];
        const desiredOffset = THREE.MathUtils.lerp(lensShift(a), lensShift(b), g);

        if (intro.value < 1) {
          const k = intro.value;
          desiredPos.lerpVectors(intro.from, desiredPos, k);
          desiredTarget.lerpVectors(intro.fromTarget, desiredTarget, k);
        }

        // Critically damped follow gives the camera weight without lagging behind fast scrolls.
        const k = 1 - Math.exp(-dt * (intro.value < 1 ? 14 : 4.2));
        base.lerp(desiredPos, k);
        target.lerp(desiredTarget, k);
        offset += (desiredOffset - offset) * k;
        focus = { index, blend: g };
      }

      camera.position.copy(base);
      camera.lookAt(target);
      camera.filmOffset = offset;

      // Pointer parallax: slide the lens sideways around the look-at point (never roll), so
      // near objects move more than distant ones.
      if (!reduced && pointer) {
        camera.updateMatrix();
        right.setFromMatrixColumn(camera.matrix, 0);
        up.setFromMatrixColumn(camera.matrix, 1);
        tmp.copy(right).multiplyScalar(pointer.x * 2.4).addScaledVector(up, -pointer.y * 1.5);
        camera.position.add(tmp);
        camera.lookAt(target);
      }
      camera.updateProjectionMatrix();
      return cut;
    },
  };
}
