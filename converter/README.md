# Green Convert — standalone batch image converter

A desktop web app that converts, compresses and crops whole folders of images.
Everything runs locally in the browser: no uploads, no server, no dependencies.

## Opening the app

There are two ways to open it, and the difference matters: double-clicking is
quickest, running a small local server unlocks everything.

### Step 1 — get the files onto your computer

The app is the `converter` folder of this repository. Either:

- **Download:** on the repository page, click the green **Code** button →
  **Download ZIP** → unzip it; or
- **Clone:** `git clone https://github.com/albertoalbanezi97-hub/aa-design.git`

Either way you end up with `aa-design/converter/`, which contains `index.html`.

### Way 1 — just double-click it

Open `aa-design/converter/index.html`. It opens in your default browser and the
app runs. To use a different browser, right-click the file → **Open with** →
Chrome, Firefox, Safari or Edge.

**What works:** loading images, every output format, compressing, the crop tool,
and downloading results — one at a time or the whole batch as a `.zip`.

**What you lose:** browsers restrict the folder-picker API on `file://` pages,
so saving straight into an output folder may be unavailable — use **Download ALL
as .zip** instead. You also cannot install the app to your desktop this way.

Good for a quick conversion; not the full experience.

### Way 2 — run a small local server (full features)

This is what enables the output folder picker and the **Install app** button.
It is one command.

**Open a terminal in the `converter` folder**

- **Windows:** open the folder in File Explorer, click the address bar, type
  `cmd`, press Enter.
- **macOS:** right-click the folder → Services → **New Terminal at Folder**.
- **Linux:** right-click inside the folder → **Open in Terminal**.

**Start the server** — whichever you already have:

```bash
python3 -m http.server 8080
```
```bash
npx http-server -p 8080
```

Python ships with macOS and most Linux systems; on Windows use the `npx` line if
you have Node, or install Python from python.org.

You will see a line like `Serving HTTP on :: port 8080`. **Leave that window
open** — closing it stops the app.

**Open the browser** at:

```
http://localhost:8080
```

That works in any browser — Chrome, Edge, Firefox, Safari, Brave, Opera. When
you are finished, press `Ctrl+C` in the terminal to stop the server.

### Way 3 — the single-file build (nothing to install, nothing to copy)

`dist/Green Convert.html` is the whole app — stylesheet, all four scripts and
the icons inlined — in one ~240 KB file. Put it anywhere (a USB stick, a
network drive, `I:\Claude\Image Convertor App`) and double-click it.

For a desktop icon: right-click the file -> **Show more options** -> **Send
to** -> **Desktop (create shortcut)**.

It converts, compresses, crops and downloads exactly like the served app,
single files or the whole batch as a `.zip`. What it gives up, because all
three need a real `http(s)` origin: writing straight into an output folder,
the service worker, and the **Install app** button.

Rebuild it after changing the app:

```bash
cd converter
python3 build-single-file.py
```

The script fails loudly if anything it expects to inline has moved, so a stale
bundle cannot be produced silently.

### Windows: one-click launcher and desktop icon

For a local copy on Windows (for example in `I:\Claude\Image Convertor App`),
copy the whole `converter` folder there, then use the two scripts inside it:

1. **`Create Desktop Shortcut.cmd`** — double-click once. It puts a
   **Green Convert** icon on your desktop, with the app's green icon, pointing
   back at the folder you copied.
2. **`Start Green Convert.cmd`** — what the shortcut runs. It starts a local
   server in that folder and opens the app in your default browser.

The launcher finds Python or Node automatically; if neither is installed it
opens the app directly and tells you what that costs (no output-folder saving,
no installing to the desktop). A minimised *Green Convert server* window stays
open while the app runs — close it to stop the app.

Nothing is installed system-wide, and the whole app stays inside that one
folder; delete the folder and the shortcut to remove it.

### What each browser supports

|                              | Chrome / Edge / Opera | Firefox | Safari |
|------------------------------|-----------------------|---------|--------|
| Convert, compress, crop      | yes                   | yes     | yes    |
| Pick an **input folder**     | yes (folder picker)   | via file chooser | via file chooser |
| Save into an **output folder** | yes                 | no — use .zip | no — use .zip |
| Download all as `.zip`       | yes                   | yes     | yes    |
| **Install app** (desktop icon) | yes                 | no      | no     |
| WebP / AVIF output           | both                  | WebP only | WebP only |

The app works this out for itself: the chip at the top right reads
`folder access: on` or `limited — zip download`, and any format your browser
cannot write is greyed out in the format list. Firefox and Safari do everything
else exactly the same — results arrive as downloads instead of being written
into a folder.

**Recommended:** Chrome or Edge at `http://localhost:8080`, then install the app
once (below) so it gets its own icon and window.

