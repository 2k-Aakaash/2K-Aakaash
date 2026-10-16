// Featured work. Every claim here was checked against the project's source code or README.
// `artifact` picks the 3D object that represents the project in the Orbit of work; `image`
// names a file in src/assets (optional). Add a project by adding an entry: the page section,
// its case file dialog and its place in the world are all generated from this list.

export const PROJECTS = [
  {
    id: 'iweb',
    name: 'iWeb',
    kind: 'Chrome extension · React',
    artifact: 'browser',
    image: 'iweb',
    imageAlt: 'iWeb new tab dashboard with clock, search and widgets over a wallpaper',
    summary:
      'A macOS-style new tab for Chrome: a personal dashboard with live widgets, a Spotlight launcher, a Markets app and a music player.',
    problem:
      'The default new tab is a blank page and a search box. iWeb turns it into a calm, useful home screen without sending anyone to another app.',
    role: 'Design, development and release engineering',
    stack: ['React 19', 'Vite', 'Manifest V3', 'IndexedDB', 'Web Workers', 'Vercel Functions', 'GitHub Actions', 'Vitest'],
    features: [
      'Smart Stack widgets for weather, currency, gold & silver and Indian markets',
      'Spotlight (Ctrl+K) with a hybrid FlexSearch + Fuse engine in a web worker and inline answers',
      'Markets app: NSE/BSE watchlist and charts through a validated, CDN-cached Yahoo Finance proxy',
      'Unsplash wallpapers through a server-side proxy, plus a local music player with a Dynamic Island',
    ],
    challenges: [
      'Unpacked extensions cannot update themselves, so iWeb ships its own updater: it reads the latest GitHub release, verifies the zip’s SHA-256 and writes the files through the File System Access API.',
      'A daily wallpaper quota that has to hold across many open tabs, enforced inside a single IndexedDB transaction.',
      'A CI pipeline that tests, versions from commit messages, builds, checksums and publishes a GitHub release on every push.',
    ],
    outcomes: [
      'Grew from a vanilla JS homepage (started July 2023) into a React extension with 19 test files',
      'Released automatically to github.com/2k-Aakaash/iWeb',
    ],
    links: [
      { label: 'Website', href: 'https://iweb-landing.vercel.app' },
      { label: 'Source', href: 'https://github.com/2k-Aakaash/iweb-react' },
      { label: 'Releases', href: 'https://github.com/2k-Aakaash/iWeb/releases' },
    ],
    mood: ['#ff9f5a', '#5d8bff'],
  },
  {
    id: 'cutthatout',
    name: 'CutThatOut',
    kind: 'In-browser AI tool · React',
    artifact: 'cutout',
    summary:
      'An AI background remover that runs entirely in the browser, so images never leave the device, with brushes to retouch the result by hand.',
    problem:
      'Most background removers upload your photos to a server. CutThatOut runs the model locally and still gives precise manual control.',
    role: 'Design and development',
    stack: ['React 19', 'React Compiler', 'Vite', 'Tailwind v4', 'ONNX Runtime Web', 'WebGPU'],
    features: [
      'Background removal on the GPU (WebGPU) with an automatic CPU fallback and model preloading',
      'A WebGPU capability tester that detects the adapter and GPU tier',
      'Erase, recover and inpaint brushes, with a hand-written Telea-style inpainting routine',
      'Undo/redo history (Ctrl+Z / Ctrl+Y), zoom and pan canvas, and a layer dock',
    ],
    challenges: [
      'Choosing between WebGPU and CPU at runtime and avoiding races while the model downloads.',
      'Pixel-level canvas work for the brushes and inpainting without blocking the interface.',
    ],
    outcomes: [],
    links: [
      { label: 'Live', href: 'https://cutthatout.vercel.app' },
      { label: 'Source', href: 'https://github.com/2k-Aakaash/CutThatOut' },
    ],
    mood: ['#7cf0c8', '#8f6bff'],
  },
  {
    id: 'sprintora',
    name: 'Sprintora',
    kind: 'Peer-to-peer web app · React',
    artifact: 'p2p',
    image: 'sprintora',
    imageAlt: 'Sprintora file sharing interface',
    summary:
      'Peer-to-peer file sharing and chat in the browser. Files go directly from one device to the other, with nothing stored on a server.',
    problem: 'Sending a file to the person next to you shouldn’t need an upload, an account or a cloud drive.',
    role: 'Design and development',
    stack: ['React', 'Vite', 'PeerJS (WebRTC)', 'Ant Design'],
    features: [
      'Connect with a generated peer ID and approve incoming connections',
      'Per-file consent: the receiver accepts or rejects, and the sender is told either way',
      'Accepted files arrive as downloadable blobs, with transfer progress',
      'A chat sidebar alongside the transfer',
    ],
    challenges: ['Coordinating connection, consent and transfer state between two peers in real time.'],
    outcomes: ['Iterated across three versions (New-Sprintora, Test-Sprintora, Sprintora) during 2024'],
    links: [
      { label: 'Live', href: 'https://sprintora.vercel.app' },
      { label: 'Source', href: 'https://github.com/2k-Aakaash/Sprintora' },
    ],
    mood: ['#ffd36e', '#3fb7ff'],
  },
  {
    id: 'wanderlog',
    name: 'WanderLog',
    kind: 'Web & desktop app · React + Electron',
    artifact: 'globe',
    summary:
      'A travel diary and itinerary planner that runs on the web and as a desktop app from one codebase.',
    problem: 'Travel notes end up scattered across apps. WanderLog keeps diaries and itineraries together, online or on the desktop.',
    role: 'Design and development (in active development)',
    stack: ['React 19', 'Vite', 'Electron', 'Firebase Auth', 'Firestore', 'Tiptap', 'MUI', 'Tailwind v4'],
    features: [
      'Rich-text diary editor and itinerary pages',
      'Google and email/password sign-in, with diaries stored per user in Firestore',
      'Encrypted .wl export and import for backups',
      'A theme system shared by the web and desktop builds',
    ],
    challenges: ['Shipping one React codebase to both the browser and an Electron desktop build.'],
    outcomes: [],
    links: [
      { label: 'Live', href: 'https://wanderlog-iota.vercel.app' },
      { label: 'Source', href: 'https://github.com/2k-Aakaash/WanderLog' },
    ],
    mood: ['#ff8a6b', '#4fd1c5'],
  },
  {
    id: 'diskette',
    name: 'Diskette',
    kind: 'Notes app · React + Firebase',
    artifact: 'disk',
    summary: 'A Markdown notes app with search and archiving that exports any note to PDF, Word, Markdown or plain text.',
    problem: 'Notes are only useful if they can leave the app. Diskette writes in Markdown and exports to the formats people actually send.',
    role: 'Design and development',
    stack: ['React', 'Vite', 'MUI', 'Firebase', 'Firestore', 'react-pdf', 'docx'],
    features: [
      'Create, edit, archive and search Markdown notes',
      'Export to PDF, DOCX, MD and TXT',
      'Delete confirmation, profile modal and theming',
      'Firestore security rules and Firebase Hosting CI',
    ],
    challenges: ['Generating PDF and Word documents in the browser from Markdown content.'],
    outcomes: [],
    links: [
      { label: 'Live', href: 'https://diskette.vercel.app' },
      { label: 'Source', href: 'https://github.com/2k-Aakaash/Diskette-Git' },
    ],
    mood: ['#c9a4ff', '#ffb35c'],
  },
];

// Smaller and earlier projects, listed without a 3D artifact.
export const ARCHIVE = [
  { name: 'iWeb (original)', note: 'Vanilla JS homepage & extension, MET Norway weather, Vibrant colours, PWA', href: 'https://github.com/2k-Aakaash/iWeb' },
  { name: 'Forecast.io', note: 'Weather app with geolocation and city search', href: 'https://forecast-io.vercel.app/' },
  { name: 'Auto Tone Blender', note: 'Random CSS gradient generator with copy and undo', href: 'https://autotoneblender.vercel.app' },
  { name: 'NotesApp', note: 'Vanilla JS notes with search', href: 'https://2k-aakaash.github.io/NotesApp/' },
  { name: 'Aptitude Cheatsheet', note: 'Five-section aptitude reference', href: 'https://aptitude-lyart.vercel.app' },
];
