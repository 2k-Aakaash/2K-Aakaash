// Orbit of work: one artifact per featured project, each shaped by what the project does.
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function slab(w, h, r, depth) {
  const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function imageTexture(url) {
  if (!url) return null;
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const FONT = "'Manrope Variable', system-ui, sans-serif";
const MONO = "'JetBrains Mono Variable', monospace";

// ── iWeb: a glass browser window with orbiting Smart Stack tiles ─────────────────────────

function browser({ image }) {
  const group = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#0e111a',
    metalness: 0.3,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.4,
  });
  const frame = new THREE.Mesh(slab(26, 17, 1.4, 0.7), glass);
  group.add(frame);

  const screenMap =
    imageTexture(image) ||
    canvasTexture(1024, 600, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1d3b8f');
      grad.addColorStop(1, '#6b2eb8');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(24.4, 13.9), new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false }));
  screen.position.set(0, -0.9, 0.5);
  group.add(screen);

  const dotColors = ['#ff5f57', '#febc2e', '#28c840'];
  dotColors.forEach((c, i) => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.32, 20), new THREE.MeshBasicMaterial({ color: c }));
    dot.position.set(-11.6 + i * 1.05, 7.4, 0.5);
    group.add(dot);
  });

  const tiles = [
    { label: 'Weather', value: '31°', a: '#2f6bff', b: '#7aa8ff' },
    { label: 'USD → INR', value: '₹83', a: '#0f7a5a', b: '#36c79a' },
    { label: 'Gold 24K', value: '₹/g', a: '#8a5a12', b: '#e3b04b' },
    { label: 'NIFTY 50', value: '▲', a: '#3b2a7a', b: '#8c6bff' },
  ].map((tile, i) => {
    const map = canvasTexture(256, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, tile.a);
      grad.addColorStop(1, tile.b);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.font = `600 26px ${FONT}`;
      g.fillText(tile.label, 26, 50);
      g.fillStyle = '#fff';
      g.font = `700 76px ${FONT}`;
      g.fillText(tile.value, 24, 160);
    });
    const mat = new THREE.MeshPhysicalMaterial({ map, roughness: 0.35, clearcoat: 0.8, envMapIntensity: 0.8 });
    const mesh = new THREE.Mesh(slab(5, 5, 1, 0.5), [mat, new THREE.MeshStandardMaterial({ color: tile.a, roughness: 0.5 })]);
    group.add(mesh);
    return { mesh, phase: i * (Math.PI / 2) };
  });

  // UVs of ExtrudeGeometry front faces are in shape units; remap them to 0..1 for the tile art.
  tiles.forEach(({ mesh }) => {
    const uv = mesh.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 5 + 0.5, uv.getY(i) / 5 + 0.5);
    uv.needsUpdate = true;
  });

  return {
    group,
    update(t, active) {
      group.rotation.y = -0.32 + Math.sin(t * 0.3) * 0.06;
      group.rotation.x = Math.sin(t * 0.25) * 0.03;
      tiles.forEach(({ mesh, phase }, i) => {
        const a = t * 0.32 + phase;
        const r = active ? 16.5 : 14.5;
        mesh.position.set(Math.cos(a) * r, Math.sin(a * 1.3) * 3 + (i - 1.5) * 1.2, Math.sin(a) * 4 - 1);
        mesh.rotation.set(0, -group.rotation.y + Math.sin(a) * 0.3, 0);
      });
    },
  };
}

// ── CutThatOut: the background is wiped away while the subject lifts off as a layer ──────

function drawPlant(g, w, h) {
  // A potted plant silhouette: easy to read, nobody's likeness.
  g.fillStyle = '#c96f3b';
  g.beginPath();
  g.moveTo(w * 0.38, h * 0.62);
  g.lineTo(w * 0.62, h * 0.62);
  g.lineTo(w * 0.58, h * 0.86);
  g.lineTo(w * 0.42, h * 0.86);
  g.closePath();
  g.fill();
  g.fillStyle = '#a95a2c';
  g.fillRect(w * 0.36, h * 0.6, w * 0.28, h * 0.035);
  const leaves = [
    [0.5, 0.36, 0.06, 0.2, 0],
    [0.42, 0.42, 0.05, 0.17, -0.7],
    [0.58, 0.42, 0.05, 0.17, 0.7],
    [0.36, 0.5, 0.045, 0.14, -1.1],
    [0.64, 0.5, 0.045, 0.14, 1.1],
    [0.47, 0.28, 0.04, 0.12, -0.25],
  ];
  leaves.forEach(([x, y, rx, ry, rot], i) => {
    g.fillStyle = i % 2 ? '#2f9e62' : '#3fbf76';
    g.beginPath();
    g.ellipse(w * x, h * y, w * rx, h * ry, rot, 0, Math.PI * 2);
    g.fill();
  });
}

