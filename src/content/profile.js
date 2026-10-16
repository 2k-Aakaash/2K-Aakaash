// Single source of truth for who the portfolio is about. Everything here comes from the
// previous portfolio, the GitHub profile (github.com/2k-Aakaash) and public repositories.
// Edit freely; the page and the structured data are generated from it.

export const PROFILE = {
  name: 'Aakaash',
  brand: '2K Aakaash',
  role: 'Front-end developer & UI/UX designer',
  location: 'Tamil Nadu, India',
  url: 'https://2k-aakaash.vercel.app',
  available: true, // shows the "Open for new projects" signal
  githubSince: '2023-04',

  headline: 'Front-end developer and UI/UX designer building interfaces people want to keep open.',
  intro:
    'I design and build web products end to end: from the first Figma frame to the shipped extension, ' +
    'landing page or app, with motion and detail treated as part of the product rather than decoration.',

  about: [
    'I’m Aakaash, a front-end developer and UI/UX designer from Tamil Nadu, India. I work across the whole ' +
      'surface of a product: the visual design, the interaction, and the code that makes it fast.',
    'Most of what I build lives in the browser. iWeb, a macOS-style new tab for Chrome, grew from a ' +
      'small HTML project into a React extension with live widgets, a Markets app, a music player and ' +
      'its own release pipeline. Alongside it I’ve built peer-to-peer file sharing, image tools and ' +
      'WebGL landing pages.',
    'My principle is simple: professional ethics and attention to detail make the difference between ' +
      'a website and an experience someone remembers.',
  ],

  // What the previous portfolio offered as services.
  services: [
    {
      title: 'Web development',
      text: 'Websites and web apps that embody the business behind them: fast, responsive and built with modern front-end tooling.',
    },
    {
      title: 'UI/UX design',
      text: 'Intuitive, distinctive interfaces designed in Figma and carried through to code without losing the detail.',
    },
  ],

  email: 'aakaashsasti@gmail.com',
  phone: '+917598870972',
  booking: 'https://cal.com/2kaakaash/15min',

  // Set to a file in /public (for example '/aakaash-resume.pdf') to show the résumé download.
  resume: null,

  socials: [
    { label: 'GitHub', href: 'https://github.com/2k-Aakaash', handle: '2k-Aakaash' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/aakaash-r-s-67bb8925a', handle: 'aakaash-r-s' },
    { label: 'Instagram', href: 'https://www.instagram.com/2k_aakaash', handle: '@2k_aakaash' },
  ],

  // Professional roles. Left empty because no verified employment history was found in the
  // repository; add entries as { company, title, start: 'YYYY-MM', end: 'YYYY-MM' | null,
  // summary, highlights: [], stack: [] } and they appear in the Journey section.
  /**
   * @type {Array<{ company: string, title: string, start: string, end: string | null,
   *   summary: string, highlights?: string[], stack?: string[] }>}
   */
  experience: [],
};

export const SECTIONS = [
  { id: 'home', label: 'Home', sector: 'Observatory' },
  { id: 'about', label: 'About', sector: 'The Lens' },
  { id: 'work', label: 'Work', sector: 'Orbit of work' },
  { id: 'skills', label: 'Skills', sector: 'Constellation' },
  { id: 'journey', label: 'Journey', sector: 'Timeline' },
  { id: 'contact', label: 'Contact', sector: 'Beacon' },
];
