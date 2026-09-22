# Avi-Wagner

Personal site for Avi Wagner. Plain HTML/CSS/JS — no framework, no build step,
no dependencies except Google Fonts.

```
index.html    all page content, organised by <section id="...">
styles.css    design tokens + layout (edit :root to change the palette)
script.js     theme toggle, mobile nav, scroll reveal, active nav link
assets/
  img/        avi.jpg — your headshot (see assets/img/README.txt)
  resume/     Avi_Wagner_Resume.pdf
  projects/
    FridgeHero deck (PDF + PPTX)
    breakout/   playable Break//Out demo, served live at /assets/projects/breakout/
    menuhero/   PlateBudget source — GITIGNORED, see warning below
```

## Run locally

```
python3 -m http.server 8000
```
then open http://localhost:8000. Opening `index.html` directly also works.

---

## Before this goes live

1. **Search the HTML for `TODO(Avi)`** — three spots where only you know the answer.
   Also search for `DEMO VIDEO SLOT` — the PlateBudget card has a ready-made
   `<figure>` waiting, commented out. Drop the file at
   `assets/projects/platebudget-demo.mp4`, delete the comment wrapper, done.
2. **Delete `assets/img/1776104660922.png`** — the original LinkedIn download.
   `avi.jpg` is the optimised copy the site actually uses.
3. **Decide about `assets/projects/breakout/Notes.md` and `claude.md`.** Anything in
   that folder is published and publicly readable once the site is live. Move them out
   if you'd rather they weren't:
   ```
   mkdir -p notes && git mv assets/projects/breakout/Notes.md assets/projects/breakout/claude.md notes/
   ```
4. **Add a fourth project** when the private repo goes public (see below).
4. **Re-export your resume** if it has changed; the file name must stay
   `Avi_Wagner_Resume.pdf` or update the three links that point at it.

## ⚠ The menuhero/ folder does not belong here

`assets/projects/menuhero/` is the PlateBudget source. It is deliberately
gitignored, because it is ~1.1 GB, has its own `.git` pointing at Duke's
internal GitLab, and contains `.env` / `.env.local` with live Anthropic,
OpenAI and Kroger keys.

Move it somewhere outside this repo:

```
mv assets/projects/menuhero ~/code/platebudget
```

The site does not read from it — the PlateBudget card is written copy only.
Leaving it here risks committing live API keys to a public repo.

## Adding a project

Each project is a native `<details>` element, so expansion works even with
JavaScript disabled. Copy an existing block inside `.project-grid`:

```html
<details class="project reveal">
  <summary class="project-head">
    <div class="project-headline">
      <span class="project-num">04</span>
      <span class="project-kind">Category · Solo or team</span>
      <h3 class="project-title">Name</h3>
      <p class="project-line">One sentence on what it does.</p>
      <span class="project-tags"><span class="tag">Python</span></span>
      <span class="project-more"><span class="more-label"></span> <svg ...></svg></span>
    </div>
  </summary>
  <div class="project-detail">
    <div class="prose"><p>Why you built it, how it works, the hard part.</p></div>
    <div class="project-links"><a href="..." class="link-out">Source</a></div>
  </div>
</details>
```

Notes:
- Leave `.more-label` empty — CSS supplies "Read more" / "Hide details".
- Add `class="project is-feature reveal"` to make a card span the full width.
  Feature cards can also carry a `.project-glance` panel (see FridgeHero).
- `.is-placeholder` draws the striped "unfinished" treatment.

## Changing the look

Everything lives in `:root` at the top of `styles.css`. The palette is defined
once for light mode and overridden in two places for dark (a `prefers-color-scheme`
block and a `[data-theme="dark"]` block) — change both or the toggle will
disagree with the system setting.

Type is Fraunces (display serif), Inter (body), IBM Plex Mono (labels).

## Deploy

### GitHub Pages
```
git init && git add . && git commit -m "Portfolio"
gh repo create Avi-Wagner --public --source=. --push
```
Then Settings → Pages → source = `main`, root folder.
For a custom domain, add a `CNAME` file containing the domain and point DNS at
GitHub's Pages IPs.

### Netlify / Vercel
Drag the folder into Netlify, or run `vercel` from this directory. Both detect
a static site with no config.

### After deploying
Check these, in this order — they are the things that break on a first deploy:
1. The headshot loads (case-sensitive on Linux servers: `avi.jpg`, not `Avi.JPG`).
2. The resume downloads.
3. The Break//Out demo runs at `/assets/projects/breakout/`.
4. Open it on an actual phone, not just a narrow browser window.

## Accessibility & robustness

Deliberate choices worth preserving if you edit:

- Theme resolves in a blocking `<head>` script so dark-mode users never see a
  white flash.
- Scroll-reveal opacity is scoped to `html.js`, so if `script.js` fails to load
  the page is still fully readable rather than blank.
- `prefers-reduced-motion` disables reveals and the status-dot ping.
- Project cards are `<details>`, so they work and stay keyboard-accessible with
  JavaScript off.
- A print stylesheet opens every project card and drops the navigation.
