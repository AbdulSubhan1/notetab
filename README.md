# NoteTab

A fast, zero-backend notepad that runs entirely in the browser. No login, no server, no database — notes are saved automatically in your browser's `localStorage`.

## Codebase Overview

```
notetab/
  index.html   — App structure, SEO meta tags, Schema.org JSON-LD
  style.css    — All styles (mobile-first, CSS custom properties for dark/light theme)
  app.js       — All logic (localStorage, notes, auto-save, theme, sidebar)
```

### How it works

**No frameworks, no build step.** Open `index.html` in a browser and it works.

- `app.js` is wrapped in an IIFE with three layers:
  - **store** — reads/writes `localStorage` (keys: `nt_notes`, `nt_active`, `nt_theme`)
  - **state** — in-memory object (`notes[]`, `activeId`, `theme`)
  - **render()** — single function that redraws the sidebar list; called after every state change
- Notes are plain text stored as JSON in `localStorage` (~5 MB limit per domain)
- Auto-save fires 400 ms after the last keystroke (debounced)
- The ad banner slot is a placeholder `<div>` — drop in an AdSense `<ins>` tag when ready

### localStorage schema

```json
{
  "nt_notes":  [{ "id": "uuid", "content": "plain text", "updatedAt": 1716000000000 }],
  "nt_active": "uuid of the open note",
  "nt_theme":  "dark"
}
```

---

## Running locally

No install required. Three files, open and go.

---

### Step 1 — Get the files

If you cloned a repo:
```bash
git clone https://github.com/your-username/notetab.git
cd notetab
```

Or just download and unzip — you'll have a folder with `index.html`, `style.css`, `app.js`.

---

### Step 2 — Open in browser

#### Quickest way (double-click)

| OS | How |
|---|---|
| **Windows** | Double-click `index.html` in File Explorer |
| **macOS** | Double-click `index.html` in Finder |
| **Linux** | Double-click `index.html` or run `xdg-open index.html` |

This opens the app directly via the `file://` protocol. Everything works — localStorage, theme toggle, notes — with no server needed.

---

#### Recommended way (local HTTP server)

Running over `http://localhost` is closer to how the app behaves in production. Pick whichever tool you have:

**Python** (comes pre-installed on macOS/Linux, available on Windows):
```bash
cd notetab
python -m http.server 3000
```
Then open: [http://localhost:3000](http://localhost:3000)

> On older systems use `python3` instead of `python`.

---

**Node.js** (if you have Node installed):
```bash
npx serve notetab
```
Or install `serve` globally once:
```bash
npm install -g serve
serve notetab
```
Then open the URL it prints (usually [http://localhost:3000](http://localhost:3000)).

---

**VS Code — Live Server extension** (easiest for development):
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code
2. Open the `notetab/` folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. Browser opens automatically at `http://127.0.0.1:5500`
5. Any file you save auto-reloads the browser

---

**PHP** (available on most shared hosts and macOS/Linux):
```bash
cd notetab
php -S localhost:3000
```
Then open: [http://localhost:3000](http://localhost:3000)

---

### Step 3 — Start using it

Once the browser is open:
- Click anywhere on the editor and start typing — it saves automatically
- Click **☰** (top-left on mobile) to open the notes sidebar
- Click **+ New Note** to add another note
- Click **☀ / ☾** to toggle dark/light theme
- Close and reopen the tab — your notes are still there

> Notes are stored in your browser's `localStorage`. Clearing browser data or using a different browser/device will show an empty slate.

---

## Deployment

Because NoteTab is pure HTML/CSS/JS with no build step, deploying it means uploading three files. Pick any platform below.

---

### Vercel (recommended — free, instant)

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. From inside the `notetab/` folder:
   ```bash
   cd notetab
   vercel
   ```
3. Follow the prompts — choose **no framework**, root directory is `.`
4. Vercel assigns you a live URL immediately (e.g. `notetab.vercel.app`)

**Or via GitHub:**
1. Push the `notetab/` folder contents to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import that repo
3. Framework: **Other** — Vercel detects `index.html` and deploys as a static site
4. Every push to `main` auto-deploys

---

### Netlify (free, drag-and-drop)

**Drag and drop (no account needed for a quick test):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `notetab/` folder onto the page
3. Done — live URL in seconds

**Via GitHub:**
1. Push the `notetab/` folder to a GitHub repo
2. Netlify → New site from Git → pick your repo
3. Build command: *(leave blank)*  
   Publish directory: `.` (or the subfolder name if you pushed the whole workspace)
4. Deploy

---

### GitHub Pages (free, from your repo)

1. Push the `notetab/` folder contents to a repo (e.g. `your-username/notetab`)
2. Repo → **Settings** → **Pages**
3. Source: `Deploy from a branch` → branch `main`, folder `/ (root)`
4. Save — GitHub builds and gives you `https://your-username.github.io/notetab`

> If you pushed the whole `workspace/` repo, set the folder to `/notetab` instead.

---

### cPanel (shared hosting)

1. Log in to your cPanel account
2. Open **File Manager** → navigate to `public_html/`
3. Create a subfolder if you want (e.g. `public_html/notetab/`)
4. Upload `index.html`, `style.css`, `app.js` into that folder
5. Visit `https://yourdomain.com/notetab/`

**Via FTP (FileZilla or similar):**
1. Connect using your cPanel FTP credentials (host, username, password from cPanel → FTP Accounts)
2. Upload the three files to `/public_html/` or `/public_html/notetab/`
3. Done

---

### Cloudflare Pages (free, very fast CDN)

1. Push the `notetab/` folder to a GitHub or GitLab repo
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → Create a project → Connect to Git
3. Framework preset: **None**  
   Build command: *(leave blank)*  
   Build output directory: `/notetab` (or `.` if the repo root is already the app)
4. Deploy — Cloudflare serves the files from their global CDN

---

### Any static file host / VPS (nginx)

Upload the three files and point the server root at the folder:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/notetab;
    index index.html;
}
```

---

## Adding AdSense ads

The ad banner slot is in `index.html`:

```html
<!-- Ad slot: replace contents with AdSense <ins> tag -->
<span class="ad-label">Advertisement</span>
```

Replace the `<span>` with your AdSense unit:

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

Also add the AdSense script tag in the `<head>` of `index.html`:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

---

## Custom domain

All platforms above (Vercel, Netlify, Cloudflare Pages, GitHub Pages) let you attach a custom domain for free. After deploying, go to the platform's domain settings and add a `CNAME` record pointing to their provided URL.

---

## Browser support

Chrome, Firefox, Safari, Opera — any modern browser from 2018 onwards. No polyfills needed.
