// Skills, grouped for the Constellation. `evidence` keeps the claims honest:
//   'shipped' — used in a public project listed on this site
//   'stated'  — listed on the GitHub profile, not shown in a featured project here
// No proficiency percentages, by design.

export const SKILL_GROUPS = [
  {
    id: 'languages',
    title: 'Languages',
    skills: [
      { name: 'JavaScript (ES6+)', evidence: 'shipped' },
      { name: 'TypeScript', evidence: 'shipped' },
      { name: 'HTML', evidence: 'shipped' },
      { name: 'CSS', evidence: 'shipped' },
      { name: 'SCSS', evidence: 'stated' },
    ],
  },
  {
    id: 'frontend',
    title: 'Front-end',
    skills: [
      { name: 'React', evidence: 'shipped' },
      { name: 'Vite', evidence: 'shipped' },
      { name: 'Astro', evidence: 'shipped' },
      { name: 'Tailwind CSS', evidence: 'shipped' },
      { name: 'MUI', evidence: 'shipped' },
      { name: 'Ant Design', evidence: 'shipped' },
    ],
  },
  {
    id: 'motion',
    title: 'Motion & 3D',
    skills: [
      { name: 'GSAP', evidence: 'shipped' },
      { name: 'Three.js', evidence: 'shipped' },
      { name: 'Framer Motion', evidence: 'shipped' },
      { name: 'Lenis', evidence: 'shipped' },
      { name: 'Locomotive Scroll', evidence: 'stated' },
    ],
  },
  {
    id: 'platform',
    title: 'Browser platform',
    skills: [
      { name: 'Chrome Extensions (MV3)', evidence: 'shipped' },
      { name: 'IndexedDB', evidence: 'shipped' },
      { name: 'Web Workers', evidence: 'shipped' },
      { name: 'WebRTC / PeerJS', evidence: 'shipped' },
      { name: 'WebGPU / ONNX Runtime', evidence: 'shipped' },
      { name: 'File System Access API', evidence: 'shipped' },
      { name: 'Electron', evidence: 'shipped' },
    ],
  },
  {
    id: 'backend',
    title: 'Backend & cloud',
    skills: [
      { name: 'Firebase', evidence: 'shipped' },
      { name: 'Firestore', evidence: 'shipped' },
      { name: 'Vercel Functions', evidence: 'shipped' },
      { name: 'Vercel', evidence: 'shipped' },
      { name: 'Netlify', evidence: 'stated' },
    ],
  },
  {
    id: 'tooling',
    title: 'Tooling & practice',
    skills: [
      { name: 'Git & GitHub', evidence: 'shipped' },
      { name: 'GitHub Actions', evidence: 'shipped' },
      { name: 'Vitest', evidence: 'shipped' },
      { name: 'Lighthouse', evidence: 'stated' },
      { name: 'Webpack', evidence: 'stated' },
      { name: 'Babel', evidence: 'stated' },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    skills: [
      { name: 'Figma', evidence: 'stated' },
      { name: 'UI/UX design', evidence: 'shipped' },
      { name: 'Design systems', evidence: 'shipped' },
    ],
  },
];
