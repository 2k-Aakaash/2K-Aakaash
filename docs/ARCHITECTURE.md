# Portfolio architecture

This repository's `README.md` is the GitHub profile README for `github.com/2k-Aakaash`. This file is for working on the site.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve the build
npm run check     # Astro + TypeScript diagnostics
```

Vercel builds the site as static Astro (`vercel.json` sets the framework, clean URLs and no trailing slash).

## Edit the content

Everything a visitor reads lives in `src/content/`. You don't need to touch the 3D code to change it.

| File | Holds |
| --- | --- |
| `profile.js` | Name, role, bio, services, contact details, socials, résumé, experience, section list |
| `projects.js` | Featured projects (summary, problem, role, stack, features, challenges, outcomes, links) and the archive |
| `skills.js` | Skill groups. `evidence: 'shipped'` (used in a project on this site) or `'stated'` (listed on the GitHub profile) sets star brightness |
| `journey.js` | Milestones, dated by repository creation dates |

Optional extras:

- **Résumé:** add the PDF to `public/` and set `PROFILE.resume = '/file.pdf'`. A download button appears; without a file there is no button.
- **Experience:** add roles to `PROFILE.experience` (the schema is in the JSDoc). They show at the top of Journey, and each adds a beacon to the helix.
- **New project:** append it to `PROJECTS`. Choose an `artifact` (`browser`, `cutout`, `p2p`, `globe`, `disk`), or write a new builder in `src/scripts/world/regions/artifacts.js`. Screenshots go in `src/assets/` and are referenced by file name.

## 1. Repository audit (before the redesign)

| | Before |
| --- | --- |
| **Stack** | Webflow export: one static `index.html`, `styles.css` (77 KB), jQuery 3.5.1, Webflow runtime from CDN, Lenis 1.0.42 from unpkg. No build step |
| **Unused weight** | `script.js` (1.4 MB) was never referenced. `locomotive-scroll` was installed but unused. `node_modules` was committed to git |
| **Tests / lint / types** | None. The `test` script exited with an error |
| **Analytics** | Firebase Analytics. Google rejects its API key ("API key not valid"), so it wasn't working |
| **Content** | Name, two services, iWeb and Sprintora cards, email, phone, cal.com booking, GitHub/LinkedIn/Instagram. No résumé, no employment history |
| **Assets** | Portrait (removed at the owner's request), iWeb and Sprintora screenshots, 2K monogram SVG, favicons |
| **Deploy** | Vercel, static |

Live-site Lighthouse baseline, measured 16 Oct 2026:

| | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS | Weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile | 70 | 68 | 96 | 91 | 3.7 s | 240 ms | 0.031 | 1,004 KiB |
| Desktop | 88 | 78 | 96 | 91 | 0.7 s | 0 ms | 0.156 | 1,237 KiB |

Project facts were verified against each repository's code and README. Projects with uncertain authorship were left out (CineADV is a Figma Make export; ThreatSight began as a Lovable scaffold, and most of its pages are mocked).

## 2. Stack decisions

| Kept | Why |
| --- | --- |
| Lenis | Already used. Upgraded to the maintained `lenis` package |
| Static hosting on Vercel | No backend is needed |
| Content and links | Carried over, with the copy rewritten |

| Added | Why |
| --- | --- |
| Astro 7 | Static HTML (crawlable, fast first paint), image optimisation and a clean component model. It replaces hand-maintained Webflow markup full of inline transforms |
| Three.js 0.186 | The world. Loaded lazily in its own chunk |
| GSAP 3 + ScrollTrigger | Intro choreography and text reveals |
| Fontsource | Self-hosted fonts: Unbounded, Manrope, JetBrains Mono (OFL) |

| Removed | Why |
| --- | --- |
| jQuery, Webflow runtime, locomotive-scroll, unused `script.js` | Unused, or replaced by the new stack |
| Firebase Analytics | Its key is rejected (see the audit) |

Three.js is used directly rather than through React Three Fiber, because the site has no React. No other 3D or animation library was added.

## 3. How it works

```
src/
  content/            data only (see "Edit the content")
  layouts/Base.astro  head, SEO, JSON-LD, pre-paint intro decision
  pages/index.astro   semantic page: six sections, case-file dialogs, world data
  styles/global.css   design tokens, layout, HUD, reduced-motion rules
  scripts/
    main.js           boot order; the world is lazy-loaded once the page is idle
    ui/               scroll (Lenis), navigation, intro, reveals, case files, sound control
    audio/            procedural Web Audio soundscape
    world/
      engine.js       renderer, loop, picking, visibility, disposal
      camera.js       scroll-driven camera rig
      quality.js      adaptive quality tiers
      environment.js  nebula sky, stars, dust, reflection map
      regions/        observatory, lens, artifacts, constellation, timeline, beacon
