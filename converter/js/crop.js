/* ==========================================================================
   crop.js — interactive crop tool: draw, move, resize from any corner/edge,
   optional aspect lock, live unlocked result preview.
   ========================================================================== */
(function (global) {
  'use strict';

  var modal = document.getElementById('crop-modal');
  var stage = document.getElementById('crop-stage');
  var imgEl = document.getElementById('crop-img');
  var boxEl = document.getElementById('crop-box');
  var dimsEl = document.getElementById('crop-dims');
  var titleEl = document.getElementById('crop-title');
  var lockSel = document.getElementById('crop-lock-modal');
  var resultCanvas = document.getElementById('crop-result-canvas');
  var inX = document.getElementById('crop-x');
  var inY = document.getElementById('crop-y');
  var inW = document.getElementById('crop-w');
  var inH = document.getElementById('crop-h');

  var state = {
    open: false,
    imageData: null,
    sourceCanvas: null,
    rect: null,          // { x, y, width, height } in image pixels
    lock: 'free',
    customRatio: 5 / 7,
    onApply: null,
    objectUrl: null,
    drag: null
  };

  /* ---------- aspect ratio ------------------------------------------------- */

  function lockRatio() {
    switch (state.lock) {
      case 'square': return 1;
      case '4:3': return 4 / 3;
      case '3:2': return 3 / 2;
      case '16:9': return 16 / 9;
      case 'original': return state.imageData ? state.imageData.width / state.imageData.height : null;
      case 'custom': return state.customRatio || null;
      default: return null;
    }
  }

  /* ---------- coordinate mapping (image px <-> stage px) -------------------- */

  // Scale the image to fill the stage (zooming small images up) so there is
  // always a big canvas to drag on; the element box then equals the drawn box.
  function fitImage() {
    if (!state.imageData) return;
    var sb = stage.getBoundingClientRect();
    var pad = 28;
    var scale = Math.min((sb.width - pad) / state.imageData.width, (sb.height - pad) / state.imageData.height);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    imgEl.style.width = (state.imageData.width * scale) + 'px';
    imgEl.style.height = (state.imageData.height * scale) + 'px';
  }

  function layout() {
    var sb = stage.getBoundingClientRect();
    var ib = imgEl.getBoundingClientRect();
    return {
      left: ib.left - sb.left,
      top: ib.top - sb.top,
      width: ib.width,
      height: ib.height,
      scale: ib.width / state.imageData.width
    };
  }

  function toImage(clientX, clientY) {
    var L = layout();
    var sb = stage.getBoundingClientRect();
    return {
      x: (clientX - sb.left - L.left) / L.scale,
      y: (clientY - sb.top - L.top) / L.scale
    };
  }

  /* ---------- rendering ----------------------------------------------------- */

  function clampRect(r) {
    var iw = state.imageData.width, ih = state.imageData.height;
    var ratio = lockRatio();
    if (ratio) {
      // Shrink proportionally so a locked box never loses its ratio at the edges.
      var w = Math.max(1, Math.min(r.width, iw));
      var h = Math.max(1, Math.min(r.height, ih));
      if (w / h > ratio) w = h * ratio; else h = w / ratio;
      if (w > iw) { w = iw; h = w / ratio; }
      if (h > ih) { h = ih; w = h * ratio; }
      r.width = w;
      r.height = h;
    } else {
      r.width = Math.max(1, Math.min(r.width, iw));
      r.height = Math.max(1, Math.min(r.height, ih));
    }
    r.x = Math.max(0, Math.min(r.x, iw - r.width));
    r.y = Math.max(0, Math.min(r.y, ih - r.height));
    return r;
  }

  function render() {
    if (!state.rect) { boxEl.hidden = true; dimsEl.textContent = '—'; return; }
    var L = layout();
    var r = state.rect;
    boxEl.hidden = false;
    boxEl.style.left = (L.left + r.x * L.scale) + 'px';
    boxEl.style.top = (L.top + r.y * L.scale) + 'px';
    boxEl.style.width = Math.max(2, r.width * L.scale) + 'px';
    boxEl.style.height = Math.max(2, r.height * L.scale) + 'px';

    var rw = Math.round(r.width), rh = Math.round(r.height);
    var g = gcd(rw, rh);
    var a = rw / g, b = rh / g;
    var ratioText = (a <= 40 && b <= 40) ? a + ':' + b : (rw / rh).toFixed(2) + ':1';
    dimsEl.textContent = rw + ' × ' + rh + '  (' + ratioText + ')';
    inX.value = Math.round(r.x);
    inY.value = Math.round(r.y);
    inW.value = rw;
    inH.value = rh;
    renderResult();
  }

  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  function renderResult() {
    var r = state.rect;
    if (!r || !state.sourceCanvas) return;
    var maxW = 280, maxH = 280;
    var scale = Math.min(maxW / r.width, maxH / r.height, 1);
    // Unlocked: the preview keeps the crop's own proportions, whatever they are.
    var w = Math.max(1, Math.round(r.width * scale));
    var h = Math.max(1, Math.round(r.height * scale));
    resultCanvas.width = w;
    resultCanvas.height = h;
    var ctx = resultCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(state.sourceCanvas,
      Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height),
      0, 0, w, h);
  }

  /* ---------- interaction ---------------------------------------------------- */

  // Force a rectangle to `ratio`, keeping whichever dimension the user drove.
  function applyAspect(r, anchor, ratio) {
    if (!ratio) return r;
    var byWidth = { w: r.width, h: r.width / ratio };
    var byHeight = { w: r.height * ratio, h: r.height };
    var use = Math.abs(byWidth.h - r.height) < Math.abs(byHeight.w - r.width) ? byWidth : byHeight;
    var nx = r.x, ny = r.y;
    if (anchor.indexOf('w') >= 0) nx = r.x + r.width - use.w;
    if (anchor.indexOf('n') >= 0) ny = r.y + r.height - use.h;
    return { x: nx, y: ny, width: use.w, height: use.h };
  }

  /* Resize under an aspect lock: the dragged edge drives the size, the
     opposite edge stays put, and the box shrinks to stay inside the image. */
  function fitRatio(r, moving, ratio, iw, ih) {
    var fixRight = !!moving.w, fixBottom = !!moving.n;
    var right = r.x + r.width, bottom = r.y + r.height;
    var horizontal = moving.w || moving.e, vertical = moving.n || moving.s;
    var w, h;
    if (horizontal && !vertical) { w = r.width; h = w / ratio; }
    else if (vertical && !horizontal) { h = r.height; w = h * ratio; }
    else { w = Math.max(r.width, r.height * ratio); h = w / ratio; }

    var spaceX = fixRight ? right : iw - r.x;
    var spaceY = fixBottom ? bottom : ih - r.y;
    var scale = Math.min(1, spaceX / w, spaceY / h);
    if (isFinite(scale) && scale > 0) { w *= scale; h *= scale; }
    w = Math.max(1, w); h = Math.max(1, h);

    return {
      x: fixRight ? right - w : r.x,
      y: fixBottom ? bottom - h : r.y,
      width: w,
      height: h
    };
  }

  stage.addEventListener('pointerdown', function (ev) {
    if (!state.open || !state.imageData) return;
    var handle = ev.target.closest ? ev.target.closest('.handle') : null;
    var onBox = boxEl.contains(ev.target) && !handle;
    var start = toImage(ev.clientX, ev.clientY);
    stage.setPointerCapture(ev.pointerId);

    if (handle) {
      state.drag = { type: 'resize', dir: handle.dataset.h, start: start, orig: Object.assign({}, state.rect) };
    } else if (onBox) {
      state.drag = { type: 'move', start: start, orig: Object.assign({}, state.rect) };
    } else {
      state.drag = { type: 'draw', start: start };
      state.rect = { x: start.x, y: start.y, width: 1, height: 1 };
      render();
    }
    ev.preventDefault();
  });

  stage.addEventListener('pointermove', function (ev) {
    if (!state.drag) return;
    var iw = state.imageData.width, ih = state.imageData.height;
    var p = toImage(ev.clientX, ev.clientY);
    p.x = Math.max(0, Math.min(iw, p.x));
    p.y = Math.max(0, Math.min(ih, p.y));
    var d = state.drag;
    var ratio = lockRatio();

    if (d.type === 'draw') {
      var r = {
        x: Math.min(d.start.x, p.x),
        y: Math.min(d.start.y, p.y),
        width: Math.abs(p.x - d.start.x),
        height: Math.abs(p.y - d.start.y)
      };
      if (ratio) {
        var moving = { w: p.x < d.start.x, e: p.x >= d.start.x, n: p.y < d.start.y, s: p.y >= d.start.y };
        r = fitRatio(r, moving, ratio, iw, ih);
      }
      state.rect = clampRect(r);
    } else if (d.type === 'move') {
      var dx = p.x - d.start.x, dy = p.y - d.start.y;
      state.rect = clampRect({ x: d.orig.x + dx, y: d.orig.y + dy, width: d.orig.width, height: d.orig.height });
    } else if (d.type === 'resize') {
      var o = d.orig;
      var movesW = d.dir.indexOf('w') >= 0, movesE = d.dir.indexOf('e') >= 0;
      var movesN = d.dir.indexOf('n') >= 0, movesS = d.dir.indexOf('s') >= 0;
      var left = o.x, top = o.y, right = o.x + o.width, bottom = o.y + o.height;
      if (movesW) left = Math.min(p.x, right - 1);
      if (movesE) right = Math.max(p.x, left + 1);
      if (movesN) top = Math.min(p.y, bottom - 1);
      if (movesS) bottom = Math.max(p.y, top + 1);
      var nr = { x: left, y: top, width: right - left, height: bottom - top };
      if (ratio) nr = fitRatio(nr, { w: movesW, e: movesE, n: movesN, s: movesS }, ratio, iw, ih);
      state.rect = nr;
    }
    render();
    ev.preventDefault();
  });

  function endDrag(ev) {
    if (!state.drag) return;
    if (state.drag.type === 'draw' && state.rect && (state.rect.width < 4 || state.rect.height < 4)) {
      state.rect = null;
      boxEl.hidden = true;
      renderResultEmpty();
    }
    state.drag = null;
    try { stage.releasePointerCapture(ev.pointerId); } catch (e) {}
    render();
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  function renderResultEmpty() {
    resultCanvas.width = 10; resultCanvas.height = 10;
    resultCanvas.getContext('2d').clearRect(0, 0, 10, 10);
    dimsEl.textContent = '—';
  }

  // Keyboard nudging / resizing
  document.addEventListener('keydown', function (ev) {
    if (!state.open) return;
    if (ev.key === 'Escape') { close(); return; }
    if (!state.rect) return;
    var map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    var m = map[ev.key];
    if (!m) return;
    var step = ev.altKey ? 10 : 1;
    if (ev.shiftKey) {
      state.rect.width = Math.max(1, state.rect.width + m[0] * step);
      state.rect.height = Math.max(1, state.rect.height + m[1] * step);
      var kRatio = lockRatio();
      if (kRatio) {
        state.rect = fitRatio(state.rect, { e: true, s: true }, kRatio,
          state.imageData.width, state.imageData.height);
      }
    } else {
      state.rect.x += m[0] * step;
      state.rect.y += m[1] * step;
    }
    state.rect = clampRect(state.rect);
    render();
    ev.preventDefault();
  });

  [inX, inY, inW, inH].forEach(function (input) {
    input.addEventListener('change', function () {
      if (!state.rect) state.rect = { x: 0, y: 0, width: state.imageData.width, height: state.imageData.height };
      state.rect = clampRect({
        x: Number(inX.value) || 0,
        y: Number(inY.value) || 0,
        width: Math.max(1, Number(inW.value) || 1),
        height: Math.max(1, Number(inH.value) || 1)
      });
      render();
    });
  });

  lockSel.addEventListener('change', function () {
    state.lock = lockSel.value;
    var ratio = lockRatio();
    if (state.rect && ratio) {
      state.rect = clampRect(applyAspect(state.rect, 'se', ratio));
      render();
    }
    if (state.onLockChange) state.onLockChange(state.lock);
  });

  document.getElementById('crop-reset').addEventListener('click', function () {
    state.rect = state.initialRect ? Object.assign({}, state.initialRect) : null;
    if (!state.rect) { boxEl.hidden = true; renderResultEmpty(); } else render();
  });
  document.getElementById('crop-full').addEventListener('click', function () {
    state.rect = { x: 0, y: 0, width: state.imageData.width, height: state.imageData.height };
    var ratio = lockRatio();
    if (ratio) state.rect = clampRect(applyAspect(state.rect, 'se', ratio));
    render();
  });
  document.getElementById('crop-center').addEventListener('click', function () {
    var iw = state.imageData.width, ih = state.imageData.height;
    var w = iw * 0.8, h = ih * 0.8;
    var ratio = lockRatio();
    var r = { x: (iw - w) / 2, y: (ih - h) / 2, width: w, height: h };
    if (ratio) {
      r = applyAspect(r, 'se', ratio);
      r.x = (iw - r.width) / 2;
      r.y = (ih - r.height) / 2;
    }
    state.rect = clampRect(r);
    render();
  });

  document.getElementById('crop-close').addEventListener('click', close);
  document.getElementById('crop-cancel').addEventListener('click', close);
  document.getElementById('crop-apply').addEventListener('click', function () { finish(false); });
  document.getElementById('crop-apply-all').addEventListener('click', function () { finish(true); });

  function finish(all) {
    var rect = state.rect ? {
      x: Math.round(state.rect.x), y: Math.round(state.rect.y),
      width: Math.round(state.rect.width), height: Math.round(state.rect.height)
    } : null;
    var cb = state.onApply;
    close();
    if (cb) cb(rect, all);
  }

  function close() {
    state.open = false;
    modal.hidden = true;
    state.drag = null;
    if (state.objectUrl) { URL.revokeObjectURL(state.objectUrl); state.objectUrl = null; }
    state.imageData = null;
    state.sourceCanvas = null;
    state.rect = null;
  }

  window.addEventListener('resize', function () { if (state.open) { fitImage(); render(); } });

  /**
   * open({ imageData, name, rect, lock, customRatio, onApply(rect, applyToAll), onLockChange })
   */
  function open(options) {
    state.imageData = options.imageData;
    state.sourceCanvas = global.ImgCore.canvasFromImageData(options.imageData);
    state.lock = options.lock || 'free';
    state.customRatio = options.customRatio || state.customRatio;
    state.onApply = options.onApply || null;
    state.onLockChange = options.onLockChange || null;
    state.initialRect = options.rect ? Object.assign({}, options.rect) : null;
    state.rect = options.rect ? Object.assign({}, options.rect) : null;
    lockSel.value = state.lock;
    titleEl.textContent = 'Crop — ' + (options.name || 'image') +
      '  ·  ' + options.imageData.width + '×' + options.imageData.height + ' px';
    [inX, inY].forEach(function (i) { i.max = Math.max(options.imageData.width, options.imageData.height); });
    inW.max = options.imageData.width;
    inH.max = options.imageData.height;

    var toBlob = state.sourceCanvas.convertToBlob
      ? state.sourceCanvas.convertToBlob({ type: 'image/png' })
      : new Promise(function (res) { state.sourceCanvas.toBlob(res, 'image/png'); });

    toBlob.then(function (blob) {
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = URL.createObjectURL(blob);
      imgEl.onload = function () {
        state.open = true;
        modal.hidden = false;
        requestAnimationFrame(function () {
          fitImage();
          if (state.rect) render();
          else { boxEl.hidden = true; renderResultEmpty(); }
        });
      };
      imgEl.src = state.objectUrl;
    });
  }

  global.CropTool = { open: open, close: close };
})(window);
