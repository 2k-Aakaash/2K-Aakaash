// About: "The Lens". An eight-blade iris opens as the visitor arrives and reveals the 2K
// monogram, extruded from the brand SVG at runtime.
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export const CENTER = new THREE.Vector3(-58, 10, -120);
const BLADES = 8;

async function monogramGeometry() {
  const svg = await fetch('/2k.svg').then((r) => r.text());
  const d = svg.match(/<path[^>]*\sd="([^"]+)"/)?.[1];
  if (!d) throw new Error('monogram path not found');
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  const shapes = data.paths.flatMap((path) => path.toShapes(true));
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 7,
    bevelEnabled: true,
    bevelThickness: 0.9,
    bevelSize: 0.5,
    bevelSegments: 4,
    curveSegments: 18,
  });
  geometry.center();
  // SVG y points down. Rotate (not mirror) so face winding, and therefore lighting, stays correct.
  geometry.rotateX(Math.PI);
  geometry.scale(0.2, 0.2, 0.2);
  return geometry;
}

function bladeShape() {
  // A curved blade: the inner edge forms the aperture as the blades rotate together.
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.absarc(0, 0, 11, 0, Math.PI * 0.42, false);
  s.quadraticCurveTo(-1.5, 6, -2.5, 2.2);
  s.quadraticCurveTo(-1.2, 0.6, 0, 0);
  return s;
}

export function createLens() {
  const group = new THREE.Group();
  group.position.copy(CENTER);

  const barrelMat = new THREE.MeshStandardMaterial({ color: '#1b1e27', metalness: 0.9, roughness: 0.42, envMapIntensity: 1.2 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#d8ccb6', metalness: 1, roughness: 0.25 });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#14161d',
    metalness: 0.75,
    roughness: 0.38,
    side: THREE.DoubleSide,
    envMapIntensity: 1.1,
  });

  const barrel = new THREE.Mesh(new THREE.TorusGeometry(12.6, 1.4, 24, 160), barrelMat);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(11.3, 0.12, 8, 160), rimMat);
  const outer = new THREE.Mesh(new THREE.TorusGeometry(15.5, 0.05, 6, 200), new THREE.MeshBasicMaterial({ color: '#86d2ff' }));
  group.add(barrel, rim, outer);

  // Engraved focus scale on the barrel.
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), rimMat, 72);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    m.makeRotationZ(a - Math.PI / 2).setPosition(Math.cos(a) * 14.3, Math.sin(a) * 14.3, 0.9);
    if (i % 6 === 0) m.scale(new THREE.Vector3(1, 1.8, 1));
    ticks.setMatrixAt(i, m);
  }
  group.add(ticks);

  const blades = [];
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape(), { depth: 0.12, bevelEnabled: false, curveSegments: 24 });
  for (let i = 0; i < BLADES; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (i / BLADES) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.scale.setScalar(0.6); // keeps every blade inside the barrel's outer edge
    blade.position.set(6.4, 0, -0.8 + i * 0.02); // tiny z stagger avoids z-fighting where blades overlap
    pivot.add(blade);
    group.add(pivot);
    blades.push(blade);
  }

  const monogramMat = new THREE.MeshPhysicalMaterial({
    color: '#efe2cc',
    metalness: 0.35,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.6,
  });
  const monogram = new THREE.Mesh(new THREE.BufferGeometry(), monogramMat);
  monogram.position.z = -2;
  group.add(monogram);
  monogramGeometry()
    .then((geometry) => {
      monogram.geometry.dispose();
      monogram.geometry = geometry;
    })
    .catch(() => {
      // The lens still reads without the mark; nothing else depends on it.
    });

  const key = new THREE.PointLight('#ffd2a0', 140, 60, 1.6);
  key.position.set(10, 8, 14);
  const rimLight = new THREE.PointLight('#86d2ff', 90, 60, 1.6);
  rimLight.position.set(-12, -6, 8);
  const front = new THREE.PointLight('#fff1dc', 180, 70, 1.5);
  front.position.set(-4, 3, 24);
  group.add(key, rimLight, front);

  let open = 0;

  return {
    group,
    stations: {
      about: {
        position: CENTER.clone().add(new THREE.Vector3(6, 2, 64)),
        target: CENTER.clone(),
        offset: -10,
        offsetNarrow: 0,
        mood: ['#ff8c5a', '#4a6bff'],
      },
    },
    emitter: CENTER.clone(),
    update(t, active) {
      open += ((active ? 1 : 0) - open) * 0.04;
      const a = THREE.MathUtils.lerp(0.95, -0.15, open); // blades swing out to open the aperture
      blades.forEach((b) => {
        b.rotation.z = a;
      });
      monogram.rotation.y = Math.sin(t * 0.35) * 0.35;
      monogram.rotation.x = Math.sin(t * 0.22) * 0.08;
      monogram.position.z = THREE.MathUtils.lerp(-4, 1.5, open);
      group.rotation.z = t * 0.01;
      outer.rotation.z = -t * 0.04;
    },
    dispose() {},
  };
}
