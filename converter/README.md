# Green Convert — standalone batch image converter

A desktop web app that converts, compresses and crops whole folders of images.
Everything runs locally in the browser: no uploads, no server, no dependencies.

## Running it

Chrome, Edge or Opera on desktop give the full experience (reading an input
folder and writing straight into an output folder):

```bash
cd converter
npx http-server -p 8080        # or: python3 -m http.server 8080
```

then open <http://localhost:8080/>.

Opening `index.html` directly from disk also works, but browsers block the
folder-picker API on `file://` URLs — the app detects this, says so in the
header chip, and falls back to the file chooser plus `.zip` download.

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
  css/converter.css   green-palette theme
  js/encoders.js      binary image encoders (BMP, GIF, ICO, TGA, TIFF, WBMP, EPS, HDR, EXR, SVG)
  js/core.js          decoding, resize/crop, format registry, pipeline, ZIP writer
  js/crop.js          interactive crop tool
  js/app.js           state, folder I/O, preview, batch processing, saving
```
