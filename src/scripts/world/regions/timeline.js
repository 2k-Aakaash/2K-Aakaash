// Journey: milestones as beacons on a rising helix, with a pulse of light travelling the path.
import * as THREE from 'three';

export const CENTER = new THREE.Vector3(-60, 6, -880);

export function createTimeline(count) {
  const group = new THREE.Group();
  group.position.copy(CENTER);

  const R = 12;
  const turns = 1.6;
  const height = 30;
  const at = (u) => {
    const a = u * turns * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * R, (u - 0.5) * height, Math.sin(a) * R);
  };
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 64 }, (_, i) => at(i / 63)));
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 400, 0.07, 6, false),
    new THREE.MeshBasicMaterial({ color: '#ffb35c', transparent: true, opacity: 0.55 }),
  );
  group.add(tube);

  const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 40);
  const coreGeo = new THREE.SphereGeometry(0.32, 16, 12);
  const ringMat = new THREE.MeshStandardMaterial({ color: '#e8dcc6', metalness: 1, roughness: 0.3 });
  const beacons = Array.from({ length: count }, (_, i) => {
    const u = count > 1 ? i / (count - 1) : 0.5;
    const b = new THREE.Group();
    b.position.copy(curve.getPoint(u));
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: i === count - 1 ? '#86d2ff' : '#ffcf96' }));
    b.add(ring, core);
    group.add(b);
    return { b, ring, u };
  });

  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  group.add(pulse);
  const glow = new THREE.PointLight('#ffb35c', 60, 30, 1.8);
  pulse.add(glow);

  return {
    group,
    stations: {
      journey: {
        position: CENTER.clone().add(new THREE.Vector3(10, 4, 66)),
        target: CENTER.clone(),
        offset: -10,
        offsetNarrow: 0,
        mood: ['#ffb35c', '#86d2ff'],
      },
    },
    emitter: CENTER.clone(),
    update(t, active) {
      const u = (t * (active ? 0.07 : 0.03)) % 1;
      curve.getPoint(u, pulse.position);
      beacons.forEach(({ b, ring, u: bu }) => {
        const near = Math.max(0, 1 - Math.abs(u - bu) * 12);
        ring.rotation.y = t * 0.6 + bu * 6;
        b.scale.setScalar(1 + near * 0.6);
      });
      group.rotation.y = t * 0.04;
    },
  };
}
