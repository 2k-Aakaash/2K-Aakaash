// Contact: the beacon at the end of the route. A great ring frames a slowly turning portal;
// light rises through it. The camera finishes the journey looking straight through.
import * as THREE from 'three';
import { NOISE } from '../glsl.js';

export const CENTER = new THREE.Vector3(0, 0, -1010);

export function createBeacon() {
  const group = new THREE.Group();
  group.position.copy(CENTER);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(18, 0.6, 24, 240),
    new THREE.MeshStandardMaterial({ color: '#e9dcc4', metalness: 1, roughness: 0.22, envMapIntensity: 1.5 }),
  );
  const inner = new THREE.Mesh(new THREE.TorusGeometry(16.8, 0.06, 6, 240), new THREE.MeshBasicMaterial({ color: '#ffcf96' }));
  group.add(ring, inner);

  const portal = new THREE.Mesh(
    new THREE.CircleGeometry(16.7, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      defines: { OCTAVES: 3 },
      uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uOpen;
        varying vec2 vUv;
        ${NOISE}
        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p) * 2.0;
          float a = atan(p.y, p.x);
          float swirl = fbm(vec3(cos(a) * 2.0, sin(a) * 2.0, r * 3.0 - uTime * 0.25));
          float rings = 0.5 + 0.5 * sin(r * 26.0 - uTime * 1.4 + swirl * 4.0);
          float edge = smoothstep(1.0, 0.75, r);
          vec3 col = mix(vec3(1.0, 0.6, 0.25), vec3(0.45, 0.75, 1.0), smoothstep(0.1, 0.9, r + swirl * 0.3));
          float a1 = (swirl * 0.5 + rings * 0.25) * edge * (0.25 + 0.75 * uOpen);
          gl_FragColor = vec4(col * a1, a1);
        }
      `,
    }),
  );
  group.add(portal);

  // Rising motes.
  const COUNT = 260;
  const seeds = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 16;
    seeds.set([Math.cos(a) * r, Math.random(), Math.sin(a) * r * 0.25], i * 3);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ color: '#ffd9a8', size: 0.22, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  motes.frustumCulled = false;
  group.add(motes);

  const light = new THREE.PointLight('#ffcf96', 300, 90, 1.6);
  light.position.set(0, 0, 10);
  group.add(light);

  let open = 0;
  const pos = moteGeo.attributes.position;
  return {
    group,
    stations: {
      contact: {
        position: CENTER.clone().add(new THREE.Vector3(0, 2, 74)),
        target: CENTER.clone().add(new THREE.Vector3(0, 1, 0)),
        offset: -10,
        offsetNarrow: 0,
        mood: ['#ffb35c', '#86d2ff'],
      },
    },
    emitter: CENTER.clone(),
    update(t, active) {
      open += ((active ? 1 : 0) - open) * 0.03;
      portal.material.uniforms.uTime.value = t;
      portal.material.uniforms.uOpen.value = open;
      portal.rotation.z = t * 0.05;
      inner.rotation.z = -t * 0.1;
      for (let i = 0; i < COUNT; i++) {
        const y = ((seeds[i * 3 + 1] + t * 0.04) % 1) * 36 - 18;
        pos.setXYZ(i, seeds[i * 3], y, seeds[i * 3 + 2]);
      }
      pos.needsUpdate = true;
    },
  };
}