## Putting it on your desktop

Green Convert is an installable app, so it can live on your desktop with its own
icon and window instead of a browser tab.

1. Serve it (see above) and open it in **Chrome or Edge** — installing needs
   `http://localhost`, not a `file://` path.
2. Click **Install app** in the top-right of the header, or use the install icon
   in the browser's address bar (Chrome: ⋮ → Cast, save and share → Install page
   as app).
3. Choose **Create shortcut on desktop** when the browser offers it.

   - **Windows** — also lands in the Start menu; right-click → Pin to taskbar.
   - **macOS** — appears in Launchpad and `/Applications/Chrome Apps`; drag it to
     the Dock to keep it there.
   - **Linux** — a `.desktop` entry is written to `~/.local/share/applications`.

Once installed it works offline (a service worker caches the app shell), and
because the app is registered as a file handler you can right-click any image →
**Open with → Green Convert** to load it straight into the converter.

If you'd rather not install anything, a plain browser bookmark works fine — the
app is identical either way.

## What it does

**Input** — pick an input folder (optionally including sub-folders), add
individual files, or drag and drop files/folders anywhere in the window.
Anything the browser can decode is accepted (PNG, JPG, WebP, AVIF, GIF, BMP,
ICO, SVG, HEIC where the OS supports it), plus a built-in TGA reader.

**Output formats** — PNG, JPG, WebP, AVIF, GIF, TIFF, BMP, TGA, EPS, SVG, ICO,
WBMP, HDR (Radiance RGBE) and EXR (OpenEXR, half float). The formats browsers
cannot write natively are implemented from scratch in `js/encoders.js`:

| Format | Implementation |
|---|---|
| BMP | 24-bit, or 32-bit BGRA with a `BITMAPV4HEADER` when alpha is kept |
| GIF | median-cut palette (up to 256 colours) + LZW, binary transparency |
| ICO | multi-size PNG-in-ICO (16/32/48/64/128/256) |
| SVG | the raster embedded as a base64 `<image>` at full size |
| TGA | uncompressed true-colour, 24- or 32-bit |
| TIFF | baseline little-endian, single uncompressed strip, RGB or RGBA |
| WBMP | 1-bit mono with Floyd–Steinberg dithering |
| EPS | Level 2 PostScript, ASCII85-encoded RGB image |
| HDR | Radiance RGBE with run-length encoding |
| EXR | half-float RGB(A) scanlines, no compression |

**Compress & resize** — quality slider for lossy formats, fit-inside-a-box,
percentage scaling, exact size (cover / contain / stretch), and a
"compress to target size" mode that binary-searches quality (or scales
dimensions for lossless formats) until each file fits the KB budget.

**Crop** — click any image to open it large, drag a box, move it, resize from
any corner or edge, and lock it to a square, a preset rectangle, the original
ratio, or a custom W:H. Arrow keys nudge, Shift+arrows resize, Alt makes steps
of 10, numeric X/Y/W/H fields are editable. The result preview is deliberately
unlocked: it shows the whole crop at its own proportions. "Apply to ALL images"
transfers the crop proportionally, so one box works across a folder of
differently sized photos.

**Preview** — individual view (with prev/next and a Result/Original toggle) and
grid view of every image, with per-tile selection, status and a crop shortcut.

**Saving** — single-image and batch actions are kept visually distinct:

- *Single image* (dashed, pistachio): Save As…, Save this to output folder,
  Download this image.
- *Batch* (solid pill, malachite): Save ALL to output folder, Save selected to
  output folder, Download ALL as .zip.

Sub-folder structure can be mirrored into the output folder, and names can take
a prefix/suffix and be lower-cased.

## Layout

The window follows the reference wireframe: panel **1** (left, full height) is
the controls column, **2** (top right) is the preview, **3** (bottom right) is
processing and saving.

## Files

```
converter/
  index.html          markup and layout
  Start Green Convert.cmd       Windows launcher (local server + browser)
  Create Desktop Shortcut.cmd   Windows: puts an icon on the desktop
  create-shortcut.ps1           helper used by the line above
  build-single-file.py          bundles everything into dist/
  dist/Green Convert.html       the single-file build
  manifest.webmanifest  app metadata for desktop install
  sw.js               service worker (offline app shell)
  icons/              app icons (16–512 px, maskable, favicon.ico)
  css/converter.css   green-palette theme
  js/encoders.js      binary image encoders (BMP, GIF, ICO, TGA, TIFF, WBMP, EPS, HDR, EXR, SVG)
  js/core.js          decoding, resize/crop, format registry, pipeline, ZIP writer
  js/crop.js          interactive crop tool
  js/app.js           state, folder I/O, preview, batch processing, saving
```
