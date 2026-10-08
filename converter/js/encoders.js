/* ==========================================================================
   encoders.js — raster image encoders implemented on top of ImageData.
   Formats: PNG / JPG / WEBP (native canvas), BMP, GIF, ICO, SVG, TGA, TIFF,
            WBMP, EPS, HDR (Radiance RGBE), EXR (half float, uncompressed).
   Every encoder returns a Blob.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- small binary helpers ---------------------------------------- */

  function Writer(initial) {
    this.buf = new Uint8Array(initial || 1 << 16);
    this.len = 0;
  }
  Writer.prototype._fit = function (n) {
    if (this.len + n <= this.buf.length) return;
    var cap = this.buf.length;
    while (cap < this.len + n) cap *= 2;
    var nb = new Uint8Array(cap);
    nb.set(this.buf.subarray(0, this.len));
    this.buf = nb;
  };
  Writer.prototype.u8 = function (v) { this._fit(1); this.buf[this.len++] = v & 255; return this; };
  Writer.prototype.u16 = function (v) { this._fit(2); this.buf[this.len++] = v & 255; this.buf[this.len++] = (v >>> 8) & 255; return this; };
  Writer.prototype.u32 = function (v) {
    this._fit(4);
    this.buf[this.len++] = v & 255; this.buf[this.len++] = (v >>> 8) & 255;
    this.buf[this.len++] = (v >>> 16) & 255; this.buf[this.len++] = (v >>> 24) & 255;
    return this;
  };
  Writer.prototype.i32 = function (v) { return this.u32(v >>> 0); };
  Writer.prototype.u16be = function (v) { this._fit(2); this.buf[this.len++] = (v >>> 8) & 255; this.buf[this.len++] = v & 255; return this; };
  Writer.prototype.u32be = function (v) {
    this._fit(4);
    this.buf[this.len++] = (v >>> 24) & 255; this.buf[this.len++] = (v >>> 16) & 255;
    this.buf[this.len++] = (v >>> 8) & 255; this.buf[this.len++] = v & 255;
    return this;
  };
  Writer.prototype.u64 = function (v) { this.u32(v >>> 0); this.u32(Math.floor(v / 4294967296)); return this; };
  Writer.prototype.f32 = function (v) {
    this._fit(4);
    var dv = new DataView(this.buf.buffer, this.len, 4);
    dv.setFloat32(0, v, true);
    this.len += 4;
    return this;
  };
  Writer.prototype.bytes = function (arr) { this._fit(arr.length); this.buf.set(arr, this.len); this.len += arr.length; return this; };
  Writer.prototype.ascii = function (s) {
    this._fit(s.length);
    for (var i = 0; i < s.length; i++) this.buf[this.len++] = s.charCodeAt(i) & 255;
    return this;
  };
  Writer.prototype.asciiz = function (s) { return this.ascii(s).u8(0); };
  Writer.prototype.result = function () { return this.buf.subarray(0, this.len); };
  Writer.prototype.blob = function (type) { return new Blob([this.result().slice()], { type: type || 'application/octet-stream' }); };

  /* ---------- colour helpers ---------------------------------------------- */

  // Flatten RGBA over a background colour (used by formats without alpha).
  function flatten(imageData, bg) {
    var src = imageData.data, n = src.length;
    var out = new Uint8ClampedArray(n);
    var br = bg ? bg[0] : 255, bgc = bg ? bg[1] : 255, bb = bg ? bg[2] : 255;
    for (var i = 0; i < n; i += 4) {
      var a = src[i + 3] / 255;
      out[i] = src[i] * a + br * (1 - a);
      out[i + 1] = src[i + 1] * a + bgc * (1 - a);
      out[i + 2] = src[i + 2] * a + bb * (1 - a);
      out[i + 3] = 255;
    }
    return makeImageData(out, imageData.width, imageData.height);
  }

  // Always hand back a real ImageData: canvas putImageData rejects look-alikes.
  function makeImageData(data, width, height) {
    if (typeof ImageData !== 'undefined') {
      try { return new ImageData(data, width, height); } catch (e) { /* fall through */ }
    }
    return { data: data, width: width, height: height };
  }

  function hasAlpha(imageData) {
    var d = imageData.data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
    return false;
  }

  /* ---------- BMP ---------------------------------------------------------- */
  // 24-bit (opaque) or 32-bit BGRA (with alpha, BITMAPV4HEADER).

  function encodeBMP(imageData, opts) {
    opts = opts || {};
    var alpha = opts.alpha !== false && hasAlpha(imageData);
    return alpha ? bmp32(imageData) : bmp24(flatten(imageData, opts.background));
  }

  function bmp24(img) {
    var w = img.width, h = img.height, d = img.data;
    var rowSize = (w * 3 + 3) & ~3;
    var pixelBytes = rowSize * h;
    var wr = new Writer(54 + pixelBytes);
    wr.ascii('BM').u32(54 + pixelBytes).u16(0).u16(0).u32(54);
    wr.u32(40).i32(w).i32(h).u16(1).u16(24).u32(0).u32(pixelBytes).i32(2835).i32(2835).u32(0).u32(0);
    var row = new Uint8Array(rowSize);
    for (var y = h - 1; y >= 0; y--) {
      row.fill(0);
      var p = y * w * 4, o = 0;
      for (var x = 0; x < w; x++, p += 4) {
        row[o++] = d[p + 2]; row[o++] = d[p + 1]; row[o++] = d[p];
      }
      wr.bytes(row);
    }
    return wr.blob('image/bmp');
  }

  function bmp32(img) {
    var w = img.width, h = img.height, d = img.data;
    var pixelBytes = w * h * 4;
    var headerSize = 14 + 108;
    var wr = new Writer(headerSize + pixelBytes);
    wr.ascii('BM').u32(headerSize + pixelBytes).u16(0).u16(0).u32(headerSize);
    wr.u32(108).i32(w).i32(h).u16(1).u16(32).u32(3).u32(pixelBytes).i32(2835).i32(2835).u32(0).u32(0);
    wr.u32(0x00FF0000).u32(0x0000FF00).u32(0x000000FF).u32(0xFF000000);
    wr.ascii('BGRs');
    for (var i = 0; i < 36 + 12; i++) wr.u8(0); // CIEXYZTRIPLE + gamma fields
    var row = new Uint8Array(w * 4);
    for (var y = h - 1; y >= 0; y--) {
      var p = y * w * 4, o = 0;
      for (var x = 0; x < w; x++, p += 4) {
        row[o++] = d[p + 2]; row[o++] = d[p + 1]; row[o++] = d[p]; row[o++] = d[p + 3];
      }
      wr.bytes(row);
    }
    return wr.blob('image/bmp');
  }

  /* ---------- TGA ---------------------------------------------------------- */
  // Uncompressed true-colour, 32-bit BGRA or 24-bit BGR.

  function encodeTGA(imageData, opts) {
    opts = opts || {};
    var alpha = opts.alpha !== false && hasAlpha(imageData);
    var img = alpha ? imageData : flatten(imageData, opts.background);
    var w = img.width, h = img.height, d = img.data;
    var bpp = alpha ? 32 : 24;
    var wr = new Writer(18 + w * h * (bpp / 8) + 26);
    wr.u8(0).u8(0).u8(2).u16(0).u16(0).u8(0).u16(0).u16(0).u16(w).u16(h).u8(bpp).u8(alpha ? 8 : 0);
    var row = new Uint8Array(w * (bpp / 8));
    for (var y = h - 1; y >= 0; y--) { // TGA default origin is bottom-left
      var p = y * w * 4, o = 0;
      for (var x = 0; x < w; x++, p += 4) {
        row[o++] = d[p + 2]; row[o++] = d[p + 1]; row[o++] = d[p];
        if (alpha) row[o++] = d[p + 3];
      }
      wr.bytes(row);
    }
    wr.u32(0).u32(0).ascii('TRUEVISION-XFILE.').u8(0);
    return wr.blob('image/x-tga');
  }

  /* ---------- TIFF --------------------------------------------------------- */
  // Baseline, little-endian, single uncompressed strip.

  function encodeTIFF(imageData, opts) {
    opts = opts || {};
    var alpha = opts.alpha !== false && hasAlpha(imageData);
    var img = alpha ? imageData : flatten(imageData, opts.background);
    var w = img.width, h = img.height, d = img.data;
    var spp = alpha ? 4 : 3;
    var pixelBytes = w * h * spp;

    var tags = [];
    function tag(id, type, count, value) { tags.push({ id: id, type: type, count: count, value: value }); }

    // Offsets: header 8 + IFD, then extra data blocks, then pixels.
    var nTags = alpha ? 12 : 11;
    var ifdOffset = 8;
    var ifdSize = 2 + nTags * 12 + 4;
    var extraOffset = ifdOffset + ifdSize;
    var bitsOffset = extraOffset;                 // spp * 2 bytes
    var resOffset = bitsOffset + spp * 2;         // 2 rationals = 16 bytes
    var pixelOffset = resOffset + 16;

    tag(256, 3, 1, w);                            // ImageWidth
    tag(257, 3, 1, h);                            // ImageLength
    tag(258, 3, spp, bitsOffset);                 // BitsPerSample
    tag(259, 3, 1, 1);                            // Compression = none
    tag(262, 3, 1, 2);                            // Photometric = RGB
    tag(273, 4, 1, pixelOffset);                  // StripOffsets
    tag(277, 3, 1, spp);                          // SamplesPerPixel
    tag(278, 3, 1, h);                            // RowsPerStrip
    tag(279, 4, 1, pixelBytes);                   // StripByteCounts
    tag(282, 5, 1, resOffset);                    // XResolution
    tag(283, 5, 1, resOffset + 8);                // YResolution
    if (alpha) tag(338, 3, 1, 2);                 // ExtraSamples = unassociated alpha
    tags.sort(function (a, b) { return a.id - b.id; });

    var wr = new Writer(pixelOffset + pixelBytes);
    wr.ascii('II').u16(42).u32(ifdOffset);
    wr.u16(tags.length);
    tags.forEach(function (t) {
      wr.u16(t.id).u16(t.type).u32(t.count);
      var inline = (t.type === 3 && t.count === 1);
      if (inline) { wr.u16(t.value).u16(0); }
      else { wr.u32(t.value); }
    });
    wr.u32(0); // next IFD
    for (var i = 0; i < spp; i++) wr.u16(8);          // BitsPerSample values
    wr.u32(72).u32(1).u32(72).u32(1);                 // X/Y resolution rationals

    var row = new Uint8Array(w * spp);
    for (var y = 0; y < h; y++) {
      var p = y * w * 4, o = 0;
      for (var x = 0; x < w; x++, p += 4) {
        row[o++] = d[p]; row[o++] = d[p + 1]; row[o++] = d[p + 2];
        if (alpha) row[o++] = d[p + 3];
      }
      wr.bytes(row);
    }
    return wr.blob('image/tiff');
  }

  /* ---------- WBMP --------------------------------------------------------- */
  // Type 0 (B/W, no compression) with Floyd–Steinberg dithering.

  function encodeWBMP(imageData, opts) {
    opts = opts || {};
    var img = flatten(imageData, opts.background);
    var w = img.width, h = img.height, d = img.data;
    var gray = new Float32Array(w * h);
    for (var i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
    }
    var threshold = opts.threshold == null ? 128 : opts.threshold;
    var dither = opts.dither !== false;
    var bits = new Uint8Array(w * h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = y * w + x;
        var old = gray[idx];
        var nv = old >= threshold ? 255 : 0;
        bits[idx] = nv ? 1 : 0;
        if (!dither) continue;
        var err = old - nv;
        if (x + 1 < w) gray[idx + 1] += err * 7 / 16;
        if (y + 1 < h) {
          if (x > 0) gray[idx + w - 1] += err * 3 / 16;
          gray[idx + w] += err * 5 / 16;
          if (x + 1 < w) gray[idx + w + 1] += err * 1 / 16;
        }
      }
    }
    var wr = new Writer(16 + Math.ceil(w / 8) * h);
    wr.u8(0).u8(0);                   // type 0, fixed header
    writeMultiByte(wr, w);
    writeMultiByte(wr, h);
    var rowBytes = Math.ceil(w / 8);
    var row = new Uint8Array(rowBytes);
    for (var yy = 0; yy < h; yy++) {
      row.fill(0);
      for (var xx = 0; xx < w; xx++) {
        if (bits[yy * w + xx]) row[xx >> 3] |= 0x80 >> (xx & 7);
      }
      wr.bytes(row);
    }
    return wr.blob('image/vnd.wap.wbmp');
  }

  function writeMultiByte(wr, value) {
    var parts = [];
    do { parts.unshift(value & 0x7f); value >>>= 7; } while (value > 0);
    for (var i = 0; i < parts.length; i++) wr.u8(parts[i] | (i < parts.length - 1 ? 0x80 : 0));
  }

  /* ---------- GIF ---------------------------------------------------------- */
  // GIF89a, median-cut palette (<=256), LZW compressed, optional binary alpha.

  function medianCut(imageData, maxColors, alphaCut) {
    var d = imageData.data, total = d.length / 4;
    var step = Math.max(1, Math.floor(total / 32768));
    var samples = [];
    for (var i = 0; i < total; i += step) {
      var p = i * 4;
      if (d[p + 3] < alphaCut) continue;
      samples.push([d[p], d[p + 1], d[p + 2]]);
    }
    if (!samples.length) samples.push([0, 0, 0]);

    var boxes = [samples];
    while (boxes.length < maxColors) {
      // Split the box with the largest channel range.
      var best = -1, bestRange = -1, bestChan = 0;
      for (var b = 0; b < boxes.length; b++) {
        var box = boxes[b];
        if (box.length < 2) continue;
        for (var c = 0; c < 3; c++) {
          var mn = 255, mx = 0;
          for (var k = 0; k < box.length; k++) {
            var v = box[k][c];
            if (v < mn) mn = v;
            if (v > mx) mx = v;
          }
          if (mx - mn > bestRange) { bestRange = mx - mn; best = b; bestChan = c; }
        }
      }
      if (best < 0 || bestRange <= 0) break;
      var target = boxes[best];
      target.sort(function (p1, p2) { return p1[bestChan] - p2[bestChan]; });
      var mid = target.length >> 1;
      boxes.splice(best, 1, target.slice(0, mid), target.slice(mid));
    }

    var palette = boxes.map(function (box) {
      var r = 0, g = 0, bl = 0;
      for (var i2 = 0; i2 < box.length; i2++) { r += box[i2][0]; g += box[i2][1]; bl += box[i2][2]; }
      return [Math.round(r / box.length), Math.round(g / box.length), Math.round(bl / box.length)];
    });
    while (palette.length === 0) palette.push([0, 0, 0]);
    return palette;
  }

  function quantize(imageData, palette, transparentIndex, alphaCut) {
    var d = imageData.data, n = d.length / 4;
    var out = new Uint8Array(n);
    var cache = new Int16Array(32768).fill(-1);
    for (var i = 0, p = 0; i < n; i++, p += 4) {
      if (transparentIndex >= 0 && d[p + 3] < alphaCut) { out[i] = transparentIndex; continue; }
      var key = ((d[p] >> 3) << 10) | ((d[p + 1] >> 3) << 5) | (d[p + 2] >> 3);
      var idx = cache[key];
      if (idx < 0) {
        var bestD = Infinity, bestI = 0;
        for (var c = 0; c < palette.length; c++) {
          var pc = palette[c];
          var dr = d[p] - pc[0], dg = d[p + 1] - pc[1], db = d[p + 2] - pc[2];
          var dist = dr * dr * 3 + dg * dg * 6 + db * db;
          if (dist < bestD) { bestD = dist; bestI = c; }
        }
        idx = bestI;
        cache[key] = idx;
      }
      out[i] = idx;
    }
    return out;
  }

  function BlockWriter(wr) { this.wr = wr; this.block = []; }
  BlockWriter.prototype.push = function (byte) {
    this.block.push(byte);
    if (this.block.length === 255) this.flush();
  };
  BlockWriter.prototype.flush = function () {
    if (!this.block.length) return;
    this.wr.u8(this.block.length).bytes(Uint8Array.from(this.block));
    this.block = [];
  };

  function lzwCompress(indices, minCodeSize, wr) {
    var blocks = new BlockWriter(wr);
    var cur = 0, curBits = 0;
    function emit(code, size) {
      cur |= code << curBits;
      curBits += size;
      while (curBits >= 8) { blocks.push(cur & 255); cur >>= 8; curBits -= 8; }
    }
    var clearCode = 1 << minCodeSize, eoiCode = clearCode + 1;
    var codeSize = minCodeSize + 1, next = eoiCode + 1;
    var dict = new Map();
    emit(clearCode, codeSize);
    var prefix = indices[0];
    for (var i = 1; i < indices.length; i++) {
      var k = indices[i];
      var key = (prefix << 8) | k;
      var found = dict.get(key);
      if (found !== undefined) { prefix = found; continue; }
      emit(prefix, codeSize);
      if (next < 4096) {
        dict.set(key, next++);
        if (next - 1 === (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        emit(clearCode, codeSize);
        dict.clear();
        codeSize = minCodeSize + 1;
        next = eoiCode + 1;
      }
      prefix = k;
    }
    emit(prefix, codeSize);
    emit(eoiCode, codeSize);
    if (curBits > 0) blocks.push(cur & 255);
    blocks.flush();
    wr.u8(0); // block terminator
  }

  function encodeGIF(imageData, opts) {
    opts = opts || {};
    var alphaCut = 128;
    var useAlpha = opts.alpha !== false && hasAlpha(imageData);
    var maxColors = Math.min(256, Math.max(2, opts.colors || 256)) - (useAlpha ? 1 : 0);
    var palette = medianCut(imageData, maxColors, useAlpha ? alphaCut : 0);
    var transparentIndex = -1;
    if (useAlpha) { transparentIndex = palette.length; palette = palette.concat([[0, 0, 0]]); }
    var indices = quantize(imageData, palette, transparentIndex, alphaCut);

    var bits = 1;
    while ((1 << bits) < palette.length) bits++;
    var tableSize = 1 << bits;

    var w = imageData.width, h = imageData.height;
    var wr = new Writer(w * h + 1024);
    wr.ascii('GIF89a').u16(w).u16(h);
    wr.u8(0x80 | ((bits - 1) & 7)).u8(0).u8(0);
    for (var i = 0; i < tableSize; i++) {
      var c = palette[i] || [0, 0, 0];
      wr.u8(c[0]).u8(c[1]).u8(c[2]);
    }
    if (transparentIndex >= 0) {
      wr.u8(0x21).u8(0xF9).u8(4).u8(0x01).u16(0).u8(transparentIndex).u8(0);
    }
    wr.u8(0x2C).u16(0).u16(0).u16(w).u16(h).u8(0);
    var minCodeSize = Math.max(2, bits);
    wr.u8(minCodeSize);
    lzwCompress(indices, minCodeSize, wr);
    wr.u8(0x3B);
    return wr.blob('image/gif');
  }

  /* ---------- ICO ---------------------------------------------------------- */
  // PNG-in-ICO (supported since Windows Vista); multi-size capable.

  async function encodeICO(imageData, opts) {
    opts = opts || {};
    var sizes = (opts.sizes && opts.sizes.length ? opts.sizes : [16, 32, 48, 64, 128, 256])
      .filter(function (s) { return s > 0 && s <= 256; })
      .sort(function (a, b) { return a - b; });
    var pngs = [];
    for (var i = 0; i < sizes.length; i++) {
      var s = sizes[i];
      var scaled = global.ImgCore.resizeImageData(imageData, s, s, { fit: opts.fit || 'contain', background: [0, 0, 0, 0] });
      var blob = await global.ImgCore.canvasEncode(scaled, 'image/png', 1);
      pngs.push(new Uint8Array(await blob.arrayBuffer()));
    }
    var wr = new Writer(1 << 18);
    wr.u16(0).u16(1).u16(pngs.length);
    var offset = 6 + pngs.length * 16;
    for (var j = 0; j < pngs.length; j++) {
      var dim = sizes[j] >= 256 ? 0 : sizes[j];
      wr.u8(dim).u8(dim).u8(0).u8(0).u16(1).u16(32).u32(pngs[j].length).u32(offset);
      offset += pngs[j].length;
    }
    pngs.forEach(function (p) { wr.bytes(p); });
    return wr.blob('image/x-icon');
  }

  /* ---------- SVG ---------------------------------------------------------- */
  // Raster embedded as a base64 <image>; vector tracing is out of scope.

  async function encodeSVG(imageData, opts) {
    opts = opts || {};
    var inner = opts.embedFormat === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    var blob = await global.ImgCore.canvasEncode(imageData, inner, opts.quality == null ? 0.92 : opts.quality);
    var b64 = await blobToBase64(blob);
    var w = imageData.width, h = imageData.height;
    var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">\n' +
      '  <image width="' + w + '" height="' + h + '" preserveAspectRatio="none" ' +
      'xlink:href="data:' + inner + ';base64,' + b64 + '"/>\n</svg>\n';
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(',')[1]); };
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  /* ---------- EPS ---------------------------------------------------------- */
  // Level 2 EPS with an ASCII85-encoded RGB colorimage.

  function ascii85(bytes) {
    var out = [], i, n = bytes.length;
    for (i = 0; i + 4 <= n; i += 4) {
      var v = ((bytes[i] << 24) >>> 0) + (bytes[i + 1] << 16) + (bytes[i + 2] << 8) + bytes[i + 3];
      v = v >>> 0;
      if (v === 0) { out.push('z'); continue; }
      var chunk = '';
      for (var k = 0; k < 5; k++) { chunk = String.fromCharCode(33 + (v % 85)) + chunk; v = Math.floor(v / 85); }
      out.push(chunk);
    }
    var rem = n - i;
    if (rem) {
      var pad = [0, 0, 0, 0];
      for (var j = 0; j < rem; j++) pad[j] = bytes[i + j];
      var val = ((pad[0] << 24) >>> 0) + (pad[1] << 16) + (pad[2] << 8) + pad[3];
      val = val >>> 0;
      var c = '';
      for (var m = 0; m < 5; m++) { c = String.fromCharCode(33 + (val % 85)) + c; val = Math.floor(val / 85); }
      out.push(c.slice(0, rem + 1));
    }
    // wrap at 75 chars
    var s = out.join(''), lines = [];
    for (var o = 0; o < s.length; o += 75) lines.push(s.slice(o, o + 75));
    return lines.join('\n') + '~>';
  }

  function encodeEPS(imageData, opts) {
    opts = opts || {};
    var img = flatten(imageData, opts.background);
    var w = img.width, h = img.height, d = img.data;
    var rgb = new Uint8Array(w * h * 3);
    for (var i = 0, p = 0, o = 0; i < w * h; i++, p += 4) {
      rgb[o++] = d[p]; rgb[o++] = d[p + 1]; rgb[o++] = d[p + 2];
    }
    var data = ascii85(rgb);
    var head = '%!PS-Adobe-3.0 EPSF-3.0\n' +
      '%%Creator: Green Convert\n' +
      '%%BoundingBox: 0 0 ' + w + ' ' + h + '\n' +
      '%%LanguageLevel: 2\n' +
      '%%Pages: 1\n%%EndComments\n%%BeginProlog\n%%EndProlog\n%%Page: 1 1\n' +
      'gsave\n' + w + ' ' + h + ' scale\n' +
      '/DeviceRGB setcolorspace\n' +
      '<< /ImageType 1 /Width ' + w + ' /Height ' + h +
      ' /BitsPerComponent 8 /Decode [0 1 0 1 0 1]' +
      ' /ImageMatrix [' + w + ' 0 0 -' + h + ' 0 ' + h + ']' +
      ' /DataSource currentfile /ASCII85Decode filter >> image\n';
    var tail = '\ngrestore\nshowpage\n%%EOF\n';
    return new Blob([head, data, tail], { type: 'application/postscript' });
  }

  /* ---------- HDR (Radiance RGBE) ----------------------------------------- */

  function encodeHDR(imageData, opts) {
    opts = opts || {};
    var exposure = opts.exposure == null ? 1 : opts.exposure;
    var gamma = opts.gamma == null ? 2.2 : opts.gamma;
    var img = flatten(imageData, opts.background);
    var w = img.width, h = img.height, d = img.data;

    var header = '#?RADIANCE\nSOFTWARE=Green Convert\nFORMAT=32-bit_rle_rgbe\n\n-Y ' + h + ' +X ' + w + '\n';
    var wr = new Writer(w * h * 4 + 1024);
    wr.ascii(header);

    var rowR = new Uint8Array(w), rowG = new Uint8Array(w), rowB = new Uint8Array(w), rowE = new Uint8Array(w);
    var useRLE = w >= 8 && w < 32768;
    for (var y = 0; y < h; y++) {
      var p = y * w * 4;
      for (var x = 0; x < w; x++, p += 4) {
        var r = Math.pow(d[p] / 255, gamma) * exposure;
        var g = Math.pow(d[p + 1] / 255, gamma) * exposure;
        var b = Math.pow(d[p + 2] / 255, gamma) * exposure;
        var mx = Math.max(r, g, b);
        if (mx < 1e-32) { rowR[x] = rowG[x] = rowB[x] = rowE[x] = 0; continue; }
        var e = Math.ceil(Math.log2(mx));
        var scale = Math.pow(2, -e) * 256;
        rowR[x] = Math.min(255, Math.floor(r * scale));
        rowG[x] = Math.min(255, Math.floor(g * scale));
        rowB[x] = Math.min(255, Math.floor(b * scale));
        rowE[x] = e + 128;
      }
      if (useRLE) {
        wr.u8(2).u8(2).u8((w >> 8) & 255).u8(w & 255);
        writeRLE(wr, rowR); writeRLE(wr, rowG); writeRLE(wr, rowB); writeRLE(wr, rowE);
      } else {
        for (var xx = 0; xx < w; xx++) wr.u8(rowR[xx]).u8(rowG[xx]).u8(rowB[xx]).u8(rowE[xx]);
      }
    }
    return wr.blob('image/vnd.radiance');
  }

  function writeRLE(wr, row) {
    var n = row.length, i = 0;
    while (i < n) {
      var run = 1;
      while (i + run < n && row[i + run] === row[i] && run < 127) run++;
      if (run >= 4) {                       // repeat packet
        wr.u8(128 + run).u8(row[i]);
        i += run;
        continue;
      }
      var start = i, len = 0;               // literal packet (always >= 1 byte)
      while (i < n && len < 128) {
        var ahead = 1;
        while (i + ahead < n && row[i + ahead] === row[i] && ahead < 4) ahead++;
        if (ahead >= 4 && len > 0) break;   // let the next repeat packet take over
        i++; len++;
      }
      wr.u8(len);
      for (var k = 0; k < len; k++) wr.u8(row[start + k]);
    }
  }

  /* ---------- EXR (half float, uncompressed scanlines) --------------------- */

  function toHalf(val) {
    var floatView = toHalf.f || (toHalf.f = new Float32Array(1));
    var intView = toHalf.i || (toHalf.i = new Int32Array(floatView.buffer));
    floatView[0] = val;
    var x = intView[0];
    var bits = (x >> 16) & 0x8000;
    var m = (x >> 12) & 0x07ff;
    var e = (x >> 23) & 0xff;
    if (e < 103) return bits;
    if (e > 142) return bits | 0x7c00;
    if (e < 113) {
      m |= 0x0800;
      return bits | ((m >> (114 - e)) + ((m >> (113 - e)) & 1));
    }
    bits |= ((e - 112) << 10) | (m >> 1);
    bits += m & 1;
    return bits;
  }

  function encodeEXR(imageData, opts) {
    opts = opts || {};
    var gamma = opts.gamma == null ? 2.2 : opts.gamma;
    var alpha = opts.alpha !== false && hasAlpha(imageData);
    var w = imageData.width, h = imageData.height, d = imageData.data;
    var channels = alpha ? ['A', 'B', 'G', 'R'] : ['B', 'G', 'R'];

    var head = new Writer(1024);
    head.u32(0x01312f76).u32(2);

    function attr(name, type, writeValue) {
      var tmp = new Writer(64);
      writeValue(tmp);
      head.asciiz(name).asciiz(type).u32(tmp.len).bytes(tmp.result());
    }
    attr('channels', 'chlist', function (t) {
      channels.forEach(function (c) {
        t.asciiz(c).u32(1).u8(0).u8(0).u8(0).u8(0).u32(1).u32(1); // HALF, pLinear 0, sampling 1,1
      });
      t.u8(0);
    });
    attr('compression', 'compression', function (t) { t.u8(0); });
    attr('dataWindow', 'box2i', function (t) { t.i32(0).i32(0).i32(w - 1).i32(h - 1); });
    attr('displayWindow', 'box2i', function (t) { t.i32(0).i32(0).i32(w - 1).i32(h - 1); });
    attr('lineOrder', 'lineOrder', function (t) { t.u8(0); });
    attr('pixelAspectRatio', 'float', function (t) { t.f32(1); });
    attr('screenWindowCenter', 'v2f', function (t) { t.f32(0).f32(0); });
    attr('screenWindowWidth', 'float', function (t) { t.f32(1); });
    head.u8(0);

    var rowDataBytes = w * channels.length * 2;
    var chunkBytes = 8 + rowDataBytes;
    var offsetTableBytes = h * 8;
    var firstChunk = head.len + offsetTableBytes;

    var wr = new Writer(firstChunk + h * chunkBytes);
    wr.bytes(head.result());
    for (var y = 0; y < h; y++) wr.u64(firstChunk + y * chunkBytes);

    for (var yy = 0; yy < h; yy++) {
      wr.i32(yy).u32(rowDataBytes);
      for (var ci = 0; ci < channels.length; ci++) {
        var ch = channels[ci];
        var off = ch === 'R' ? 0 : ch === 'G' ? 1 : ch === 'B' ? 2 : 3;
        var p = yy * w * 4 + off;
        for (var x = 0; x < w; x++, p += 4) {
          var v = d[p] / 255;
          if (ch !== 'A') v = Math.pow(v, gamma);
          wr.u16(toHalf(v));
        }
      }
    }
    return wr.blob('image/x-exr');
  }

  global.ImgEncoders = {
    Writer: Writer,
    flatten: flatten,
    makeImageData: makeImageData,
    hasAlpha: hasAlpha,
    bmp: encodeBMP,
    tga: encodeTGA,
    tiff: encodeTIFF,
    wbmp: encodeWBMP,
    gif: encodeGIF,
    ico: encodeICO,
    svg: encodeSVG,
    eps: encodeEPS,
    hdr: encodeHDR,
    exr: encodeEXR
  };
})(window);
