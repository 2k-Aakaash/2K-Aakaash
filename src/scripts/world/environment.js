// The universe around the route: a procedural nebula sky, a twinkling star shell, drifting
// foreground dust for parallax, and a small generated environment map for reflections.
import * as THREE from 'three';
import { NOISE, POINT_FRAG } from './glsl.js';

const MAX_STARS = 8000;
const MAX_DUST = 1300;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nebula(octaves) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    defines: { OCTAVES: octaves },
    uniforms: {
      uTime: { value: 0 },
      uTintA: { value: new THREE.Color('#ff9a4a') },
      uTintB: { value: new THREE.Color('#3f7dff') },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uTintA;
      uniform vec3 uTintB;
      uniform float uIntensity;
      varying vec3 vDir;
      ${NOISE}
      void main() {
        vec3 d = normalize(vDir);
        float t = uTime * 0.004;
        float n = fbm(d * 2.2 + vec3(t, 0.0, -t));
        float m = fbm(d * 4.0 - vec3(0.0, t * 1.5, 0.0) + n * 1.4);
        // Two broad clouds on opposite sides of the sky, kept dim so text stays readable.
        float a = smoothstep(0.45, 0.95, n + 0.35 * d.x - 0.15 * d.y) * m;
        float b = smoothstep(0.5, 0.95, m + 0.3 * -d.x + 0.2 * d.z) * n;
        vec3 col = vec3(0.012, 0.014, 0.026);
        col += uTintA * a * 0.16 * uIntensity;
        col += uTintB * b * 0.13 * uIntensity;
        col += vec3(0.6, 0.65, 0.8) * pow(max(m - 0.55, 0.0), 2.0) * 0.08;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function starField(random) {
  const positions = new Float32Array(MAX_STARS * 3);
  const colors = new Float32Array(MAX_STARS * 3);
  const sizes = new Float32Array(MAX_STARS);
  const phases = new Float32Array(MAX_STARS);
  const warm = new THREE.Color('#ffd7a8');
  const cool = new THREE.Color('#bcd6ff');
  const white = new THREE.Color('#ffffff');
  const tmp = new THREE.Color();
  for (let i = 0; i < MAX_STARS; i++) {
    // Shell around the whole route (which runs from z = 0 to roughly z = -1010).
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const r = 700 + random() * 900;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(theta);
    positions[i * 3 + 1] = r * u * 0.7;
    positions[i * 3 + 2] = r * s * Math.sin(theta) - 520;
    const k = random();
    tmp.copy(white).lerp(k < 0.5 ? warm : cool, Math.abs(k - 0.5) * 1.6);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    sizes[i] = random() < 0.04 ? 3.2 + random() * 2.5 : 0.8 + random() * 1.6;
    phases[i] = random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aSize;
      attribute float aPhase;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = color;
        vAlpha = 0.55 + 0.45 * sin(uTime * (0.6 + fract(aPhase) * 1.2) + aPhase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * 1.6;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: POINT_FRAG,
    vertexColors: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

// Dust lives in a box that wraps around the camera, so there is always foreground parallax.
function dustField(random) {
  const seeds = new Float32Array(MAX_DUST * 3);
  for (let i = 0; i < MAX_DUST * 3; i++) seeds[i] = random();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uCamera: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(120, 70, 160) },
      uPixelRatio: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uCamera;
      uniform vec3 uBox;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position * uBox + vec3(0.0, uTime * 0.25, uTime * 0.6) * fract(position.x * 7.0);
        p = mod(p - uCamera + uBox * 0.5, uBox) - uBox * 0.5 + uCamera;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        vColor = mix(vec3(1.0, 0.82, 0.6), vec3(0.7, 0.85, 1.0), fract(position.y * 13.0));
        // Fade in from the far edge and out right in front of the lens.
        vAlpha = smoothstep(80.0, 30.0, depth) * smoothstep(1.5, 8.0, depth) * 0.55;
        gl_PointSize = (1.2 + fract(position.z * 17.0) * 2.0) * uPixelRatio * (40.0 / max(depth, 1.0));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: POINT_FRAG,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

// A dark studio with a warm key strip and a cool rim strip, baked to a PMREM map once.
function environmentMap(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040508');
  const strip = (color, intensity, pos, rot, w, h) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    scene.add(mesh);
  };
  strip('#ffb35c', 6, [-6, 4, 2], [0, Math.PI / 2.4, 0], 3, 10);
  strip('#86d2ff', 3.5, [6, 1, -3], [0, -Math.PI / 2.2, 0], 2, 12);
  strip('#ffffff', 1.4, [0, 8, 0], [Math.PI / 2, 0, 0], 12, 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.04, 0.1, 100, { size: 128 }); // small is plenty for dark metal
  pmrem.dispose();
  scene.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return target;
}

export function createEnvironment(renderer, scene, settings) {
  const random = rng(20240420);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), nebula(settings.octaves));
  sky.scale.setScalar(3000);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  const stars = starField(random);
  const dust = dustField(random);
  scene.add(sky, stars, dust);

  let envTarget = null;
  scene.fog = new THREE.FogExp2('#05060b', 0.0058);

  const tintA = new THREE.Color();
  const tintB = new THREE.Color();

  return {
    /** Bake the reflection map. Separate from construction so the caller can yield first. */
    bakeReflections() {
      envTarget = environmentMap(renderer);
      scene.environment = envTarget.texture;
    },
    applyQuality(next) {
      stars.geometry.setDrawRange(0, next.stars);
      dust.geometry.setDrawRange(0, next.dust);
      if (sky.material.defines.OCTAVES !== next.octaves) {
        sky.material.defines.OCTAVES = next.octaves;
        sky.material.needsUpdate = true;
      }
    },
    setPixelRatio(dpr) {
      stars.material.uniforms.uPixelRatio.value = dpr;
      dust.material.uniforms.uPixelRatio.value = dpr;
    },
    /** Region mood: lerp the nebula tints toward the active sector's palette. */
    setMood(a, b, k) {
      tintA.set(a);
      tintB.set(b);
      sky.material.uniforms.uTintA.value.lerp(tintA, k);
      sky.material.uniforms.uTintB.value.lerp(tintB, k);
    },
    update(time, camera) {
      sky.position.copy(camera.position);
      sky.material.uniforms.uTime.value = time;
      stars.material.uniforms.uTime.value = time;
      dust.material.uniforms.uTime.value = time;
      dust.material.uniforms.uCamera.value.copy(camera.position);
    },
    dispose() {
      [sky, stars, dust].forEach((o) => {
        o.geometry.dispose();
        o.material.dispose();
        scene.remove(o);
      });
      envTarget?.dispose();
    },
  };
}
