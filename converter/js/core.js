/* ==========================================================================
   core.js — decoding, geometry (resize / crop), canvas encoding, the format
   registry and the conversion pipeline. Plus a minimal (stored) ZIP writer.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- canvas helpers ---------------------------------------------- */

  function makeCanvas(w, h) {
    if (global.OffscreenCanvas) return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function imageDataFromSource(src, w, h) {
    var canvas = makeCanvas(w, h);
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }

  function canvasFromImageData(imageData) {
    var canvas = makeCanvas(imageData.width, imageData.height);
    var ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  function canvasEncode(imageData, mime, quality) {
    var canvas = canvasFromImageData(imageData);
    if (canvas.convertToBlob) return canvas.convertToBlob({ type: mime, quality: quality });
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('Encoding failed for ' + mime)); }, mime, quality);
    });
  }

  /* ---------- decoding ----------------------------------------------------- */

  var TGA_RE = /\.(tga|targa|vda|icb|vst)$/i;
  var SVG_RE = /\.svgz?$/i;

  async function decodeFile(file) {
    var name = file.name || '';
    if (TGA_RE.test(name)) {
      var buf = new Uint8Array(await file.arrayBuffer());
      var decoded = decodeTGA(buf);
      if (decoded) return decoded;
    }
    if (SVG_RE.test(name) || file.type === 'image/svg+xml') {
      return decodeViaElement(file, true);
    }
    if (global.createImageBitmap) {
      try {
        var bmp = await createImageBitmap(file);
        var id = imageDataFromSource(bmp, bmp.width, bmp.height);
        bmp.close && bmp.close();
        return id;
      } catch (e) { /* fall through to <img> */ }
    }
    return decodeViaElement(file, false);
  }

  function decodeViaElement(file, isSvg) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        if (isSvg && (!w || !h)) { w = w || 1024; h = h || 1024; }
        if (!w || !h) { URL.revokeObjectURL(url); reject(new Error('Could not determine image size')); return; }
        // Render SVG at a comfortable size so the raster output is usable.
        var scale = 1;
        if (isSvg) {
          var target = 2000;
          if (Math.max(w, h) < target) scale = Math.min(4, target / Math.max(w, h));
        }
        var id = imageDataFromSource(img, Math.round(w * scale), Math.round(h * scale));
        URL.revokeObjectURL(url);
        resolve(id);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Unsupported or corrupt image: ' + (file.name || '')));
      };
      img.src = url;
    });
  }

  // Minimal TGA reader: uncompressed / RLE true-colour and grayscale.
  function decodeTGA(buf) {
    if (buf.length < 18) return null;
    var idLength = buf[0], colorMapType = buf[1], imageType = buf[2];
    var w = buf[12] | (buf[13] << 8), h = buf[14] | (buf[15] << 8);
    var bpp = buf[16], descriptor = buf[17];
    if (!w || !h || colorMapType !== 0) return null;
    if ([2, 3, 10, 11].indexOf(imageType) < 0) return null;
    var bytesPP = bpp >> 3;
    if ([1, 2, 3, 4].indexOf(bytesPP) < 0) return null;
    var offset = 18 + idLength;
    var pixels = new Uint8ClampedArray(w * h * 4);
    var rle = imageType >= 10;
    var total = w * h, i = 0;

    function put(idx, px) {
      var o = idx * 4;
      if (bytesPP === 1) { pixels[o] = pixels[o + 1] = pixels[o + 2] = px[0]; pixels[o + 3] = 255; }
      else if (bytesPP === 2) {
        var v = px[0] | (px[1] << 8);
        pixels[o] = ((v >> 10) & 31) * 255 / 31;
        pixels[o + 1] = ((v >> 5) & 31) * 255 / 31;
        pixels[o + 2] = (v & 31) * 255 / 31;
        pixels[o + 3] = (v & 0x8000) ? 255 : 255;
      } else {
        pixels[o] = px[2]; pixels[o + 1] = px[1]; pixels[o + 2] = px[0];
        pixels[o + 3] = bytesPP === 4 ? px[3] : 255;
      }
    }

    var tmp = new Uint8Array(4);
    while (i < total) {
      if (rle) {
        if (offset >= buf.length) break;
        var header = buf[offset++];
        var count = (header & 127) + 1;
        if (header & 128) {
          for (var c = 0; c < bytesPP; c++) tmp[c] = buf[offset + c];
          offset += bytesPP;
          for (var r = 0; r < count && i < total; r++, i++) put(i, tmp);
        } else {
          for (var k = 0; k < count && i < total; k++, i++) {
            for (var cc = 0; cc < bytesPP; cc++) tmp[cc] = buf[offset + cc];
            offset += bytesPP;
            put(i, tmp);
          }
        }
      } else {
        for (var c2 = 0; c2 < bytesPP; c2++) tmp[c2] = buf[offset + c2];
        offset += bytesPP;
        put(i, tmp);
        i++;
      }
    }

    var topLeft = (descriptor & 0x20) !== 0;
    if (!topLeft) {
      var flipped = new Uint8ClampedArray(pixels.length);
      var rowBytes = w * 4;
      for (var y = 0; y < h; y++) {
        flipped.set(pixels.subarray((h - 1 - y) * rowBytes, (h - y) * rowBytes), y * rowBytes);
      }
      pixels = flipped;
    }
    return new ImageData(pixels, w, h);
  }

  /* ---------- geometry ----------------------------------------------------- */

  function cropImageData(imageData, rect) {
    var x = Math.max(0, Math.round(rect.x));
    var y = Math.max(0, Math.round(rect.y));
    var w = Math.min(imageData.width - x, Math.round(rect.width));
    var h = Math.min(imageData.height - y, Math.round(rect.height));
    if (w <= 0 || h <= 0) return imageData;
    if (x === 0 && y === 0 && w === imageData.width && h === imageData.height) return imageData;
    var canvas = canvasFromImageData(imageData);
    var out = makeCanvas(w, h);
    var ctx = out.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }

  // fit: 'contain' (letterbox), 'cover' (crop), 'stretch', 'inside' (shrink only)
  function resizeImageData(imageData, targetW, targetH, opts) {
    opts = opts || {};
    var fit = opts.fit || 'contain';
    var sw = imageData.width, sh = imageData.height;
    if (!targetW && !targetH) return imageData;
    if (!targetW) targetW = Math.max(1, Math.round(sw * (targetH / sh)));
    if (!targetH) targetH = Math.max(1, Math.round(sh * (targetW / sw)));
    targetW = Math.max(1, Math.round(targetW));
    targetH = Math.max(1, Math.round(targetH));

    if (fit === 'inside') {
      var scale = Math.min(targetW / sw, targetH / sh, 1);
      var w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
      if (w === sw && h === sh) return imageData;
      return drawScaled(imageData, w, h, w, h, 0, 0, w, h, opts);
    }
    if (fit === 'stretch') {
      return drawScaled(imageData, targetW, targetH, targetW, targetH, 0, 0, targetW, targetH, opts);
    }
    if (fit === 'cover') {
      var s = Math.max(targetW / sw, targetH / sh);
      var dw = sw * s, dh = sh * s;
      return drawScaled(imageData, targetW, targetH, dw, dh, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh, opts);
    }
    // contain: fit entirely, canvas is exactly target with background padding
    var sc = Math.min(targetW / sw, targetH / sh);
    var cw = sw * sc, chh = sh * sc;
    return drawScaled(imageData, targetW, targetH, cw, chh, (targetW - cw) / 2, (targetH - chh) / 2, cw, chh, opts);
  }

  function drawScaled(imageData, canvasW, canvasH, _dw, _dh, dx, dy, dw, dh, opts) {
    var src = canvasFromImageData(imageData);
    // Progressive halving gives much cleaner downscales than one big draw.
    var curW = imageData.width, curH = imageData.height, cur = src;
    while (curW / 2 >= dw && curH / 2 >= dh && curW > 2 && curH > 2) {
      var hw = Math.max(1, Math.floor(curW / 2)), hh = Math.max(1, Math.floor(curH / 2));
      var step = makeCanvas(hw, hh);
      var sctx = step.getContext('2d');
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(cur, 0, 0, hw, hh);
      cur = step; curW = hw; curH = hh;
    }
    var out = makeCanvas(canvasW, canvasH);
    var ctx = out.getContext('2d', { willReadFrequently: true });
    var bg = opts && opts.background;
    if (bg && bg[3] !== 0) {
      ctx.fillStyle = 'rgba(' + bg[0] + ',' + bg[1] + ',' + bg[2] + ',' + (bg[3] == null ? 1 : bg[3]) + ')';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, dx, dy, dw, dh);
    return ctx.getImageData(0, 0, canvasW, canvasH);
  }

  /* ---------- format registry ---------------------------------------------- */

  var FORMATS = {
    png:  { label: 'PNG',       ext: 'png',  mime: 'image/png',             alpha: true,  lossy: false, native: true },
    jpg:  { label: 'JPG',       ext: 'jpg',  mime: 'image/jpeg',            alpha: false, lossy: true,  native: true },
    webp: { label: 'WebP',      ext: 'webp', mime: 'image/webp',            alpha: true,  lossy: true,  native: true },
    avif: { label: 'AVIF',      ext: 'avif', mime: 'image/avif',            alpha: true,  lossy: true,  native: true, optional: true },
    bmp:  { label: 'BMP',       ext: 'bmp',  mime: 'image/bmp',             alpha: true,  lossy: false },
    gif:  { label: 'GIF',       ext: 'gif',  mime: 'image/gif',             alpha: true,  lossy: false, palette: true },
    ico:  { label: 'ICO',       ext: 'ico',  mime: 'image/x-icon',          alpha: true,  lossy: false },
    svg:  { label: 'SVG',       ext: 'svg',  mime: 'image/svg+xml',         alpha: true,  lossy: false },
    tga:  { label: 'TGA',       ext: 'tga',  mime: 'image/x-tga',           alpha: true,  lossy: false },
    tiff: { label: 'TIFF',      ext: 'tiff', mime: 'image/tiff',            alpha: true,  lossy: false },
    wbmp: { label: 'WBMP',      ext: 'wbmp', mime: 'image/vnd.wap.wbmp',    alpha: false, lossy: false },
    eps:  { label: 'EPS',       ext: 'eps',  mime: 'application/postscript', alpha: false, lossy: false },
    hdr:  { label: 'HDR',       ext: 'hdr',  mime: 'image/vnd.radiance',    alpha: false, lossy: false },
    exr:  { label: 'EXR',       ext: 'exr',  mime: 'image/x-exr',           alpha: true,  lossy: false }
  };

  async function encodeTo(format, imageData, opts) {
    opts = opts || {};
    var fmt = FORMATS[format];
    if (!fmt) throw new Error('Unknown output format: ' + format);
    var E = global.ImgEncoders;
    switch (format) {
      case 'png':  return canvasEncode(imageData, 'image/png');
      case 'jpg':  return canvasEncode(E.flatten(imageData, opts.background), 'image/jpeg', clamp01(opts.quality));
      case 'webp': return canvasEncode(imageData, 'image/webp', clamp01(opts.quality));
      case 'avif': return canvasEncode(imageData, 'image/avif', clamp01(opts.quality));
      case 'bmp':  return E.bmp(imageData, opts);
      case 'gif':  return E.gif(imageData, opts);
      case 'ico':  return E.ico(imageData, opts);
      case 'svg':  return E.svg(imageData, opts);
      case 'tga':  return E.tga(imageData, opts);
      case 'tiff': return E.tiff(imageData, opts);
      case 'wbmp': return E.wbmp(imageData, opts);
      case 'eps':  return E.eps(imageData, opts);
      case 'hdr':  return E.hdr(imageData, opts);
      case 'exr':  return E.exr(imageData, opts);
      default: throw new Error('Unhandled format ' + format);
    }
  }

  function clamp01(q) {
    if (q == null) return 0.9;
    return Math.min(1, Math.max(0.01, q));
  }

  /* ---------- compression to a target file size ---------------------------- */

  async function encodeToTargetSize(format, imageData, opts, targetBytes) {
    var fmt = FORMATS[format];
    var best = null;
    if (!fmt.lossy) {
      // Lossless formats: shrink dimensions until the target is met.
      var scale = 1;
      for (var i = 0; i < 8; i++) {
        var id = scale === 1 ? imageData : resizeImageData(imageData, Math.max(1, Math.round(imageData.width * scale)), null, { fit: 'stretch' });
        var blob = await encodeTo(format, id, opts);
        best = { blob: blob, imageData: id };
        if (blob.size <= targetBytes) break;
        scale *= 0.8;
      }
      return best;
    }
    var lo = 0.05, hi = 0.97;
    var bestBlob = await encodeTo(format, imageData, Object.assign({}, opts, { quality: hi }));
    if (bestBlob.size <= targetBytes) return { blob: bestBlob, imageData: imageData, quality: hi };
    for (var it = 0; it < 8; it++) {
      var mid = (lo + hi) / 2;
      var b = await encodeTo(format, imageData, Object.assign({}, opts, { quality: mid }));
      if (b.size > targetBytes) { hi = mid; } else { lo = mid; bestBlob = b; }
    }
    var finalBlob = await encodeTo(format, imageData, Object.assign({}, opts, { quality: lo }));
    if (finalBlob.size < bestBlob.size || bestBlob.size > targetBytes) bestBlob = finalBlob;
    return { blob: bestBlob, imageData: imageData, quality: lo };
  }

  /* ---------- the pipeline -------------------------------------------------- */

  /**
   * settings: {
   *   format, quality, resizeMode ('none'|'maxbox'|'exact'|'percent'),
   *   maxWidth, maxHeight, exactWidth, exactHeight, percent, fit,
   *   background, targetKB, gifColors, icoSizes, wbmpDither, keepMetadataName...
   * }
   * crop: {x,y,width,height} in source pixels (optional)
   */
  async function processImage(sourceImageData, settings, crop) {
    var id = sourceImageData;
    if (crop && crop.width > 0 && crop.height > 0) id = cropImageData(id, crop);

    var mode = settings.resizeMode || 'none';
    if (mode === 'maxbox') {
      var mw = settings.maxWidth || 0, mh = settings.maxHeight || 0;
      if (mw || mh) {
        id = resizeImageData(id, mw || id.width * 10, mh || id.height * 10, { fit: 'inside' });
      }
    } else if (mode === 'exact') {
      id = resizeImageData(id, settings.exactWidth || id.width, settings.exactHeight || id.height, {
        fit: settings.fit || 'cover',
        background: settings.background
      });
    } else if (mode === 'percent') {
      var pct = (settings.percent || 100) / 100;
      if (pct !== 1) {
        id = resizeImageData(id, Math.max(1, Math.round(id.width * pct)), Math.max(1, Math.round(id.height * pct)), { fit: 'stretch' });
      }
    }

    var opts = {
      quality: settings.quality,
      background: settings.background,
      colors: settings.gifColors,
      sizes: settings.icoSizes,
      dither: settings.wbmpDither,
      alpha: settings.keepAlpha !== false,
      embedFormat: settings.svgEmbed,
      gamma: settings.hdrGamma,
      exposure: settings.hdrExposure
    };

    var result;
    if (settings.targetKB) {
      result = await encodeToTargetSize(settings.format, id, opts, settings.targetKB * 1024);
      id = result.imageData;
      result = result.blob;
    } else {
      result = await encodeTo(settings.format, id, opts);
    }
    return { blob: result, imageData: id, width: id.width, height: id.height };
  }

  /* ---------- stored ZIP writer -------------------------------------------- */

  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function dosDateTime(date) {
    var time = ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((date.getSeconds() / 2) & 31);
    var day = (((date.getFullYear() - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
    return { time: time, date: day };
  }

  /** entries: [{ name, blob }] -> Blob (ZIP, stored / no compression) */
  async function makeZip(entries) {
    var parts = [], central = [], offset = 0;
    var encoder = new TextEncoder();
    var stamp = dosDateTime(new Date());

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var nameBytes = encoder.encode(e.name);
      var data = new Uint8Array(await e.blob.arrayBuffer());
      var crc = crc32(data);

      var lh = new global.ImgEncoders.Writer(30 + nameBytes.length);
      lh.u32(0x04034b50).u16(20).u16(0x0800).u16(0).u16(stamp.time).u16(stamp.date)
        .u32(crc).u32(data.length).u32(data.length).u16(nameBytes.length).u16(0).bytes(nameBytes);
      var lhBytes = lh.result().slice();
      parts.push(lhBytes, data);

      var ch = new global.ImgEncoders.Writer(46 + nameBytes.length);
      ch.u32(0x02014b50).u16(20).u16(20).u16(0x0800).u16(0).u16(stamp.time).u16(stamp.date)
        .u32(crc).u32(data.length).u32(data.length).u16(nameBytes.length).u16(0).u16(0)
        .u16(0).u16(0).u32(0).u32(offset).bytes(nameBytes);
      central.push(ch.result().slice());

      offset += lhBytes.length + data.length;
    }

    var centralSize = central.reduce(function (s, c) { return s + c.length; }, 0);
    var end = new global.ImgEncoders.Writer(22);
    end.u32(0x06054b50).u16(0).u16(0).u16(entries.length).u16(entries.length)
      .u32(centralSize).u32(offset).u16(0);
    return new Blob(parts.concat(central, [end.result().slice()]), { type: 'application/zip' });
  }

  global.ImgCore = {
    FORMATS: FORMATS,
    makeCanvas: makeCanvas,
    canvasEncode: canvasEncode,
    canvasFromImageData: canvasFromImageData,
    imageDataFromSource: imageDataFromSource,
    decodeFile: decodeFile,
    decodeTGA: decodeTGA,
    cropImageData: cropImageData,
    resizeImageData: resizeImageData,
    encodeTo: encodeTo,
    processImage: processImage,
    makeZip: makeZip,
    crc32: crc32
  };
})(window);