function cutout() {
  const group = new THREE.Group();
  const W = 20;
  const H = 13;
  const backMap = canvasTexture(1024, 666, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f5c9a3');
    grad.addColorStop(0.5, '#e98e7a');
    grad.addColorStop(1, '#6d5bd0');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 6; i++) g.fillRect(w * (0.08 + i * 0.16), h * 0.1, w * 0.06, h * 0.8);
  });
  const subjectMap = canvasTexture(1024, 666, drawPlant);

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.ShaderMaterial({
      uniforms: { tMap: { value: backMap }, uSplit: { value: 0.5 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D tMap;
        uniform float uSplit;
        varying vec2 vUv;
        void main() {
          vec3 img = texture2D(tMap, vUv).rgb;
          // Transparency checkerboard where the background has been removed.
          vec2 cell = floor(vUv * vec2(26.0, 17.0));
          float check = mod(cell.x + cell.y, 2.0);
          vec3 board = mix(vec3(0.16, 0.17, 0.21), vec3(0.24, 0.25, 0.3), check);
          float removed = step(vUv.x, uSplit);
          vec3 col = mix(img, board, removed);
          float line = smoothstep(0.006, 0.0, abs(vUv.x - uSplit));
          col += vec3(0.5, 1.0, 0.85) * line * 1.5;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `,
      toneMapped: false,
    }),
  );
  group.add(back);

  const subject = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: subjectMap, transparent: true, toneMapped: false, depthWrite: false }),
  );
  subject.position.z = 0.05;
  group.add(subject);

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, H + 2.4),
    new THREE.MeshBasicMaterial({ color: '#8ff5d6', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  scan.position.z = 0.3;
  group.add(scan);

  const frame = new THREE.Mesh(
    slab(W + 1.2, H + 1.2, 0.8, 0.4),
    new THREE.MeshStandardMaterial({ color: '#12141c', metalness: 0.6, roughness: 0.4 }),
  );
  frame.position.z = -0.35;
  group.add(frame);

  let lift = 0;
  return {
    group,
    update(t, active) {
      const sweep = 0.5 + 0.5 * Math.sin(t * 0.55);
      back.material.uniforms.uSplit.value = sweep;
      scan.position.x = (sweep - 0.5) * W;
      lift += ((active ? 1 : 0.25) - lift) * 0.04;
      subject.position.z = 0.05 + lift * 4.5;
      subject.position.x = lift * 1.4;
      group.rotation.y = -0.42 + Math.sin(t * 0.2) * 0.05;
    },
  };
}

// ── Sprintora: two peers and a stream of packets between them ────────────────────────────

function p2p({ image }) {
  const group = new THREE.Group();
  const nodes = [-11, 11].map((x, i) => {
    const node = new THREE.Group();
    node.position.set(x, i ? 1.5 : -1.5, 0);
    const shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.2, 1)),
      new THREE.LineBasicMaterial({ color: i ? '#86d2ff' : '#ffd36e', transparent: true, opacity: 0.85 }),
    );
    const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 4), new THREE.MeshBasicMaterial({ color: i ? '#bfe6ff' : '#ffe2a3' }));
    node.add(shell, heart);
    group.add(node);
    return node;
  });

  const curve = new THREE.QuadraticBezierCurve3(nodes[0].position.clone(), new THREE.Vector3(0, 7, 3), nodes[1].position.clone());
  const COUNT = 320;
  const offsets = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    offsets[i * 3] = Math.random();
    offsets[i * 3 + 1] = (Math.random() - 0.5) * 2;
    offsets[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(offsets, 3));
  const stream = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: '#ffe9c2', size: 0.28, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  stream.frustumCulled = false;
  group.add(stream);

  const packets = Array.from({ length: 5 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.12), new THREE.MeshStandardMaterial({ color: '#f4efe6', emissive: '#ffcf80', emissiveIntensity: 0.6, roughness: 0.4 }));
    group.add(m);
    return { m, phase: i / 5 };
  });

  const map = imageTexture(image);
  if (map) {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.32, toneMapped: false, depthWrite: false }));
    screen.position.set(0, -7.5, -6);
    group.add(screen);
  }

  const pos = geo.attributes.position;
  const p = new THREE.Vector3();
  return {
    group,
    update(t, active) {
      const speed = active ? 0.22 : 0.08;
      for (let i = 0; i < COUNT; i++) {
        const u = (offsets[i * 3] + t * speed) % 1;
        curve.getPoint(u, p);
        const spread = Math.sin(u * Math.PI) * 1.2;
        pos.setXYZ(i, p.x, p.y + offsets[i * 3 + 1] * spread, p.z + offsets[i * 3 + 2] * spread);
      }
      pos.needsUpdate = true;
      packets.forEach(({ m, phase }) => {
        const u = (phase + t * speed * 0.6) % 1;
        curve.getPoint(u, m.position);
        m.rotation.set(t, t * 0.7, 0);
        m.scale.setScalar(Math.sin(u * Math.PI));
      });
      nodes.forEach((n, i) => {
        n.rotation.y = t * (i ? -0.3 : 0.3);
        n.children[1].scale.setScalar(1 + Math.sin(t * 3 + i * Math.PI) * 0.08);
      });
      group.rotation.y = -0.25 + Math.sin(t * 0.22) * 0.08;
    },
  };
}

// ── WanderLog: a wire globe with routes being drawn between places ───────────────────────

function globe() {
  const group = new THREE.Group();
  const R = 9;
  const lines = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const r = R * Math.cos((lat * Math.PI) / 180);
    const y = R * Math.sin((lat * Math.PI) / 180);
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const b = ((i + 1) / 96) * Math.PI * 2;
      lines.push(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(b) * r, y, Math.sin(b) * r);
    }
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const o = (lon * Math.PI) / 180;
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const b = ((i + 1) / 96) * Math.PI * 2;
      lines.push(
        Math.cos(a) * R * Math.cos(o), Math.sin(a) * R, Math.cos(a) * R * Math.sin(o),
        Math.cos(b) * R * Math.cos(o), Math.sin(b) * R, Math.cos(b) * R * Math.sin(o),
      );
    }
  }
  const grid = new THREE.BufferGeometry();
  grid.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  const wire = new THREE.LineSegments(grid, new THREE.LineBasicMaterial({ color: '#4fd1c5', transparent: true, opacity: 0.35 }));
  const body = new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 48, 32), new THREE.MeshStandardMaterial({ color: '#081217', roughness: 0.8, metalness: 0.1 }));
  const spin = new THREE.Group();
  spin.add(body, wire);
  group.add(spin);

  const toVec = (lat, lon, r = R) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180;
    return new THREE.Vector3(Math.cos(la) * Math.cos(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.sin(lo) * r);
  };
  const places = [
    [13.1, 80.3],
    [35.7, 139.7],
    [48.9, 2.35],
    [-33.9, 151.2],
    [40.7, -74],
  ].map(([la, lo]) => toVec(la, lo));
  places.forEach((p) => {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffb35c' }));
    pin.position.copy(p);
    spin.add(pin);
  });

  const routes = [];
  for (let i = 0; i < places.length - 1; i++) {
    const a = places[i];
    const b = places[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.45);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#ff8a6b' }));
    spin.add(line);
    routes.push({ geo, curve });
  }
  const traveller = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  spin.add(traveller);
  spin.rotation.x = 0.35;

  return {
    group,
    update(t) {
      spin.rotation.y = t * 0.08 - 1.2;
      const total = routes.length;
      const k = (t * 0.12) % total;
      const current = Math.floor(k);
      routes.forEach(({ geo }, i) => {
        geo.setDrawRange(0, i < current ? 81 : i === current ? Math.floor((k - current) * 81) : 0);
      });
      routes[current].curve.getPoint(k - current, traveller.position);
    },
  };
}

// ── Diskette: a floppy whose exports fan out as pages ────────────────────────────────────

function disk() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  const s = 7;
  shape.moveTo(-s, -s);
  shape.lineTo(s, -s);
  shape.lineTo(s, s - 1.2);
  shape.lineTo(s - 1.2, s);
  shape.lineTo(-s, s);
  shape.closePath();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }),
    new THREE.MeshPhysicalMaterial({ color: '#24212e', roughness: 0.55, clearcoat: 0.4, envMapIntensity: 0.9 }),
  );
  body.position.z = -0.35;
  group.add(body);

  const shutter = new THREE.Mesh(
    new THREE.BoxGeometry(7, 4.6, 0.9),
    new THREE.MeshStandardMaterial({ color: '#cfd3da', metalness: 1, roughness: 0.25 }),
  );
  shutter.position.set(0.6, 4.4, 0);
  group.add(shutter);

  const labelMap = canvasTexture(512, 300, (g, w, h) => {
    g.fillStyle = '#f2ece0';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9a4ff';
    g.fillRect(0, 0, w, 34);
    g.fillStyle = '#1b1922';
    g.font = `700 54px ${FONT}`;
    g.fillText('Diskette', 28, 112);
    g.font = `400 26px ${MONO}`;
    g.fillStyle = '#5a5566';
    ['# notes.md', '- [x] export to PDF', '- [ ] archive'].forEach((line, i) => g.fillText(line, 28, 170 + i * 40));
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 6.1), new THREE.MeshStandardMaterial({ map: labelMap, roughness: 0.9 }));
  label.position.set(0, -2.6, 0.46);
  group.add(label);

  const formats = ['PDF', 'DOCX', 'MD', 'TXT'].map((name, i) => {
    const map = canvasTexture(256, 330, (g, w, h) => {
      g.fillStyle = '#f7f4ee';
      g.fillRect(0, 0, w, h);
      g.fillStyle = ['#ff6b5a', '#4a8cff', '#a98bff', '#8a8f99'][i];
      g.fillRect(0, h - 70, w, 70);
      g.fillStyle = '#fff';
      g.font = `700 40px ${FONT}`;
      g.fillText(name, 24, h - 22);
      g.fillStyle = '#d6d1c7';
      for (let l = 0; l < 7; l++) g.fillRect(24, 36 + l * 26, w - 48 - (l % 3) * 30, 9);
    });
    const page = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6), new THREE.MeshStandardMaterial({ map, roughness: 0.85, side: THREE.DoubleSide }));
    group.add(page);
    return page;
  });

  let fan = 0;
  return {
    group,
    update(t, active) {
      fan += ((active ? 1 : 0) - fan) * 0.035;
      shutter.position.x = 0.6 - fan * 2.4;
      formats.forEach((page, i) => {
        const a = (i - 1.5) * 0.42 * fan;
        page.position.set(6 + fan * 2.6 + i * 0.55 * fan, -1 + Math.sin(t * 0.8 + i) * 0.3, -1 - i * 0.3);
        page.rotation.set(0, -0.4, -a);
        page.visible = fan > 0.02;
      });
      group.rotation.y = -0.35 + Math.sin(t * 0.25) * 0.08;
      group.rotation.x = -0.08;
    },
  };
}

const BUILDERS = { browser, cutout, p2p, globe, disk };

export const WORK_START = new THREE.Vector3(36, -2, -230);

export function projectCenter(i) {
  return new THREE.Vector3(48 + Math.sin(i * 1.7) * 14, -6 + Math.cos(i * 1.3) * 6, -300 - i * 80);
}

export function createArtifacts(projects, images) {
  const group = new THREE.Group();
  const items = [];
  const stations = {
    work: {
      position: new THREE.Vector3(4, 16, -212),
      target: new THREE.Vector3(52, -6, -340),
      offset: -7,
      offsetNarrow: 0,
      mood: ['#ffb35c', '#5d8bff'],
    },
  };

  projects.forEach((project, i) => {
    const build = BUILDERS[project.artifact];
    if (!build) return;
    const art = build({ image: images[project.id] });
    const center = projectCenter(i);
    art.group.position.copy(center);
    group.add(art.group);
    art.group.traverse((o) => {
      o.userData.projectId = project.id;
    });
    items.push({ id: project.id, art, center, hover: 0 });
    stations[`project:${project.id}`] = {
      position: center.clone().add(new THREE.Vector3(-6, 3, 52)),
      target: center.clone(),
      offset: -9,
      offsetNarrow: 0,
      mood: project.mood,
    };
  });

  // Faint orbit line threading the artifacts together.
  const path = new THREE.CatmullRomCurve3([WORK_START, ...items.map((it) => it.center)]);
  const orbit = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(path.getPoints(240)),
    new THREE.LineDashedMaterial({ color: '#ffb35c', dashSize: 1.2, gapSize: 2.4, transparent: true, opacity: 0.35 }),
  );
  orbit.computeLineDistances();
  group.add(orbit);

  return {
    group,
    stations,
    items,
    pickables: items.map((it) => it.art.group),
    emitters: items.map((it) => it.center),
    update(t, activeId, hoverId) {
      items.forEach((it) => {
        const target = it.id === hoverId ? 1 : 0;
        it.hover += (target - it.hover) * 0.12;
        it.art.group.scale.setScalar(1 + it.hover * 0.05);
        it.art.update(t, it.id === activeId);
      });
    },
  };
}
