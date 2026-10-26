/* Незанавешенное — движок скролл-истории.
   Сцена прилипает к экрану (sticky), прокрутка задаёт положение камеры над «миром»
   (фасад дома), кадры-картинки плавно перетекают друг в друга, текст живой. */
(function () {
  'use strict';

  const stage = document.getElementById('stage');
  const story = document.getElementById('story');
  const layers = {
    tiles: document.getElementById('tiles'),
    plates: document.getElementById('plates'),
    dim: document.getElementById('dim'),
    fade: document.getElementById('fade'),
    attached: document.getElementById('attached'),
    frame: document.getElementById('frame')
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const ease = t => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));

  const EXIT = 16;      // длина зоны, где текст гаснет в конце остановки (в % экрана)
  const BEAT = 55;      // длина одного «шага» текста
  const MOVE = 90;      // длина перехода по умолчанию

  let L = null;         // текущая раскладка (DESKTOP / MOBILE)
  let mode = '';
  let unit = 1;         // px на 1% высоты экрана
  let segs = [];        // отрезки таймлайна
  let total = 0;
  let vw = 0, vh = 0;
  let plateEls = {};
  let tileEls = {};
  let stepEls = [];     // [{el, items:[{el, at, until}], blocks}]
  let attachedEl = null, hintEl = null, crowEl = null, crowImgs = [];
  let lastKey = '';
  let crow = { running: false, t0: 0, done: false, armedAt: 0 };
  let fontsReady = false;

  // ---------- построение ----------
  function chooseMode() {
    const w = window.innerWidth, h = window.innerHeight;
    return (w / h < 0.9 || w < 700) ? 'mobile' : 'desktop';
  }

  function plateOf(step) { return step.plate ? L.plates[step.plate] : null; }
  function worldOf(step) { const p = plateOf(step); return p ? p.world : step.world; }
  function camOf(step) { return step.cam || plateOf(step).rect; }

  function build() {
    mode = chooseMode();
    L = mode === 'mobile' ? window.STORY.MOBILE : window.STORY.DESKTOP;
    document.documentElement.dataset.mode = mode;
    for (const k in layers) if (k !== 'dim' && k !== 'fade') layers[k].innerHTML = '';
    plateEls = {}; tileEls = {}; stepEls = [];
    crowImgs = [];

    // плитки миров
    for (const [wn, w] of Object.entries(L.worlds)) {
      if (!w.tiles) continue;
      const t = w.tiles; tileEls[wn] = [];
      for (let i = 0; i < t.n; i++) {
        const img = new Image();
        img.decoding = 'async'; img.alt = ''; img.draggable = false;
        img.className = 'tile';
        img.dataset.src = t.dir + i + '.webp';
        img.style.display = 'none';
        layers.tiles.appendChild(img);
        tileEls[wn].push({ el: img, i, shown: false });
      }
    }
    // кадры-картинки
    for (const [pn, p] of Object.entries(L.plates)) {
      let el;
      if (p.src) {
        el = new Image(); el.decoding = 'async'; el.alt = ''; el.draggable = false;
        el.dataset.src = p.src;
      } else {
        el = document.createElement('div'); el.style.background = p.color || '#000';
      }
      el.className = 'plate'; el.style.display = 'none';
      layers.plates.appendChild(el);
      plateEls[pn] = { el, p, shown: false };
    }

    // обложка: название, подзаголовок, подсказка (едут вместе с картинкой)
    const c = L.cover;
    attachedEl = document.createElement('div');
    attachedEl.className = 'attached';
    attachedEl.innerHTML =
      `<h1 class="title" style="left:${c.title.x}px;top:${c.title.y}px">${c.title.text}</h1>` +
      `<p class="sub" style="left:${c.sub.x}px;top:${c.sub.y}px">${c.sub.text}</p>` +
      `<div class="hint" style="left:${c.hint.x}px;top:${c.hint.y}px"><span>${c.hint.text}</span>` +
      `<svg width="12" height="18" viewBox="0 0 12 18" aria-hidden="true"><path d="M6 1v15M1.2 11.2 6 16l4.8-4.8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></div>`;
    layers.attached.appendChild(attachedEl);
    hintEl = attachedEl.querySelector('.hint');

    // тексты шагов
    const FW = L.frame[0], FH = L.frame[1];
    layers.frame.style.width = FW + 'px';
    layers.frame.style.height = FH + 'px';
    L.steps.forEach((st, si) => {
      const el = document.createElement('div');
      el.className = 'tstep';
      const items = [];
      const blocks = [];
      const exitsAt = new Set();
      for (const b of st.texts) for (const it of b.items) if (it.until != null) exitsAt.add(it.until);
      for (const b of st.texts) {
        const be = document.createElement('div');
        be.className = 'blk a-' + (b.a || 'l');
        be.style.top = b.y + 'px';
        if (b.a === 'c') { be.style.left = (b.x - (b.w || 1000) / 2) + 'px'; be.style.width = (b.w || 1000) + 'px'; }
        else if (b.a === 'r') { be.style.left = (b.x - (b.w || 1000)) + 'px'; be.style.width = (b.w || 1000) + 'px'; }
        else { be.style.left = b.x + 'px'; be.style.width = (b.w || 1000) + 'px'; }
        if (b.w) be.classList.add('wrap');
        for (const it of b.items) {
          const ie = document.createElement('div');
          ie.className = 'it c-' + it.c;
          ie.dataset.text = it.t;
          if (it.g != null) ie.style.marginTop = it.g + 'px';
          const at = it.at || 0;
          if (at > 0 && exitsAt.has(at)) ie.style.setProperty('--d', '420ms');
          be.appendChild(ie);
          items.push({ el: ie, at, until: it.until == null ? 1e9 : it.until, on: false, out: false });
        }
        el.appendChild(be);
        blocks.push({ el: be, b });
      }
      layers.frame.appendChild(el);
      const beats = Math.max(1, ...items.map(i => i.at + 1));
      stepEls.push({ el, items, blocks, beats, hasText: items.length > 0 });
    });

    // ворона
    crowEl = document.createElement('div');
    crowEl.className = 'crow';
    crowEl.style.width = crowEl.style.height = L.crow.size + 'px';
    crowEl.style.top = L.crow.y + 'px';
    for (const s of ['img/crow1.webp', 'img/crow2.webp']) {
      const im = new Image(); im.src = s; im.alt = ''; im.draggable = false; crowEl.appendChild(im); crowImgs.push(im);
    }
    layers.frame.appendChild(crowEl);

    splitAllLines();
    measure(true);
    preload();
  }

  // ---------- разбивка текста на строки (для построчного появления) ----------
  function splitItem(ie) {
    const text = ie.dataset.text;
    ie.innerHTML = '';
    const paras = text.split('\n');
    const lines = [];
    const wrap = ie.parentElement.classList.contains('wrap');
    for (const para of paras) {
      if (!wrap) { lines.push(para); continue; }
      const probe = document.createElement('span');
      probe.className = 'ln probe';
      const words = para.split(/(\s+)/);
      const spans = [];
      for (const w of words) {
        const s = document.createElement('span'); s.textContent = w; probe.appendChild(s); spans.push(s);
      }
      ie.appendChild(probe);
      let cur = '', top = null;
      for (const s of spans) {
        const t = s.offsetTop;
        if (top === null) top = t;
        if (t > top + 2 && s.textContent.trim()) { lines.push(cur.trim()); cur = ''; top = t; }
        cur += s.textContent;
      }
      if (cur.trim()) lines.push(cur.trim());
      probe.remove();
    }
    ie.innerHTML = lines.map((l, i) => `<span class="ln" style="--i:${i}">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('');
  }
  function splitAllLines() {
    for (const s of stepEls) for (const it of s.items) splitItem(it.el);
  }

  // ---------- размеры и таймлайн ----------
  function measure(force) {
    const nvw = stage.clientWidth, nvh = stage.clientHeight;
    const hChanged = Math.abs(nvh - vh) > vh * 0.18 || force;
    vw = nvw; vh = nvh;
    if (hChanged || !segs.length) {
      const progress = total ? clamp((window.scrollY - story.offsetTop) / total, 0, 1) : 0;
      unit = window.innerHeight / 100;
      segs = []; total = 0;
      L.steps.forEach((st, i) => {
        if (i > 0) { const len = (st.move || MOVE) * unit; segs.push({ type: 'move', from: i - 1, to: i, start: total, len }); total += len; }
        const se = stepEls[i];
        const hold = (st.hold || (se.hasText ? se.beats * BEAT + EXIT : 25)) * unit;
        segs.push({ type: 'hold', step: i, start: total, len: hold }); total += hold;
      });
      story.style.height = (total + vh) + 'px';
      if (!force && progress > 0) window.scrollTo(0, story.offsetTop + progress * total);
    }
    // текст масштабируется вместе с кадром
    const FW = L.frame[0], FH = L.frame[1];
    const k = Math.max(vw / FW, vh / FH);
    const ox = (vw - FW * k) / 2, oy = (vh - FH * k) / 2;
    let fs = 1;
    if (mode === 'desktop' && k < 0.82) fs = Math.min(1.45, 0.82 / k);
    layers.frame.style.setProperty('--fs', fs);
    layers.frame.style.transform = `translate(${ox}px,${oy}px) scale(${k})`;
    layers.frame.dataset.k = k;
    // видимая часть кадра — чтобы текст не обрезался на очень широких/высоких экранах
    const vx0 = -ox / k, vy0 = -oy / k, vx1 = (vw - ox) / k, vy1 = (vh - oy) / k;
    const m = mode === 'mobile' ? 14 : 28;
    for (const s of stepEls) for (const bl of s.blocks) {
      const e = bl.el; e.style.transform = '';
      const x = e.offsetLeft, y = e.offsetTop, w = e.offsetWidth;
      let h = 0; for (const c of e.children) h = Math.max(h, c.offsetTop + c.offsetHeight);
      // фактическая ширина строк
      let minL = 1e9, maxR = -1e9;
      for (const ln of e.querySelectorAll('.ln')) { const l = x + ln.offsetLeft; minL = Math.min(minL, l); maxR = Math.max(maxR, l + ln.offsetWidth); }
      if (minL > maxR) { minL = x; maxR = x + w; }
      let dx = 0, dy = 0;
      if (maxR > vx1 - m) dx = vx1 - m - maxR;
      if (minL + dx < vx0 + m) dx = vx0 + m - minL;
      if (y + h > vy1 - m) dy = vy1 - m - (y + h);
      if (y + dy < vy0 + m) dy = vy0 + m - y;
      if (dx || dy) e.style.transform = `translate(${dx}px,${dy}px)`;
    }
    lastKey = '';
  }

  // ---------- камера ----------
  function viewFor(rect, fy) {
    const k = Math.max(vw / rect[2], vh / rect[3]);
    const w = vw / k, h = vh / k;
    return { x: rect[0] + (rect[2] - w) / 2, y: rect[1] + (rect[3] - h) * (fy == null ? 0.5 : fy), w, h };
  }
  function stepView(i) { const st = L.steps[i]; return viewFor(camOf(st), st.fy != null ? st.fy : (st.id === 'cover' ? 0 : 0.5)); }
  function interpView(A, B, t) {
    const r = B.w / A.w;
    if (Math.abs(1 - r) < 1e-3) return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), w: lerp(A.w, B.w, t), h: lerp(A.h, B.h, t) };
    const px = (B.x - r * A.x) / (1 - r), py = (B.y - r * A.y) / (1 - r);
    const f = Math.pow(r, t);
    return { x: px + (A.x - px) * f, y: py + (A.y - py) * f, w: A.w * f, h: A.h * f };
  }
  function zoomView(V, f) { // увеличение вокруг центра
    const w = V.w / f, h = V.h / f;
    return { x: V.x + (V.w - w) / 2, y: V.y + (V.h - h) / 2, w, h };
  }

  // ---------- отрисовка ----------
  function place(el, rect, V) {
    const k = vw / V.w;
    const x = (rect[0] - V.x) * k, y = (rect[1] - V.y) * k, w = rect[2] * k, h = rect[3] * k;
    el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    el.style.width = w.toFixed(2) + 'px';
    el.style.height = h.toFixed(2) + 'px';
  }
  function twinOf(pe) {
    if (!pe.twin) {
      const el = pe.el.cloneNode(false);
      if (pe.el.src) el.src = pe.el.src;
      el.style.display = 'none';
      layers.plates.appendChild(el);
      pe.twin = { el, shown: false };
    }
    return pe.twin;
  }
  function showPlate(name, V, op, z, feather, twin) {
    const pe = plateEls[name]; if (!pe) return;
    if (pe.el.dataset.src && !pe.el.src) load(pe.el);
    const t = twin ? twinOf(pe) : pe;
    if (twin && pe.el.src && !t.el.src) t.el.src = pe.el.src;
    t.used = true;
    if (!t.shown) { t.el.style.display = 'block'; t.shown = true; }
    place(t.el, pe.p.rect, V);
    t.el.style.opacity = op;
    t.el.style.zIndex = z;
    const f = feather || 0;
    if (f > 0.5) {
      const m = `linear-gradient(to right,transparent 0,#000 ${f}px,#000 calc(100% - ${f}px),transparent 100%),linear-gradient(to bottom,transparent 0,#000 ${f}px,#000 calc(100% - ${f}px),transparent 100%)`;
      t.el.style.webkitMaskImage = m; t.el.style.maskImage = m;
      t.el.style.webkitMaskComposite = 'source-in'; t.el.style.maskComposite = 'intersect';
      t.masked = true;
    } else if (t.masked) {
      t.el.style.webkitMaskImage = t.el.style.maskImage = 'none'; t.masked = false;
    }
  }
  function showTiles(wn, V) {
    const w = L.worlds[wn];
    const list = tileEls[wn];
    for (const k in tileEls) if (k !== wn) for (const t of tileEls[k]) t.used = false;
    if (!w || !w.tiles) { stage.style.background = (w && w.color) || '#000'; return; }
    stage.style.background = '#000';
    const T = w.tiles, tw = T.imgW * T.k, th = T.imgTileH * T.k;
    for (const t of list) {
      const rect = [T.x0, t.i * th, tw, th + 0.6];
      const vis = rect[1] < V.y + V.h && rect[1] + rect[3] > V.y;
      t.used = vis;
      if (vis) {
        if (!t.shown) { t.el.style.display = 'block'; t.shown = true; }
        if (!t.el.src) load(t.el);
        place(t.el, rect, V);
      }
    }
  }
  function hideUnused() {
    for (const pe of Object.values(plateEls)) {
      for (const t of [pe, pe.twin]) { if (!t) continue; if (!t.used && t.shown) { t.el.style.display = 'none'; t.shown = false; } t.used = false; }
    }
    for (const list of Object.values(tileEls)) for (const t of list) { if (!t.used && t.shown) { t.el.style.display = 'none'; t.shown = false; } t.used = false; }
  }

  function renderAt(pos) {
    pos = clamp(pos, 0, total - 0.001);
    let seg = segs[segs.length - 1];
    for (const s of segs) if (pos < s.start + s.len) { seg = s; break; }
    const u = (pos - seg.start) / seg.len;

    let V, dim = 0, textStep = -1, beat = -1, exiting = false, endFade = 0;
    if (seg.type === 'hold') {
      const i = seg.step, st = L.steps[i];
      V = stepView(i);
      const wn = worldOf(st);
      showTiles(wn, V);
      if (st.plate) showPlate(st.plate, V, 1, 2, 0, false);
      dim = st.dim || 0;
      if (st.final) endFade = 1;
      textStep = i;
      const se = stepEls[i];
      const holdVh = seg.len / unit;
      const exitStart = st.final ? 1e9 : (holdVh - EXIT) / holdVh;
      exiting = u >= exitStart;
      const span = st.final ? 1 : exitStart;
      beat = Math.min(se.beats - 1, Math.floor((u / span) * se.beats));
      layers.attached.dataset.v = '1';
      positionAttached(V, i === 0 ? 1 : 0);
    } else {
      const A = L.steps[seg.from], B = L.steps[seg.to];
      const t = ease(u);
      const wa = worldOf(A), wb = worldOf(B);
      const pa = A.plate, pb = B.plate;
      const VA = stepView(seg.from), VB = stepView(seg.to);
      if (wa === wb) {
        V = interpView(VA, VB, t);
        showTiles(wa, V);
        const ra = pa ? L.plates[pa].rect[2] : 1e9, rb = pb ? L.plates[pb].rect[2] : 1e9;
        const same = Math.abs(ra - rb) / Math.min(ra, rb) < 0.02;
        // доля «старого» кадра: в общей части кадры перетекают, вне её каждый остаётся собой
        const fade = same ? smooth(0.1, 0.9, t) : (rb < ra ? smooth(0.32, 0.95, t) : smooth(0.05, 0.62, t));
        const bell = Math.sin(Math.PI * t);
        const kv = vw / V.w;
        if (pa && pb) {
          const fB = Math.min(L.plates[pb].rect[2], L.plates[pb].rect[3]) * kv * 0.2 * bell;
          const fA = Math.min(L.plates[pa].rect[2], L.plates[pa].rect[3]) * kv * 0.2 * bell;
          showPlate(pa, V, 1, 2, 0, false);
          showPlate(pb, V, 1, 3, same ? 0 : fB, false);
          showPlate(pa, V, (1 - fade).toFixed(3), 4, same ? 0 : fA, true);
        } else if (pb) {
          showPlate(pb, V, fade.toFixed(3), 3, Math.min(L.plates[pb].rect[2], L.plates[pb].rect[3]) * kv * 0.2 * bell, false);
        } else if (pa) {
          showPlate(pa, V, (1 - fade).toFixed(3), 3, Math.min(L.plates[pa].rect[2], L.plates[pa].rect[3]) * kv * 0.2 * bell, false);
        }
      } else {
        // переход между разными «мирами» — растворение с лёгким наездом
        const VA2 = zoomView(VA, 1 + 0.1 * t), VB2 = zoomView(VB, 1.06 - 0.06 * t);
        const beta = smooth(0.08, 0.92, t);
        if (pb) {
          if (pa) { showTiles(wb, VB2); showPlate(pa, VA2, 1, 2); }
          else showTiles(wa, VA2);
          showPlate(pb, VB2, beta, 3);
        } else {
          showTiles(wb, VB2);
          if (pa) showPlate(pa, VA2, 1 - beta, 3);
        }
        V = t < 0.5 ? VA2 : VB2;
      }
      dim = lerp(A.dim || 0, B.dim || 0, smooth(0.1, 0.9, t));
      if (B.final) endFade = smooth(0.3, 1, t);
      if (seg.from === 0) positionAttached(V, 1); else layers.attached.style.display = 'none';
    }
    hideUnused();
    layers.dim.style.opacity = dim.toFixed(3);
    layers.fade.style.opacity = endFade.toFixed(3);

    // подсказка исчезает, как только начали листать
    const scrolled = pos > 8;
    hintEl.classList.toggle('gone', scrolled);

    updateTexts(textStep, beat, exiting);
    updateCrow(textStep, beat, exiting);
  }

  function positionAttached(V, show) {
    if (!show) { layers.attached.style.display = 'none'; return; }
    layers.attached.style.display = 'block';
    const k = vw / V.w;
    let ox = 0, oy = 0;
    if (L.cover.world) { ox = 0; oy = 0; }
    attachedEl.style.transform = `translate3d(${((ox - V.x) * k).toFixed(2)}px,${((oy - V.y) * k).toFixed(2)}px,0) scale(${k})`;
    // подсказка всегда остаётся в кадре: на широких экранах кадр обрезается снизу,
    // и тогда «спускайся по этажам» со стрелкой поднимается, но не выше подзаголовка
    const c = L.cover, hintH = hintEl.offsetHeight || 46;
    const margin = Math.max(28, vh * 0.06);
    const maxTop = V.y + (vh - margin) / k - hintH;
    const minTop = c.sub.y + (mode === 'mobile' ? 60 : 90);
    const top = Math.max(minTop, Math.min(c.hint.y, maxTop));
    hintEl.style.top = top.toFixed(1) + 'px';
  }

  function updateTexts(si, beat, exiting) {
    const key = si + ':' + beat + ':' + exiting;
    if (key === lastKey) return;
    lastKey = key;
    stepEls.forEach((s, i) => {
      const active = i === si;
      if (active) s.el.classList.add('cur'); else s.el.classList.remove('cur');
      for (const it of s.items) {
        const vis = active && !exiting && beat >= it.at && beat < it.until;
        if (vis && !it.on) { it.on = true; it.el.classList.remove('out'); void it.el.offsetWidth; it.el.classList.add('on'); }
        else if (!vis && it.on) { it.on = false; it.el.classList.remove('on'); it.el.classList.add('out'); }
      }
    });
  }

  // ---------- ворона ----------
  function updateCrow(si, beat, exiting) {
    const st = L.steps[si];
    const inCrow = st && st.crow && !exiting;
    const now = performance.now();
    if (!inCrow) {
      if (crow.armedAt || crow.running || crow.done) resetCrow();
      return;
    }
    if (!crow.armedAt) crow.armedAt = now;
    if (!crow.running && !crow.done && now - crow.armedAt > 1700) { crow.running = true; crow.t0 = now; }
  }
  function resetCrow() {
    crow = { running: false, t0: 0, done: false, armedAt: 0 };
    crowEl.style.opacity = 0;
    const s = stepEls[L.steps.findIndex(s => s.crow)];
    if (s) s.el.style.opacity = '';
  }
  function tickCrow(now) {
    if (!crow.running) return;
    const D = 4300;
    const p = clamp((now - crow.t0) / D, 0, 1);
    const C = L.crow;
    const x = lerp(C.from, C.to, p);
    const y = Math.sin(p * Math.PI * 3) * C.size * 0.035 - p * C.size * 0.08;
    crowEl.style.opacity = 1;
    crowEl.style.transform = `translate3d(${x}px,${y}px,0)`;
    const flap = Math.floor((now - crow.t0) / 170) % 2;
    crowImgs[0].style.opacity = flap ? 0 : 1;
    crowImgs[1].style.opacity = flap ? 1 : 0;
    const s = stepEls[L.steps.findIndex(s => s.crow)];
    s.el.style.opacity = (1 - smooth(0.42, 0.92, p)).toFixed(3);
    if (p >= 1) { crow.running = false; crow.done = true; crowEl.style.opacity = 0; }
  }

  // ---------- загрузка картинок ----------
  function load(img) { if (!img.src && img.dataset.src) img.src = img.dataset.src; }
  function preload() {
    // плитки — сразу; кадры — по порядку истории, в фоне
    for (const list of Object.values(tileEls)) for (const t of list) if (t.i < 3) load(t.el);
    const order = [];
    for (const st of L.steps) if (st.plate && !order.includes(st.plate)) order.push(st.plate);
    let i = 0;
    const next = () => {
      if (i >= order.length) {
        for (const list of Object.values(tileEls)) for (const t of list) load(t.el);
        return;
      }
      const pe = plateEls[order[i++]];
      if (!pe || !pe.el.dataset.src || pe.el.src) { next(); return; }
      load(pe.el);
      const done = () => setTimeout(next, 30);
      if (pe.el.complete) done(); else { pe.el.addEventListener('load', done, { once: true }); pe.el.addEventListener('error', done, { once: true }); }
    };
    next(); next();
  }

  // ---------- финальный блок: раскрывающиеся разделы ----------
  document.querySelectorAll('.acc-h').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.parentElement.classList.toggle('open', !open);
    });
  });

  // ---------- цикл ----------
  let lenis = null;
  function frame(now) {
    if (lenis) lenis.raf(now);
    const pos = window.scrollY - story.offsetTop;
    renderAt(pos);
    tickCrow(now);
    requestAnimationFrame(frame);
  }

  function start() {
    build();
    window.__nz = { segs: () => segs, total: () => total, steps: () => L.steps, mode: () => mode, unit: () => unit };
    if (window.Lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
    }
    requestAnimationFrame(frame);
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (chooseMode() !== mode) {
          const progress = total ? clamp((window.scrollY - story.offsetTop) / total, 0, 1) : 0;
          vh = 0; segs = []; total = 0;
          build();
          window.scrollTo(0, story.offsetTop + progress * total);
        } else {
          const fs0 = layers.frame.style.getPropertyValue('--fs');
          measure(false);
          if (layers.frame.style.getPropertyValue('--fs') !== fs0) { splitAllLines(); measure(false); for (const s of stepEls) for (const it of s.items) if (it.on) it.el.classList.add('on'); }
        }
      }, 120);
    });
  }

  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('400 18px "IBM Plex Mono"', 'Ая'), document.fonts.load('italic 400 18px "IBM Plex Mono"', 'Ая'),
      document.fonts.load('500 18px "IBM Plex Mono"', 'Ая'), document.fonts.load('400 20px Literata', 'Ая'),
      document.fonts.load('italic 400 20px Literata', 'Ая'), document.fonts.load('600 20px Literata', 'Ая')
    ]).catch(() => {}).then(() => { fontsReady = true; start(); });
  } else start();
})();
