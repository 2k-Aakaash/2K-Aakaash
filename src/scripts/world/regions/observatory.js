// Home: the observatory's armillary sphere. Three gimbal rings precess around a slow-burning
// core; the outer ring carries instanced tick marks like an instrument dial.
import * as THREE from 'three';
import { NOISE } from '../glsl.js';

export const CENTER = new THREE.Vector3(0, 0, 0);

function coreMaterial() {
  return new THREE.ShaderMaterial({
    defines: { OCTAVES: 3 },
    uniforms: { uTime: { value: 0 }, uHeat: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vView;
      void main() {
        vPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uHeat;
      varying vec3 vNormal;
      varying vec3 vPos;
      varying vec3 vView;
      ${NOISE}
      void main() {
        float n = fbm(vPos * 0.55 + vec3(0.0, uTime * 0.08, uTime * 0.05));
        float bands = fbm(vec3(vPos.y * 1.6 + n * 2.0, uTime * 0.05, 0.0));
        float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
        vec3 deep = vec3(0.55, 0.16, 0.03);
        vec3 hot = vec3(1.0, 0.66, 0.32);
        vec3 col = mix(deep, hot, smoothstep(0.35, 0.8, n * 0.7 + bands * 0.5));
        col += vec3(1.0, 0.85, 0.6) * fres * 1.4;
        gl_FragColor = vec4(col * (0.9 + 0.4 * uHeat), 1.0);
      }
    `,
  });
}

function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,190,120,0.9)');
  grad.addColorStop(0.18, 'rgba(255,150,70,0.35)');
  grad.addColorStop(0.5, 'rgba(255,120,50,0.08)');
  grad.addColorStop(1, 'rgba(255,120,50,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createObservatory() {
  const group = new THREE.Group();
  group.position.copy(CENTER);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 24), coreMaterial());
  group.add(core);

  const haloMap = haloTexture();
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: haloMap, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
  );
  halo.scale.setScalar(34);
  group.add(halo);

  const metal = new THREE.MeshStandardMaterial({ color: '#d9cdb8', metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c89a5a', metalness: 1, roughness: 0.35, envMapIntensity: 1.2 });
  const glow = new THREE.MeshBasicMaterial({ color: '#ffcf96' });

  const rings = [];
  const radii = [8.2, 10.6, 13.4];
  radii.forEach((r, i) => {
    const gimbal = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, i === 2 ? 0.16 : 0.1, 12, 220), i === 1 ? brass : metal);
    gimbal.add(ring);
    // A hairline of light riding just inside each ring.
    const line = new THREE.Mesh(new THREE.TorusGeometry(r - 0.32, 0.018, 6, 220), glow);
    gimbal.add(line);
    gimbal.rotation.set(0.4 + i * 0.7, i * 1.1, i * 0.35);
    group.add(gimbal);
    rings.push(gimbal);
  });

  // Dial ticks on the outer ring.
  const ticks = 96;
  const tickGeo = new THREE.BoxGeometry(0.07, 0.62, 0.07);
  const tickMesh = new THREE.InstancedMesh(tickGeo, metal, ticks);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const long = i % 8 === 0;
    p.set(Math.cos(a) * 14.1, Math.sin(a) * 14.1, 0);
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a - Math.PI / 2);
    s.set(1, long ? 1.8 : 1, 1);
    tickMesh.setMatrixAt(i, m.compose(p, q, s));
  }
  rings[2].add(tickMesh);

  // Two small moons on inclined orbits give the instrument scale.
  const moonMat = new THREE.MeshStandardMaterial({ color: '#9fb8d6', metalness: 0.2, roughness: 0.6 });
  const moons = [0, 1].map((i) => {
    const orbit = new THREE.Group();
    orbit.rotation.set(0.9 - i * 1.4, 0, 0.3 + i * 0.5);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.5 - i * 0.18, 24, 16), moonMat);
    moon.position.x = 18 + i * 4;
    orbit.add(moon);
    group.add(orbit);
    return orbit;
  });

  const key = new THREE.PointLight('#ffb36b', 220, 70, 1.6);
  group.add(key);

  return {
    group,
    stations: {
      home: {
        position: new THREE.Vector3(0, 3, 40),
        target: new THREE.Vector3(0, 0, 0),
        offset: -9,
        offsetNarrow: 0,
        mood: ['#ff9a4a', '#3f7dff'],
      },
    },
    emitter: CENTER.clone(),
    update(t, active) {
      core.material.uniforms.uTime.value = t;
      core.material.uniforms.uHeat.value += ((active ? 1 : 0.3) - core.material.uniforms.uHeat.value) * 0.05;
      core.rotation.y = t * 0.05;
      rings[0].rotation.y = t * 0.11;
      rings[1].rotation.x = 1.1 + t * 0.07;
      rings[2].rotation.z = t * 0.035;
      rings[2].rotation.y = 0.7 + Math.sin(t * 0.1) * 0.25;
      moons[0].rotation.y = t * 0.22;
      moons[1].rotation.y = -t * 0.15;
      halo.material.opacity = 0.85 + Math.sin(t * 0.7) * 0.08;
    },
    dispose() {
      haloMap.dispose();
    },
  };
}
