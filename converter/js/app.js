/* ==========================================================================
   app.js — application state, folder I/O, preview, batch pipeline, saving.
   ========================================================================== */
(function (global) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var Core = global.ImgCore;

  var SUPPORTED_RE = /\.(png|jpe?g|jpe|jfif|webp|avif|gif|bmp|dib|ico|cur|svgz?|tiff?|tga|targa|heic|heif|apng|pjpeg)$/i;

  var state = {
    items: [],
    currentId: null,
    view: 'individual',
    side: 'after',
    inputDirHandle: null,
    outputDirHandle: null,
    running: false,
    cancelRequested: false,
    nextId: 1
  };

  var decodeCache = new Map();           // id -> ImageData (LRU)
  var DECODE_CACHE_MAX = 10;

  /* ================= utilities ============================================ */

  function log(message, kind) {
    var ul = $('log');
    var li = document.createElement('li');
    var time = new Date().toLocaleTimeString();
    li.className = kind || '';
    li.textContent = '[' + time + '] ' + message;
    ul.appendChild(li);
    while (ul.children.length > 300) ul.removeChild(ul.firstChild);
    ul.scrollTop = ul.scrollHeight;
  }

  function fmtSize(bytes) {
    if (bytes == null) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 1] : [255, 255, 255, 1];
  }

  function baseName(name) { return name.replace(/\.[^.\/\\]+$/, ''); }

  function yieldToUI() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /* ================= settings ============================================= */

  function readSettings() {
    var format = $('opt-format').value;
    var sizes = Array.prototype.slice.call(document.querySelectorAll('#ico-sizes input:checked'))
      .map(function (i) { return Number(i.value); });
    return {
      format: format,
      quality: Number($('opt-quality').value) / 100,
      gifColors: Number($('opt-gif-colors').value),
      icoSizes: sizes.length ? sizes : [256],
      wbmpDither: $('opt-wbmp-dither').checked,
      background: hexToRgb($('opt-background').value),
      keepAlpha: $('opt-keep-alpha').checked,
      resizeMode: $('opt-resize-mode').value,
      maxWidth: Number($('opt-max-w').value) || 0,
      maxHeight: Number($('opt-max-h').value) || 0,
      percent: Number($('opt-percent').value) || 100,
      exactWidth: Number($('opt-exact-w').value) || 0,
      exactHeight: Number($('opt-exact-h').value) || 0,
      fit: $('opt-fit').value,
      targetKB: $('opt-target-on').checked ? Number($('opt-target-kb').value) || 0 : 0,
      prefix: $('opt-prefix').value,
      suffix: $('opt-suffix').value,
      lowercase: $('opt-lowercase').checked,
      mirror: $('opt-mirror').checked
    };
  }

  function syncConditionalFields() {
    var fmt = $('opt-format').value;
    document.querySelectorAll('[data-when-format]').forEach(function (el) {
      el.classList.toggle('show', el.dataset.whenFormat.split(' ').indexOf(fmt) >= 0);
    });
    var mode = $('opt-resize-mode').value;
    document.querySelectorAll('[data-when-resize]').forEach(function (el) {
      el.classList.toggle('show', el.dataset.whenResize === mode);
    });
    document.querySelectorAll('[data-when-target]').forEach(function (el) {
      el.classList.toggle('show', $('opt-target-on').checked);
    });
    var lock = $('opt-crop-lock').value;
    document.querySelectorAll('[data-when-crop]').forEach(function (el) {
      el.classList.toggle('show', el.dataset.whenCrop === lock);
    });
  }

  function outputName(item, settings) {
    var ext = Core.FORMATS[settings.format].ext;
    var name = (settings.prefix || '') + baseName(item.name) + (settings.suffix || '') + '.' + ext;
    if (settings.lowercase) name = name.toLowerCase();
    var dir = settings.mirror ? (item.relDir || '') : '';
    return dir ? dir.replace(/\/+$/, '') + '/' + name : name;
  }

  /* ================= item management ====================================== */

  function makeItem(file, relPath) {
    var rel = (relPath || file.webkitRelativePath || file.name || '').replace(/\\/g, '/');
    var relDir = rel.indexOf('/') >= 0 ? rel.slice(0, rel.lastIndexOf('/')) : '';
    return {
      id: state.nextId++,
      file: file,
      name: file.name,
      relPath: rel,
      relDir: relDir,
      size: file.size,
      width: 0,
      height: 0,
      crop: null,
      thumbUrl: null,
      result: null,
      status: 'pending',
      error: null,
      selected: true
    };
  }

  async function addFiles(files, opts) {
    opts = opts || {};
    var accepted = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var rel = opts.paths ? opts.paths[i] : (f.webkitRelativePath || f.name);
      if (!SUPPORTED_RE.test(f.name) && !/^image\//.test(f.type || '')) continue;
      accepted.push(makeItem(f, rel));
    }
    if (!accepted.length) { log('No supported images found in that selection.', 'warn'); return; }
    state.items = state.items.concat(accepted);
    log('Added ' + accepted.length + ' image' + (accepted.length === 1 ? '' : 's') + '.', 'ok');
    if (!state.currentId) state.currentId = state.items[0].id;
    updateCounts();
    renderGrid();
    renderSingle();
    buildThumbs(accepted);
  }

  async function buildThumbs(items) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      try {
        var id = await decodeItem(item, true);
        item.width = id.width;
        item.height = id.height;
        var thumb = Core.resizeImageData(id, 300, 300, { fit: 'inside' });
        var blob = await Core.canvasEncode(thumb, 'image/png');
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        item.thumbUrl = URL.createObjectURL(blob);
      } catch (err) {
        item.status = 'error';
        item.error = err.message;
        log('Could not read ' + item.name + ': ' + err.message, 'err');
      }
      updateTile(item);
      if (item.id === state.currentId) renderSingle();
      if (i % 4 === 3) await yieldToUI();
    }
    updateCounts();
  }

  async function decodeItem(item, allowCacheMiss) {
    if (decodeCache.has(item.id)) {
      var cached = decodeCache.get(item.id);
      decodeCache.delete(item.id);
      decodeCache.set(item.id, cached);
      return cached;
    }
    var id = await Core.decodeFile(item.file);
    item.width = id.width;
    item.height = id.height;
    decodeCache.set(item.id, id);
    while (decodeCache.size > DECODE_CACHE_MAX) {
      decodeCache.delete(decodeCache.keys().next().value);
    }
    return id;
  }

  function currentItem() {
    return state.items.find(function (i) { return i.id === state.currentId; }) || null;
  }

  function selectedItems() {
    return state.items.filter(function (i) { return i.selected; });
  }

  function updateCounts() {
    $('chip-count').textContent = state.items.length;
    var done = state.items.filter(function (i) { return i.status === 'done'; }).length;
    var sel = selectedItems().length;
    $('grid-info').textContent = state.items.length + ' images · ' + sel + ' selected · ' + done + ' converted';
    $('empty-state').hidden = state.items.length > 0;
    $('single-view').hidden = !(state.items.length && state.view === 'individual');
    $('grid-view').hidden = !(state.items.length && state.view === 'grid');
  }

  /* ================= preview rendering ==================================== */

  function previewUrlFor(item) {
    if (state.side === 'after' && item.result) return item.result.url;
    return item.thumbUrl;
  }

  function renderSingle() {
    var item = currentItem();
    var img = $('single-img');
    if (!item) { img.removeAttribute('src'); $('single-meta').textContent = ''; $('single-counter').textContent = '0 / 0'; return; }
    var url = previewUrlFor(item);
    if (url) img.src = url; else img.removeAttribute('src');
    $('crop-badge').hidden = !item.crop;

    var idx = state.items.indexOf(item) + 1;
    $('single-counter').textContent = idx + ' / ' + state.items.length;

    var parts = [];
    parts.push('<b>' + escapeHtml(item.relPath) + '</b>');
    parts.push('source ' + (item.width ? item.width + '×' + item.height : '?') + ' · ' + fmtSize(item.size));
    if (item.crop) parts.push('crop ' + item.crop.width + '×' + item.crop.height + ' @ ' + item.crop.x + ',' + item.crop.y);
    if (item.result) {
      var delta = item.size ? Math.round((1 - item.result.size / item.size) * 100) : 0;
      parts.push('result ' + item.result.width + '×' + item.result.height + ' · ' + fmtSize(item.result.size) +
        ' <span class="' + (delta >= 0 ? 'delta-down' : 'delta-up') + '">' + (delta >= 0 ? '−' : '+') + Math.abs(delta) + '%</span>');
      parts.push('format ' + item.result.format.toUpperCase());
    } else if (item.error) {
      parts.push('<span style="color:#ff9b9b">' + escapeHtml(item.error) + '</span>');
    } else {
      parts.push('not converted yet');
    }
    $('single-meta').innerHTML = parts.join(' · ');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderGrid() {
    var wrap = $('grid-wrap');
    wrap.innerHTML = '';
    state.items.forEach(function (item) {
      wrap.appendChild(buildTile(item));
    });
  }

  function buildTile(item) {
    var tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.id = item.id;
    tile.innerHTML =
      '<input type="checkbox" class="tile-check" ' + (item.selected ? 'checked' : '') + ' title="Select">' +
      '<button class="tile-crop" title="Crop this image">crop</button>' +
      '<div class="tile-thumb"></div>' +
      '<div class="tile-foot"><span class="tile-name"></span><span class="tile-state"></span></div>';
    tile.querySelector('.tile-name').textContent = item.name;
    paintTile(tile, item);

    tile.addEventListener('click', function (ev) {
      if (ev.target.classList.contains('tile-check')) return;
      if (ev.target.classList.contains('tile-crop')) { openCropFor(item); return; }
      state.currentId = item.id;
      renderGrid();
      renderSingle();
    });
    tile.querySelector('.tile-check').addEventListener('change', function (ev) {
      item.selected = ev.target.checked;
      updateCounts();
    });
    return tile;
  }

  function paintTile(tile, item) {
    var thumb = tile.querySelector('.tile-thumb');
    var url = previewUrlFor(item);
    thumb.innerHTML = '';
    if (url) {
      var img = document.createElement('img');
      img.src = url;
      img.alt = item.name;
      thumb.appendChild(img);
    }
    var stateEl = tile.querySelector('.tile-state');
    stateEl.textContent = item.status === 'done' ? 'done'
      : item.status === 'error' ? 'error'
      : item.status === 'working' ? '…' : (item.crop ? 'crop' : 'ready');
    tile.classList.toggle('is-done', item.status === 'done');
    tile.classList.toggle('is-error', item.status === 'error');
    tile.classList.toggle('is-current', item.id === state.currentId);
    tile.querySelector('.tile-check').checked = item.selected;
  }

  function updateTile(item) {
    var tile = document.querySelector('.tile[data-id="' + item.id + '"]');
    if (tile) paintTile(tile, item);
  }

  /* ================= crop ================================================== */

  function cropLockSettings() {
    return {
      lock: $('opt-crop-lock').value,
      customRatio: (Number($('opt-crop-rw').value) || 1) / (Number($('opt-crop-rh').value) || 1)
    };
  }

  async function openCropFor(item) {
    if (!item) { log('Select an image first.', 'warn'); return; }
    var id;
    try { id = await decodeItem(item); }
    catch (err) { log('Cannot open ' + item.name + ': ' + err.message, 'err'); return; }
    var lock = cropLockSettings();
    state.currentId = item.id;
    renderGrid();
    renderSingle();
    global.CropTool.open({
      imageData: id,
      name: item.relPath,
      rect: item.crop,
      lock: lock.lock,
      customRatio: lock.customRatio,
      onLockChange: function (value) { $('opt-crop-lock').value = value; syncConditionalFields(); },
      onApply: function (rect, applyAll) {
        if (applyAll) {
          applyCropToAll(rect, item);
        } else {
          item.crop = rect;
          log('Crop set on ' + item.name + (rect ? ' → ' + rect.width + '×' + rect.height : ' (cleared)'), 'ok');
        }
        updateTile(item);
        renderSingle();
        renderGrid();
      }
    });
  }

  // Proportional transfer: the same relative region on every image, so one crop
  // works across a folder of differently sized photos.
  function applyCropToAll(rect, sourceItem) {
    if (!rect) {
      state.items.forEach(function (i) { i.crop = null; });
      log('Cleared crop on all images.', 'ok');
      return;
    }
    var sw = sourceItem.width || rect.width, sh = sourceItem.height || rect.height;
    var rel = { x: rect.x / sw, y: rect.y / sh, w: rect.width / sw, h: rect.height / sh };
    state.items.forEach(function (i) {
      if (i.id === sourceItem.id) { i.crop = rect; return; }
      if (!i.width || !i.height) { i.pendingRelCrop = rel; return; }
      i.crop = relToRect(rel, i.width, i.height);
    });
    log('Applied crop to all ' + state.items.length + ' images (proportionally).', 'ok');
  }

  function relToRect(rel, w, h) {
    var r = {
      x: Math.round(rel.x * w), y: Math.round(rel.y * h),
      width: Math.max(1, Math.round(rel.w * w)), height: Math.max(1, Math.round(rel.h * h))
    };
    r.width = Math.min(r.width, w - r.x);
    r.height = Math.min(r.height, h - r.y);
    return r;
  }

  /* ================= processing ============================================ */

  function setProgress(done, total, label) {
    var pct = total ? Math.round(done / total * 100) : 0;
    $('bar-fill').style.width = pct + '%';
    $('progress-text').textContent = label || (total ? done + ' / ' + total + '  (' + pct + '%)' : 'idle');
  }

  async function processItems(items) {
    if (state.running) { log('Already running.', 'warn'); return; }
    if (!items.length) { log('Nothing to convert.', 'warn'); return; }
    var settings = readSettings();
    state.running = true;
    state.cancelRequested = false;
    $('btn-cancel').disabled = false;
    var done = 0, failed = 0;
    log('Converting ' + items.length + ' image(s) → ' + Core.FORMATS[settings.format].label + '.');

    for (var i = 0; i < items.length; i++) {
      if (state.cancelRequested) { log('Stopped by user.', 'warn'); break; }
      var item = items[i];
      item.status = 'working';
      updateTile(item);
      setProgress(done, items.length, 'converting ' + item.name);
      try {
        var sourceData = await decodeItem(item);
        if (item.pendingRelCrop && !item.crop) {
          item.crop = relToRect(item.pendingRelCrop, item.width, item.height);
          item.pendingRelCrop = null;
        }
        var out = await Core.processImage(sourceData, settings, item.crop);
        if (item.result && item.result.url) URL.revokeObjectURL(item.result.url);
        var previewBlob = out.blob;
        var previewable = ['png', 'jpg', 'webp', 'gif', 'bmp', 'svg', 'avif', 'ico'].indexOf(settings.format) >= 0;
        var url;
        if (previewable) {
          url = URL.createObjectURL(previewBlob);
        } else {
          // Formats browsers cannot display: preview a PNG rendition instead.
          var pngBlob = await Core.canvasEncode(out.imageData, 'image/png');
          url = URL.createObjectURL(pngBlob);
        }
        item.result = {
          blob: out.blob,
          url: url,
          size: out.blob.size,
          width: out.width,
          height: out.height,
          format: settings.format,
          name: outputName(item, settings)
        };
        item.status = 'done';
        item.error = null;
        done++;
      } catch (err) {
        item.status = 'error';
        item.error = err.message || String(err);
        failed++;
        log('Failed ' + item.name + ': ' + item.error, 'err');
      }
      updateTile(item);
      if (item.id === state.currentId) renderSingle();
      await yieldToUI();
    }

    setProgress(done, items.length, done + ' converted' + (failed ? ', ' + failed + ' failed' : ''));
    log('Done: ' + done + ' converted' + (failed ? ', ' + failed + ' failed.' : '.'), failed ? 'warn' : 'ok');
    state.running = false;
    $('btn-cancel').disabled = true;
    updateCounts();
    renderGrid();
  }

  /* ================= saving ================================================ */

  function hasFS() { return typeof global.showDirectoryPicker === 'function'; }

  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    var url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name.replace(/\//g, '_');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  async function dirHandleForPath(root, relDir) {
    var handle = root;
    if (!relDir) return handle;
    var parts = relDir.split('/').filter(Boolean);
    for (var i = 0; i < parts.length; i++) {
      handle = await handle.getDirectoryHandle(parts[i], { create: true });
    }
    return handle;
  }

  async function writeToOutput(item) {
    if (!item.result) throw new Error('not converted yet');
    if (!state.outputDirHandle) throw new Error('no output folder selected');
    var full = item.result.name;
    var dir = full.indexOf('/') >= 0 ? full.slice(0, full.lastIndexOf('/')) : '';
    var file = full.indexOf('/') >= 0 ? full.slice(full.lastIndexOf('/') + 1) : full;
    var target = await dirHandleForPath(state.outputDirHandle, dir);
    if (!$('opt-overwrite').checked) {
      file = await uniqueName(target, file);
    }
    var fh = await target.getFileHandle(file, { create: true });
    var writable = await fh.createWritable();
    await writable.write(item.result.blob);
    await writable.close();
    return (dir ? dir + '/' : '') + file;
  }

  async function uniqueName(dirHandle, name) {
    var stem = baseName(name), ext = name.slice(stem.length);
    var candidate = name, n = 1;
    while (true) {
      try {
        await dirHandle.getFileHandle(candidate, { create: false });
        candidate = stem + '-' + (n++) + ext;
      } catch (e) {
        return candidate;
      }
    }
  }

  async function saveManyToOutput(items) {
    var pending = items.filter(function (i) { return i.result; });
    if (!pending.length) { log('Convert the images first.', 'warn'); return; }
    if (!state.outputDirHandle) {
      if (hasFS()) { log('Select an output folder first.', 'warn'); return; }
      log('This browser cannot write folders — downloading a .zip instead.', 'warn');
      return downloadZip(pending);
    }
    var ok = 0, bad = 0;
    for (var i = 0; i < pending.length; i++) {
      setProgress(i, pending.length, 'saving ' + pending[i].name);
      try { await writeToOutput(pending[i]); ok++; }
      catch (err) { bad++; log('Save failed for ' + pending[i].name + ': ' + err.message, 'err'); }
    }
    setProgress(ok, pending.length, ok + ' saved' + (bad ? ', ' + bad + ' failed' : ''));
    log('Saved ' + ok + ' file(s) to the output folder' + (bad ? ', ' + bad + ' failed.' : '.'), bad ? 'warn' : 'ok');
  }

  async function downloadZip(items) {
    var pending = (items || state.items).filter(function (i) { return i.result; });
    if (!pending.length) { log('Convert the images first.', 'warn'); return; }
    setProgress(0, 1, 'building zip…');
    var seen = Object.create(null);
    var entries = pending.map(function (i) {
      var name = i.result.name;
      if (seen[name]) { name = baseName(name) + '-' + (seen[i.result.name]) + name.slice(baseName(name).length); }
      seen[i.result.name] = (seen[i.result.name] || 0) + 1;
      return { name: name, blob: i.result.blob };
    });
    var zip = await Core.makeZip(entries);
    downloadBlob(zip, 'green-convert-' + Date.now() + '.zip');
    setProgress(1, 1, 'zip ready (' + fmtSize(zip.size) + ')');
    log('Downloaded ' + entries.length + ' file(s) as .zip (' + fmtSize(zip.size) + ').', 'ok');
  }

  async function saveAsSingle(item) {
    if (!item || !item.result) { log('Convert this image first.', 'warn'); return; }
    var fmt = Core.FORMATS[item.result.format];
    var suggested = item.result.name.split('/').pop();
    if (typeof global.showSaveFilePicker === 'function') {
      try {
        var handle = await global.showSaveFilePicker({
          suggestedName: suggested,
          types: [{ description: fmt.label + ' image', accept: (function () { var a = {}; a[fmt.mime] = ['.' + fmt.ext]; return a; })() }]
        });
        var w = await handle.createWritable();
        await w.write(item.result.blob);
        await w.close();
        log('Saved ' + handle.name + '.', 'ok');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        log('Save As failed (' + err.message + ') — downloading instead.', 'warn');
      }
    }
    downloadBlob(item.result.blob, suggested);
    log('Downloaded ' + suggested + '.', 'ok');
  }

  /* ================= input pickers ========================================= */

  async function pickInputFolder() {
    if (hasFS()) {
      try {
        var dir = await global.showDirectoryPicker({ id: 'gc-input', mode: 'read' });
        state.inputDirHandle = dir;
        $('path-input').textContent = dir.name + '/';
        $('path-input').classList.add('set');
        log('Reading folder "' + dir.name + '"…');
        var collected = [];
        await walkDirectory(dir, dir.name, collected, $('opt-recursive').checked);
        await addFiles(collected.map(function (c) { return c.file; }), { paths: collected.map(function (c) { return c.path; }) });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        log('Folder picker unavailable (' + err.message + ') — using the fallback chooser.', 'warn');
      }
    }
    $('dir-input').click();
  }

  async function walkDirectory(dirHandle, prefix, out, recursive) {
    for await (var entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        if (!SUPPORTED_RE.test(entry.name)) continue;
        var file = await entry.getFile();
        out.push({ file: file, path: prefix + '/' + entry.name });
      } else if (entry.kind === 'directory' && recursive) {
        await walkDirectory(entry, prefix + '/' + entry.name, out, recursive);
      }
    }
  }

  async function pickOutputFolder() {
    if (!hasFS()) {
      log('This browser cannot write to folders directly. Use "Download ALL as .zip" instead. Chrome, Edge or Opera on desktop support folder output.', 'warn');
      return;
    }
    try {
      var dir = await global.showDirectoryPicker({ id: 'gc-output', mode: 'readwrite' });
      if (dir.requestPermission) {
        var perm = await dir.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') { log('Write permission denied for that folder.', 'err'); return; }
      }
      state.outputDirHandle = dir;
      $('path-output').textContent = dir.name + '/';
      $('path-output').classList.add('set');
      log('Output folder set to "' + dir.name + '".', 'ok');
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      log('Could not set output folder: ' + err.message, 'err');
    }
  }

  /* ================= drag & drop =========================================== */

  var dragDepth = 0;
  window.addEventListener('dragenter', function (ev) {
    if (!ev.dataTransfer || ev.dataTransfer.types.indexOf('Files') < 0) return;
    dragDepth++;
    $('drop-veil').hidden = false;
  });
  window.addEventListener('dragover', function (ev) { ev.preventDefault(); });
  window.addEventListener('dragleave', function () {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) $('drop-veil').hidden = true;
  });
  window.addEventListener('drop', async function (ev) {
    ev.preventDefault();
    dragDepth = 0;
    $('drop-veil').hidden = true;
    var items = ev.dataTransfer.items;
    var collected = [];
    if (items && items.length && items[0].webkitGetAsEntry) {
      var entries = [];
      for (var i = 0; i < items.length; i++) {
        var e = items[i].webkitGetAsEntry();
        if (e) entries.push(e);
      }
      for (var k = 0; k < entries.length; k++) await walkEntry(entries[k], '', collected);
    } else {
      var fl = ev.dataTransfer.files;
      for (var j = 0; j < fl.length; j++) collected.push({ file: fl[j], path: fl[j].name });
    }
    if (collected.length) {
      await addFiles(collected.map(function (c) { return c.file; }), { paths: collected.map(function (c) { return c.path; }) });
    }
  });

  function walkEntry(entry, prefix, out) {
    return new Promise(function (resolve) {
      if (entry.isFile) {
        entry.file(function (file) {
          out.push({ file: file, path: (prefix ? prefix + '/' : '') + file.name });
          resolve();
        }, resolve);
      } else if (entry.isDirectory) {
        if (!$('opt-recursive').checked && prefix) { resolve(); return; }
        var reader = entry.createReader();
        var all = [];
        var readBatch = function () {
          reader.readEntries(async function (results) {
            if (!results.length) {
              for (var i = 0; i < all.length; i++) {
                await walkEntry(all[i], (prefix ? prefix + '/' : '') + entry.name, out);
              }
              resolve();
              return;
            }
            all = all.concat(Array.prototype.slice.call(results));
            readBatch();
          }, resolve);
        };
        readBatch();
      } else resolve();
    });
  }

  /* ================= wiring ================================================ */

  function wire() {
    $('btn-pick-input').addEventListener('click', pickInputFolder);
    $('btn-pick-output').addEventListener('click', pickOutputFolder);
    $('btn-pick-files').addEventListener('click', function () { $('file-input').click(); });

    $('file-input').addEventListener('change', function (ev) {
      addFiles(ev.target.files);
      ev.target.value = '';
    });
    $('dir-input').addEventListener('change', function (ev) {
      var files = Array.prototype.slice.call(ev.target.files);
      var recursive = $('opt-recursive').checked;
      if (!recursive) {
        files = files.filter(function (f) {
          var rel = f.webkitRelativePath || f.name;
          return rel.split('/').length <= 2;
        });
      }
      if (files.length) {
        var first = files[0].webkitRelativePath || '';
        var root = first.split('/')[0] || 'folder';
        $('path-input').textContent = root + '/';
        $('path-input').classList.add('set');
      }
      addFiles(files);
      ev.target.value = '';
    });

    $('btn-clear').addEventListener('click', function () {
      state.items.forEach(function (i) {
        if (i.thumbUrl) URL.revokeObjectURL(i.thumbUrl);
        if (i.result && i.result.url) URL.revokeObjectURL(i.result.url);
      });
      state.items = [];
      state.currentId = null;
      decodeCache.clear();
      renderGrid();
      renderSingle();
      updateCounts();
      setProgress(0, 0, 'idle');
      log('List cleared.');
    });

    // view switches
    $('view-individual').addEventListener('click', function () { setView('individual'); });
    $('view-grid').addEventListener('click', function () { setView('grid'); });
    $('side-after').addEventListener('click', function () { setSide('after'); });
    $('side-before').addEventListener('click', function () { setSide('before'); });

    $('btn-prev').addEventListener('click', function () { step(-1); });
    $('btn-next').addEventListener('click', function () { step(1); });
    $('btn-crop-this').addEventListener('click', function () { openCropFor(currentItem()); });
    $('single-stage').addEventListener('click', function () { openCropFor(currentItem()); });

    $('grid-select-all').addEventListener('change', function (ev) {
      state.items.forEach(function (i) { i.selected = ev.target.checked; });
      renderGrid();
      updateCounts();
    });
    $('grid-size').addEventListener('input', function (ev) {
      $('grid-wrap').style.setProperty('--tile', ev.target.value + 'px');
    });

    // crop controls
    $('btn-open-crop').addEventListener('click', function () { openCropFor(currentItem()); });
    $('btn-apply-crop-all').addEventListener('click', function () {
      var item = currentItem();
      if (!item || !item.crop) { log('Crop one image first, then apply it to all.', 'warn'); return; }
      applyCropToAll(item.crop, item);
      renderGrid();
      renderSingle();
    });
    $('btn-clear-crop').addEventListener('click', function () {
      var item = currentItem();
      if (!item) return;
      item.crop = null;
      updateTile(item);
      renderSingle();
      log('Crop cleared on ' + item.name + '.');
    });
    $('btn-clear-crop-all').addEventListener('click', function () {
      state.items.forEach(function (i) { i.crop = null; i.pendingRelCrop = null; });
      renderGrid();
      renderSingle();
      log('All crops cleared.');
    });

    // process
    $('btn-process-all').addEventListener('click', function () { processItems(state.items.slice()); });
    $('btn-process-selected').addEventListener('click', function () { processItems(selectedItems()); });
    $('btn-process-this').addEventListener('click', function () {
      var item = currentItem();
      processItems(item ? [item] : []);
    });
    $('btn-cancel').addEventListener('click', function () { state.cancelRequested = true; });

    // save — single
    $('btn-save-this').addEventListener('click', function () { saveAsSingle(currentItem()); });
    $('btn-save-this-out').addEventListener('click', async function () {
      var item = currentItem();
      if (!item || !item.result) { log('Convert this image first.', 'warn'); return; }
      if (!state.outputDirHandle) { log('Select an output folder first (or use Save As…).', 'warn'); return; }
      try {
        var name = await writeToOutput(item);
        log('Saved ' + name + ' to the output folder.', 'ok');
      } catch (err) { log('Save failed: ' + err.message, 'err'); }
    });
    $('btn-download-this').addEventListener('click', function () {
      var item = currentItem();
      if (!item || !item.result) { log('Convert this image first.', 'warn'); return; }
      downloadBlob(item.result.blob, item.result.name.split('/').pop());
      log('Downloaded ' + item.result.name.split('/').pop() + '.', 'ok');
    });

    // save — batch
    $('btn-save-all-out').addEventListener('click', function () { saveManyToOutput(state.items); });
    $('btn-save-selected-out').addEventListener('click', function () { saveManyToOutput(selectedItems()); });
    $('btn-download-zip').addEventListener('click', function () { downloadZip(state.items); });

    // settings
    $('opt-format').addEventListener('change', syncConditionalFields);
    $('opt-resize-mode').addEventListener('change', syncConditionalFields);
    $('opt-target-on').addEventListener('change', syncConditionalFields);
    $('opt-crop-lock').addEventListener('change', syncConditionalFields);
    $('opt-quality').addEventListener('input', function (ev) { $('quality-val').textContent = ev.target.value; });

    document.addEventListener('keydown', function (ev) {
      if (document.activeElement && /input|select|textarea/i.test(document.activeElement.tagName)) return;
      if (!$('crop-modal').hidden) return;
      if (ev.key === 'ArrowLeft') step(-1);
      if (ev.key === 'ArrowRight') step(1);
    });
  }

  function step(dir) {
    if (!state.items.length) return;
    var idx = state.items.findIndex(function (i) { return i.id === state.currentId; });
    idx = (idx + dir + state.items.length) % state.items.length;
    state.currentId = state.items[idx].id;
    renderSingle();
    renderGrid();
  }

  function setView(view) {
    state.view = view;
    $('view-individual').classList.toggle('is-active', view === 'individual');
    $('view-grid').classList.toggle('is-active', view === 'grid');
    $('view-individual').setAttribute('aria-selected', String(view === 'individual'));
    $('view-grid').setAttribute('aria-selected', String(view === 'grid'));
    updateCounts();
    if (view === 'grid') renderGrid(); else renderSingle();
  }

  function setSide(side) {
    state.side = side;
    $('side-after').classList.toggle('is-active', side === 'after');
    $('side-before').classList.toggle('is-active', side === 'before');
    renderSingle();
    renderGrid();
  }

  function detectCapabilities() {
    var chip = $('fs-support-chip');
    if (hasFS()) {
      chip.textContent = 'folder access: on';
      chip.className = 'chip ok';
    } else {
      chip.textContent = 'folder access: limited — zip download';
      chip.className = 'chip warn';
    }
    // Probe optional codecs so the format list reflects reality.
    var c = document.createElement('canvas');
    c.width = c.height = 1;
    ['image/webp', 'image/avif'].forEach(function (mime) {
      var ok = c.toDataURL(mime).indexOf('data:' + mime) === 0;
      if (!ok) {
        var opt = document.querySelector('#opt-format option[value="' + (mime === 'image/webp' ? 'webp' : 'avif') + '"]');
        if (opt) { opt.disabled = true; opt.textContent += ' — not supported here'; }
      }
    });
  }

  function init() {
    wire();
    syncConditionalFields();
    detectCapabilities();
    setProgress(0, 0, 'idle');
    updateCounts();
    log('Ready. Select an input folder to begin.', 'ok');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