```

### Camera

- Each `[data-station]` element in the page maps to a camera station: a position, a look-at target and a lens shift. The stations are defined by the regions that own them.
- **The scroll position is the only input.** Navigation links, the intro and fast scrolling all just move the scroll, so camera moves can never fight each other.
- Between stations the camera follows centripetal Catmull-Rom splines. Smootherstep easing makes it settle at each station while you read, then travel.
- A critically damped follow gives it weight.
- Pointer parallax slides the lens sideways without ever rolling it.
- `camera.filmOffset` frames each subject beside the copy on wide screens and centres it on narrow ones.
- With reduced motion there's no travel: the camera cuts between stations behind a short cross-fade, and frames are rendered only on demand.

### Adaptive quality

- Every device starts at medium at most, or low on small or low-memory devices.
- Measured frame times (60-frame averages) drop the tier when frames average over 24 ms. A drop is permanent, so the tier can't oscillate.
- After 5 seconds of frames under 11 ms, the tier rises to high, which adds bloom, a pixel ratio of 2 and more stars. Bloom's shaders are only compiled once that tier is earned.
- Rendering pauses when the tab is hidden.
- Setup is split into yielded steps, timed with User Timing marks (`world:*` in DevTools → Performance → Timings).
- Shaders compile before the first frame, using `compileAsync` where `KHR_parallel_shader_compile` is available.

### Audio

- **Stack:** Web Audio, fully procedural. There are no files to download or license.
- **Off by default.** The `AudioContext` is created only inside the click that turns sound on. A saved "on" preference resumes on the visitor's first interaction, and they are never prompted.
- **Ambience:** a filtered drone plus wind on a stereo bus.
- **Region emitters:** one per region, placed in the world through `PannerNode` with HRTF panning. The `AudioListener` follows the camera, so regions are heard from where they sit.
- **Cues:** arrival chimes (spatial), plus soft open/close and throttled hover ticks.
- **Controls:** a sound toggle, volume, and separate ambience and interface switches, all persisted in `localStorage`. Muting ramps the master gain to zero in 120 ms and then suspends the context.
- **Output is stereo.** It's binaural when listening on headphones. If the device reports more than two output channels, the panel says so and leaves the mix to the browser. There is no Dolby, 5.1 or 7.1 processing, and the UI makes no such claim.

### Accessibility and fallbacks

- **Semantic HTML.** All content is in the DOM: headings, lists, a `<dialog>` case file for each project, and JSON-LD (`Person`, `ItemList`).
- **Keyboard:** a skip link; anchor navigation that moves focus to the target section; native dialogs (focus trap, Escape, focus returned to the opener); visible focus rings.
- **Intro:** short. It's skippable with a button, any scroll or any key. Return visits get a shorter version. It plays only when the page opens at the top, and never with reduced motion.
- **No WebGL:** a static starfield background, with the whole site intact.
- **No JavaScript:** the full content, with no intro.

## 4. Verification (16 Oct 2026)

Run against the production build (`astro preview`) in headless Chrome. WebGL ran in SwiftShader, which emulates the GPU on the CPU. Nothing was tested on physical phones or tablets.

**Build and type check:** `npm run build` succeeds, and `npm run check` reports 0 errors and 0 warnings across 28 files. There are no unit tests.

**Browser QA script:** 31 of 31 checks pass. It covers:

- the intro, Skip, and focus after skipping
- the skip link on a fresh load
- sound: default off, on, mute, and persistence
- navigation glides
- case files: open, focus trap, Escape and focus return
- reduced motion: no intro, native scroll, camera cuts
- no WebGL: fallback, content visible
- mobile at 390 px: no horizontal overflow, the menu, tap targets of at least 40 px
- zero console errors in all modes

**Visual review:** screenshots of all 11 camera stations at 1440×900, and the key stations at 390×844.

**Lighthouse 12.6** on the local build:

| | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Weight |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile | 74–75 | 100 | 100 | 100 | 1.8–2.0 s | 2.0–2.1 s | 1.07–1.17 s | 0.001 | 415 KiB |
| Desktop | 82–94 | 100 | 100 | 100 | 0.4 s | 0.4–0.5 s | 180–370 ms | 0.004 | 415 KiB |

What remains of TBT is mostly shader compilation, and SwiftShader compiles shaders far slower than a real GPU. So these numbers are a pessimistic bound, not a field measurement. Production Lighthouse will also include Vercel's CDN and compression.

**Payload (gzipped):**

| Piece | Size | When it loads |
| --- | --- | --- |
| HTML | 9 KB | Up front |
| Page script (GSAP, ScrollTrigger, Lenis, UI) | 55 KB | Up front |
| 3D engine (Three.js and the world) | 171 KB | Once the page is idle |
| Bloom passes | about 4 KB | Only on the high tier |

## 5. Known limitations

- **No résumé.** The repository doesn't have one, and the button stays hidden until `PROFILE.resume` is set.
- **No employment history.** None was found, so Journey shows dated milestones only.
- **Analytics is off.** The Firebase key needs replacing if you want analytics back.
- **Untested on real hardware.** Frame rates on physical phones, tablets and GPUs haven't been measured.
- **No surround output.** Audio is stereo/HRTF only.
