// Skills: a constellation. Each group is a cluster of stars joined by faint lines, placed
// around a shared centre; skills shipped in projects burn brighter than ones only listed.
// Hovering or focusing a skill chip in the page lights its star.
import * as THREE from 'three';
import { POINT_FRAG } from '../glsl.js';

export const CENTER = new THREE.Vector3(6, 34, -760);

export function createConstellation(groups) {
  const group = new THREE.Group();
  group.position.copy(CENTER);

  const stars = [];
  const lineVerts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  groups.forEach((g, gi) => {
    // Cluster centres on a ring, tilted so the constellation reads in depth.
    const a = (gi / groups.length) * Math.PI * 2;
    const centre = new THREE.Vector3(Math.cos(a) * 22, Math.sin(a) * 13, Math.sin(a * 2) * 8);
    let prev = null;
    g.skills.forEach((skill, si) => {
      const r = 3 + Math.sqrt(si + 1) * 2.1;
      const b = si * golden + gi;
      const p = centre.clone().add(new THREE.Vector3(Math.cos(b) * r, Math.sin(b) * r * 0.8, Math.sin(b * 1.7) * 3));
      stars.push({ p, key: `${g.id}:${skill.name}`, bright: skill.evidence === 'shipped' });
      const anchor = prev || centre;
      lineVerts.push(anchor.x, anchor.y, anchor.z, p.x, p.y, p.z);
      prev = p;
    });
    stars.push({ p: centre, key: `${g.id}`, bright: true, hub: true });
  });

  const count = stars.length;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const lit = new Float32Array(count);
  const warm = new THREE.Color('#ffd7a3');
  const cool = new THREE.Color('#a9d8ff');
  stars.forEach((s, i) => {
    positions.set([s.p.x, s.p.y, s.p.z], i * 3);
    sizes[i] = s.hub ? 9 : s.bright ? 6 : 3.6;
    const c = s.hub ? cool : warm;
    colors.set([c.r, c.g, c.b], i * 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const litAttr = new THREE.BufferAttribute(lit, 1);
  geo.setAttribute('aLit', litAttr);
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uReveal: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uReveal;
        attribute float aSize;
        attribute float aLit;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = mix(color, vec3(1.0, 0.75, 0.4), aLit);
          vAlpha = (0.75 + 0.25 * sin(uTime * 1.3 + position.x)) * (0.35 + 0.65 * uReveal) + aLit;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (1.0 + aLit * 1.4) * uPixelRatio * (150.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: POINT_FRAG,
    }),
  );
  points.frustumCulled = false;
  group.add(points);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: '#86d2ff', transparent: true, opacity: 0.0 }));
  group.add(lines);

  const index = new Map(stars.map((s, i) => [s.key, i]));
  const litTarget = new Float32Array(count);
  let reveal = 0;

  return {
    group,
    stations: {
      skills: {
        position: CENTER.clone().add(new THREE.Vector3(0, -4, 104)),
        target: CENTER.clone(),
        offset: -4,
        offsetNarrow: 0,
        mood: ['#86d2ff', '#ffb35c'],
      },
    },
    emitter: CENTER.clone(),
    /** Light one star (or a whole group when only the group id is given). */
    light(key, on) {
      if (index.has(key)) litTarget[index.get(key)] = on ? 1 : 0;
      else
        stars.forEach((s, i) => {
          if (s.key.startsWith(`${key}:`)) litTarget[i] = on ? 0.6 : 0;
        });
    },
    setPixelRatio(dpr) {
      points.material.uniforms.uPixelRatio.value = dpr;
    },
    update(t, active) {
      reveal += ((active ? 1 : 0.2) - reveal) * 0.03;
      points.material.uniforms.uTime.value = t;
      points.material.uniforms.uReveal.value = reveal;
      lines.material.opacity = 0.05 + reveal * 0.2;
      let dirty = false;
      for (let i = 0; i < count; i++) {
        const next = lit[i] + (litTarget[i] - lit[i]) * 0.15;
        if (Math.abs(next - lit[i]) > 0.001) {
          lit[i] = next;
          dirty = true;
        }
      }
      if (dirty) litAttr.needsUpdate = true;
      group.rotation.y = Math.sin(t * 0.05) * 0.25;
    },
  };
}
