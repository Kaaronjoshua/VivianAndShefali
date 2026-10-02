import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = window.WEDDING;
const $ = (s, r = document) => r.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const params = new URLSearchParams(location.search);
const clamp01 = x => Math.min(1, Math.max(0, x));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* =========================================================
   Text binding from config
   ========================================================= */
const weddingDate = new Date(W.date);
const fmtDate = (d, o) => new Date(d).toLocaleDateString(undefined, o);
const fmtTime = d => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
const derived = {
  couple: `${W.groom.first} & ${W.bride.first}`,
  initials: `${W.groom.first[0]}&${W.bride.first[0]}`,
  dateLong: fmtDate(W.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  dateDay: fmtDate(W.date, { day: 'numeric' }),
  dateMonth: fmtDate(W.date, { month: 'short' }),
  dateYear: fmtDate(W.date, { year: 'numeric' })
};
const lookup = path => path.split('.').reduce((o, k) => o?.[k], { ...W, ...derived });
document.querySelectorAll('[data-bind]').forEach(el => {
  const v = lookup(el.dataset.bind);
  if (v != null && v !== '') el.textContent = v; else el.hidden = true;
});
document.title = `${derived.couple} · Wedding Invitation`;

// Personalised link: index.html?to=Aunt%20Mary
const guest = params.get('to');
if (guest) {
  $('#guestGreeting').textContent = `Dear ${guest},`;
}

/* =========================================================
   Music
   ========================================================= */
const musicBtn = $('#musicBtn');
const audio = W.music ? Object.assign(new Audio(W.music), { loop: true, volume: 0.5 }) : null;
if (audio) musicBtn.hidden = false;
function playMusic() { audio?.play().then(() => musicBtn.classList.add('playing')).catch(() => {}); }
musicBtn.addEventListener('click', () => {
  if (!audio) return;
  if (audio.paused) playMusic();
  else { audio.pause(); musicBtn.classList.remove('playing'); }
});

/* =========================================================
   Envelope intro
   ========================================================= */
const envelope = $('#envelope');
function openInvitation() {
  if (envelope.classList.contains('open')) return;
  envelope.classList.add('open');
  playMusic();
  // iOS asks permission for tilt; this tap is the user gesture that allows asking.
  if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
    DeviceOrientationEvent.requestPermission().then(s => s === 'granted' && stage.enableTilt()).catch(() => {});
  } else stage.enableTilt();
  setTimeout(() => {
    envelope.classList.add('gone');
    document.body.classList.remove('locked');
    document.body.classList.add('revealed');
    stage.reveal();
  }, reduceMotion ? 300 : 2300);
  setTimeout(() => envelope.remove(), reduceMotion ? 1400 : 3400);
}
$('#openBtn').addEventListener('click', openInvitation);

/* =========================================================
   Countdown
   ========================================================= */
const cd = { d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-mins'), s: $('#cd-secs') };
function tick() {
  const diff = weddingDate - Date.now();
  if (diff <= 0) {
    $('#countdown').innerHTML = '<p class="married">Just married!</p>';
    clearInterval(cdTimer);
    return;
  }
  const s = Math.floor(diff / 1000);
  cd.d.textContent = Math.floor(s / 86400);
  cd.h.textContent = String(Math.floor(s / 3600) % 24).padStart(2, '0');
  cd.m.textContent = String(Math.floor(s / 60) % 60).padStart(2, '0');
  cd.s.textContent = String(s % 60).padStart(2, '0');
}
const cdTimer = setInterval(tick, 1000);
tick();

/* =========================================================
   Scratch-to-reveal date
   ========================================================= */
const inviteSec = $('#countdown-sec');
function revealDate() {
  if (inviteSec.classList.contains('date-revealed')) return;
  inviteSec.classList.add('date-revealed');
  inviteSec.querySelectorAll('.coin canvas').forEach(c => c.classList.add('cleared'));
  const r = $('#scratch').getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2);
}
$('#revealAll').addEventListener('click', revealDate);

function setupScratch() {
  const coins = [...inviteSec.querySelectorAll('.coin')];
  const done = new Set();
  coins.forEach((coin, i) => {
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    coin.appendChild(cv);
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const size = coin.getBoundingClientRect().width + 2;
    const dpr = Math.min(devicePixelRatio, 2);
    cv.width = cv.height = Math.round(size * dpr);
    ctx.scale(dpr, dpr);

    // gold foil
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, '#f6e3ad'); g.addColorStop(0.3, '#c9a257'); g.addColorStop(0.5, '#f3dc9e');
    g.addColorStop(0.75, '#b08a44'); g.addColorStop(1, '#e6c983');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < size * 4; k++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.3, 1.3);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 7, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(110,78,28,.6)'; ctx.textAlign = 'center';
    ctx.font = `${size * 0.22}px "Great Vibes"`;
    ctx.fillText('♥', size / 2, size * 0.46);
    ctx.font = `500 ${size * 0.075}px Montserrat`;
    ctx.fillText('S C R A T C H', size / 2, size * 0.64);

    let last = null, moves = 0;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const scratch = (a, b) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineWidth = size * 0.2;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      const r = cv.getBoundingClientRect();
      sparkleBurst(r.left + b[0], r.top + b[1], 3);
    };
    const check = () => {
      if (done.has(i)) return;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0, total = 0;
      for (let k = 3; k < d.length; k += 64) { total++; if (d[k] < 40) clear++; }
      if (clear / total > 0.6) {  // ~21% is the transparent corners, so this is about half the coin
        done.add(i);
        cv.classList.add('cleared');
        if (done.size === coins.length) revealDate();
      }
    };
    cv.addEventListener('pointerdown', e => { last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch {} scratch(last, last); });
    cv.addEventListener('pointermove', e => {
      if (!last) {                       // a held mouse dragged in from outside the coin
        if (!(e.buttons & 1)) return;
        last = pos(e);
      }
      const p = pos(e); scratch(last, p); last = p;
      if (++moves % 6 === 0) check();
    });
    const end = () => { last = null; check(); };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', end);
  });
}
document.fonts.ready.then(setupScratch);

/* =========================================================
   Story, events, dress code, gallery
   ========================================================= */
[['#timelineGroom', W.journeys?.groom], ['#timelineBride', W.journeys?.bride]].forEach(([sel, items]) => {
  $(sel).innerHTML = (items || []).map(s => `
  <li class="reveal"><span class="year">${esc(s.years)}</span><h3>${esc(s.title)}</h3><p>${esc(s.place)}</p></li>`).join('');
});

// each timeline's line draws itself as you scroll; diamonds light up as the line passes them
const timelines = document.querySelectorAll('.timeline');
function drawTimeline() {
  timelines.forEach(timeline => {
    const r = timeline.getBoundingClientRect();
    const p = clamp01((innerHeight * 0.65 - r.top) / r.height);
    timeline.style.setProperty('--p', p.toFixed(4));
    const lineY = r.top + p * r.height;
    timeline.querySelectorAll('li').forEach(li => li.classList.toggle('lit', li.getBoundingClientRect().top + 14 < lineY));
  });
  // the hands travel together as the join scrolls up the screen, clasping by the time it's 45% from the top
  const join = $('#journeyJoin');
  if (join) {
    const r = join.getBoundingClientRect();
    join.style.setProperty('--join', clamp01((innerHeight * 0.95 - r.top) / (innerHeight * 0.5)).toFixed(4));
  }
}
addEventListener('scroll', drawTimeline, { passive: true });

$('#events').innerHTML = (W.events || []).map((ev, i) => {
  const map = ev.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([ev.venue, ev.address].filter(Boolean).join(', '))}`;
  return `
  <article class="event-card reveal" style="transition-delay:${i * 0.15}s">
    <h3>${esc(ev.name)}</h3>
    <p class="when">${esc(fmtDate(ev.start, { weekday: 'long', day: 'numeric', month: 'long' }))}<br>${esc(fmtTime(ev.start))}${ev.end ? ' – ' + esc(fmtTime(ev.end)) : ''}</p>
    <p class="venue">${esc(ev.venue)}</p>
    <p class="addr">${esc(ev.address)}</p>
    ${ev.note ? `<p class="note">${esc(ev.note)}</p>` : ''}
    <div class="event-actions">
      <a class="btn ghost" href="${esc(map)}" target="_blank" rel="noopener">Directions</a>
      <button class="btn ghost" data-ics="${i}">Add to calendar</button>
    </div>
  </article>`;
}).join('');
$('#events').addEventListener('click', e => {
  const b = e.target.closest('[data-ics]');
  if (b) downloadIcs(W.events[+b.dataset.ics]);
});

function downloadIcs(ev) {
  const f = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escIcs = s => String(s).replace(/([,;\\])/g, '\\$1');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'BEGIN:VEVENT',
    `UID:${f(ev.start)}-${ev.name.replace(/\W/g, '')}@wedding`,
    `DTSTAMP:${f(new Date())}`, `DTSTART:${f(ev.start)}`, `DTEND:${f(ev.end || ev.start)}`,
    `SUMMARY:${escIcs(derived.couple + ' – ' + ev.name)}`,
    `LOCATION:${escIcs([ev.venue, ev.address].filter(Boolean).join(', '))}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })),
    download: `${ev.name.replace(/\s+/g, '-')}.ics`
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

if (!W.gallery?.length) $('#gallerySec').remove();
else {
  $('#gallery').style.setProperty('--cols', Math.min(3, W.gallery.length));
  $('#gallery').innerHTML = W.gallery.map(src =>
    `<button class="reveal" data-src="${esc(src)}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('');
  const lb = $('#lightbox');
  $('#gallery').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    lb.querySelector('img').src = b.dataset.src;
    lb.showModal();
  });
  lb.addEventListener('click', () => lb.close());
}

// Verse interludes: drop any left empty in config, and never show two in a row (e.g. when the gallery is hidden)
document.querySelectorAll('.verse-sec').forEach(v => { if (v.querySelector('blockquote').hidden) v.remove(); });
document.querySelectorAll('.verse-sec').forEach(v => {
  let next = v.nextElementSibling;
  while (next?.tagName === 'DIALOG') next = next.nextElementSibling;
  if (next?.classList.contains('verse-sec')) v.remove();
});

// Scroll reveal
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Share
$('#shareBtn').addEventListener('click', async () => {
  const data = { title: document.title, text: `You're invited to the wedding of ${derived.couple}!`, url: location.origin + location.pathname };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(data.url); $('#shareBtn').textContent = 'Link copied'; }
  } catch { /* user cancelled */ }
});

/* =========================================================
   Confetti burst + cursor sparkles (2D canvases)
   ========================================================= */
function confetti(x = innerWidth / 2, y = innerHeight * 0.7) {
  if (reduceMotion) return;
  const c = $('#confetti');
  const ctx = c.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#b08a44', '#e3c98a', '#e8b9b9', '#1f4d45', '#ffffff'];
  const bits = Array.from({ length: 160 }, () => ({
    x, y, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 18 - 6,
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 8, c: colors[Math.random() * colors.length | 0]
  }));
  let frames = 0;
  (function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach(b => {
      b.vy += 0.45; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.cos(b.r * 2));
      ctx.restore();
    });
    if (++frames < 220) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })();
}

const sparkCanvas = $('#sparkles');
const sctx = sparkCanvas.getContext('2d');
const sparks = [];
let sparkLoop = false;
function sparkleBurst(x, y, n = 1) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) sparks.push({
    x, y, vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6 + 0.4,
    life: 1, size: 2 + Math.random() * 4, rot: Math.random() * Math.PI
  });
  if (!sparkLoop) { sparkLoop = true; requestAnimationFrame(drawSparks); }
}
function drawSparks() {
  const dpr = Math.min(devicePixelRatio, 2);
  if (sparkCanvas.width !== innerWidth * dpr || sparkCanvas.height !== innerHeight * dpr) {
    sparkCanvas.width = innerWidth * dpr; sparkCanvas.height = innerHeight * dpr;
  }
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx; s.y += s.vy; s.life -= 0.022; s.rot += 0.08;
    if (s.life <= 0) { sparks.splice(i, 1); continue; }
    const r = s.size * s.life;
    sctx.save(); sctx.translate(s.x, s.y); sctx.rotate(s.rot);
    sctx.fillStyle = `rgba(214,176,98,${s.life})`;
    sctx.beginPath(); // four-point star
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4, rr = k % 2 ? r * 0.35 : r;
      sctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    sctx.fill(); sctx.restore();
  }
  if (sparks.length) requestAnimationFrame(drawSparks);
  else { sparkLoop = false; sctx.clearRect(0, 0, innerWidth, innerHeight); }
}
if (finePointer) {
  let lastSpark = 0;
  addEventListener('pointermove', e => {
    const now = performance.now();
    if (now - lastSpark > 28) { lastSpark = now; sparkleBurst(e.clientX, e.clientY, 1); }
  });
}

/* =========================================================
   3D STAGE — stardust portraits that merge into a heart
   ========================================================= */
const stage = (() => {
  const canvas = $('#scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return { reveal() {}, enableTilt() {} }; // no WebGL: page still works without the 3D hero
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- layout constants (world units) ---------- */
  const PW = 2.4, PH = 3.2;          // portrait size
  const SX = 1.75, CY = -0.4;         // portrait x offset / centre y
  const HEART_S = 1.5;                // heart scale
  const HEART_C = new THREE.Vector3(0, CY + 0.5, 0);
  const small = innerWidth < 700;
  const COLS = small ? 96 : 150;
  const ROWS = Math.round(COLS * PH / PW);
  const SPACING = PW / COLS;

  /* ---------- portrait sampling ---------- */
  function loadImage(src) {
    return new Promise(res => {
      if (!src) return res(null);
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  function archPath(ctx, w, h, inset = 0) {
    const r = (w - inset * 2) / 2;
    ctx.beginPath();
    ctx.moveTo(inset, h - inset);
    ctx.lineTo(inset, inset + r);
    ctx.arc(w / 2, inset + r, r, Math.PI, 0);
    ctx.lineTo(w - inset, h - inset);
    ctx.closePath();
  }
  function samplePortrait(img, tint, crop) {
    const c = Object.assign(document.createElement('canvas'), { width: COLS, height: ROWS });
    const ctx = c.getContext('2d', { willReadFrequently: true });
    archPath(ctx, COLS, ROWS); ctx.clip();
    if (img && crop) { // crop to the face so it has enough particles to be recognisable
      const sw = Math.min(img.width, img.width * crop.w);
      const sh = Math.min(img.height, sw * PH / PW);
      const sx = Math.min(img.width - sw, Math.max(0, img.width * crop.x - sw / 2));
      const sy = Math.min(img.height - sh, Math.max(0, img.height * (crop.y || 0)));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COLS, ROWS);
    } else if (img) {
      const s = Math.max(COLS / img.width, ROWS / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (COLS - w) / 2, Math.min(0, (ROWS - h) * 0.3), w, h);
    } else { // placeholder silhouette until real photos are added
      const g = ctx.createLinearGradient(0, 0, 0, ROWS);
      g.addColorStop(0, tint[0]); g.addColorStop(1, tint[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, COLS, ROWS);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(COLS / 2, ROWS * 0.4, COLS * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(COLS / 2, ROWS * 0.88, COLS * 0.34, ROWS * 0.28, 0, Math.PI, 0); ctx.fill();
    }
    const d = ctx.getImageData(0, 0, COLS, ROWS).data;
    const out = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = (y * COLS + x) * 4;
      if (d[i + 3] < 200) continue;
      // gentle contrast + saturation boost so faces read clearly as particles
      const c = [d[i], d[i + 1], d[i + 2]].map(v => Math.pow(v / 255, 1.25));
      const l = (c[0] + c[1] + c[2]) / 3;
      const [r, g, b] = c.map(v => Math.min(1, Math.max(0, l + (v - l) * 1.25)));
      out.push({ u: x / COLS, v: y / ROWS, r, g, b });
    }
    return out;
  }
  function archOutline(n) { // points around the arch frame, in portrait-local units
    const pts = [], r = PW / 2, straight = PH - r, perim = 2 * straight + Math.PI * r + PW;
    for (let i = 0; i < n; i++) {
      let t = (i / n) * perim, x, y;
      if (t < straight) { x = -r; y = -PH / 2 + t; }
      else if ((t -= straight) < Math.PI * r) { const a = Math.PI - t / r; x = Math.cos(a) * r; y = PH / 2 - r + Math.sin(a) * r; }
      else if ((t -= Math.PI * r) < straight) { x = r; y = PH / 2 - r - t; }
      else { t -= straight; x = r - t; y = -PH / 2; }
      pts.push([x * 1.04, y * 1.03 + 0.02]);
    }
    return pts;
  }
  const inHeart = (x, y) => { const a = x * x + y * y - 1; return a * a * a - x * x * y * y * y <= 0; };
  function heartFill() {
    for (;;) {
      const x = (Math.random() * 2 - 1) * 1.2, y = Math.random() * 2.4 - 1.1;
      if (inHeart(x, y)) return [x, y];
    }
  }
  const heartEdge = (() => { // boundary by marching out from the centre
    const pts = [];
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI * 2;
      let r = 0;
      while (r < 2 && inHeart(Math.cos(a) * (r + 0.01), 0.1 + Math.sin(a) * (r + 0.01))) r += 0.01;
      pts.push([Math.cos(a) * r, 0.1 + Math.sin(a) * r]);
    }
    return pts;
  })();

  /* ---------- particle material ---------- */
  const uniforms = {
    uTime: { value: 0 }, uAssemble: { value: 0 }, uMerge: { value: 0 },
    uSize: { value: 40 }, uPixelRatio: { value: renderer.getPixelRatio() },
    uBurst0: { value: new THREE.Vector4() }, uBurst1: { value: new THREE.Vector4() },
    uHide: { value: new THREE.Vector2() }, uHeartC: { value: HEART_C }
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime, uAssemble, uMerge, uSize, uPixelRatio;
      uniform vec3 uHeartC;
      uniform vec4 uBurst0, uBurst1;
      uniform vec2 uHide;
      attribute vec3 aHeart, aScatter, aColor;
      attribute float aRand, aSide, aKind;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        // 1. fly in from a scattered cloud (staggered per particle)
        float a = smoothstep(0.0, 1.0, clamp(uAssemble * 1.6 - aRand * 0.6, 0.0, 1.0));
        vec3 p = mix(aScatter, position, a);

        // 2. merge both portraits into one beating heart (driven by scroll)
        float m = smoothstep(0.0, 1.0, clamp(uMerge * 1.5 - aRand * 0.5, 0.0, 1.0));
        float beat = pow(0.5 + 0.5 * sin(uTime * 2.6), 12.0);
        vec3 h = uHeartC + (aHeart - uHeartC) * (1.0 + 0.06 * beat * m);
        p = mix(p, h, m);
        float swirl = sin(3.14159 * m);
        float ang = swirl * (1.2 + aRand * 1.8) * aSide;
        p.xz = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * p.xz;
        p.y += swirl * sin(aRand * 40.0 + uTime * 1.5) * 0.35;

        // idle shimmer
        p += 0.014 * vec3(sin(uTime * 1.3 + aRand * 50.0), cos(uTime * 1.1 + aRand * 70.0), sin(uTime * 0.9 + aRand * 30.0));

        // 3. tap shockwave
        vec4 b = aSide < 0.0 ? uBurst0 : uBurst1;
        vec3 bd = p - b.xyz;
        float bl = length(bd);
        p += (bd / max(bl, 0.001)) * b.w * (0.3 + aRand * 1.2) * smoothstep(3.5, 0.0, bl);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixelRatio * (0.7 + aRand * 0.6) * (1.0 + aKind * 0.5) / -mv.z;

        vec3 heartCol = mix(vec3(0.93, 0.62, 0.64), vec3(0.72, 0.22, 0.29), aRand);
        vColor = mix(aColor, aKind > 0.5 ? aColor : heartCol, m * 0.7);
        float hide = (aSide < 0.0 ? uHide.x : uHide.y) * (1.0 - m);
        vAlpha = mix(0.3, 1.0, a) * (1.0 - hide);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.32, d) * vAlpha);
      }`
  });
  let points = null;

  function buildParticles(bImg, gImg) {
    const all = [];
    const heartPos = (x, y, z) => [HEART_C.x + x * HEART_S, HEART_C.y + (y - 0.1) * HEART_S, z];
    const scatter = () => {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(5 + Math.random() * 6);
      return [v.x, v.y, v.z * 0.6];
    };
    const golds = [[0.95, 0.85, 0.6], [0.75, 0.58, 0.28], [0.9, 0.76, 0.45]];
    [[gImg, -1, ['#9fb8b0', '#3f6b62'], W.groom.crop], [bImg, 1, ['#e9c2c0', '#b98387'], W.bride.crop]].forEach(([img, side, tint, crop]) => {
      for (const s of samplePortrait(img, tint, crop)) {
        const [hx, hy] = heartFill();
        all.push({
          photo: [side * SX + (s.u - 0.5) * PW + (Math.random() - 0.5) * SPACING * 0.7,
                  CY + (0.5 - s.v) * PH + (Math.random() - 0.5) * SPACING * 0.7,
                  (Math.random() - 0.5) * 0.05],
          heart: heartPos(hx, hy, (Math.random() - 0.5) * 0.7 * (1.2 - Math.abs(hx))),
          color: [s.r, s.g, s.b], side, kind: 0
        });
      }
      const frame = archOutline(small ? 360 : 520);
      frame.forEach(([fx, fy], i) => {
        const e = heartEdge[Math.floor(((i / frame.length) * 0.5 + (side > 0 ? 0.5 : 0)) * heartEdge.length) % heartEdge.length];
        all.push({
          photo: [side * SX + fx, CY + fy, 0.02],
          heart: heartPos(e[0] * 1.03, 0.1 + (e[1] - 0.1) * 1.03, 0),
          color: golds[i % 3], side, kind: 1
        });
      });
    });
    const n = all.length;
    const A = k => new Float32Array(n * k);
    const pos = A(3), heart = A(3), scat = A(3), col = A(3), rand = A(1), sideA = A(1), kind = A(1);
    all.forEach((p, i) => {
      pos.set(p.photo, i * 3); heart.set(p.heart, i * 3); scat.set(scatter(), i * 3); col.set(p.color, i * 3);
      rand[i] = Math.random(); sideA[i] = p.side; kind[i] = p.kind;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aHeart', new THREE.BufferAttribute(heart, 3));
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scat, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    geo.setAttribute('aSide', new THREE.BufferAttribute(sideA, 1));
    geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
    points = new THREE.Points(geo, material);
    points.frustumCulled = false;
    world.add(points);
  }
  // Sharp copy of each photo, cropped exactly like the particle portrait, shown until the merge
  function photoCanvas(img, crop) {
    const c = Object.assign(document.createElement('canvas'), { width: 600, height: Math.round(600 * PH / PW) });
    const ctx = c.getContext('2d');
    if (crop) {
      const sw = Math.min(img.width, img.width * crop.w);
      const sh = Math.min(img.height, sw * PH / PW);
      const sx = Math.min(img.width - sw, Math.max(0, img.width * crop.x - sw / 2));
      const sy = Math.min(img.height - sh, Math.max(0, img.height * (crop.y || 0)));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    } else {
      const k = Math.max(c.width / img.width, c.height / img.height);
      const w = img.width * k, h = img.height * k;
      ctx.drawImage(img, (c.width - w) / 2, Math.min(0, (c.height - h) * 0.3), w, h);
    }
    return c;
  }
  const photos = []; // { el, side }
  Promise.all([loadImage(W.bride.photo), loadImage(W.groom.photo)]).then(([b, g]) => {
    buildParticles(b, g);
    [[g, W.groom.crop, '#photoGroom', -1], [b, W.bride.crop, '#photoBride', 1]].forEach(([img, crop, sel, side]) => {
      if (!img) return;
      $(sel).appendChild(photoCanvas(img, crop));
      photos.push({ el: $(sel), side });
    });
  });

  /* ---------- optional 3D avatars (.glb) replace a portrait until the merge ---------- */
  const avatars = [];
  const mixers = [];
  const loader = new GLTFLoader();
  [[W.groom, -1], [W.bride, 1]].forEach(([person, side]) => {
    if (!person.model) return;
    loader.load(person.model, gltf => {
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      obj.scale.setScalar((PH * 1.05) / box.getSize(new THREE.Vector3()).y);
      const box2 = new THREE.Box3().setFromObject(obj);
      const c = box2.getCenter(new THREE.Vector3());
      obj.position.set(-c.x, -box2.min.y - PH / 2, -c.z);
      obj.rotation.y = -side * 0.25;
      const holder = new THREE.Group();
      holder.position.set(side * SX, CY, 0.2);
      holder.add(obj);
      world.add(holder);
      avatars.push({ holder, side, spin: 0, spinTarget: 0 });
      uniforms.uHide.value[side < 0 ? 'x' : 'y'] = 1;
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(obj);
        mixer.clipAction(gltf.animations[0]).play();
        mixers.push(mixer);
      }
    }, undefined, err => console.warn('Avatar failed to load, showing the photo instead:', err));
  });

  /* ---------- petals ---------- */
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, -0.1);
  petalShape.bezierCurveTo(0.09, -0.05, 0.08, 0.07, 0, 0.11);
  petalShape.bezierCurveTo(-0.08, 0.07, -0.09, -0.05, 0, -0.1);
  const PETALS = reduceMotion ? 20 : (small ? 45 : 90);
  const petalMesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(petalShape, 6),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 }), PETALS);
  const petalColors = ['#f2c4c6', '#e8a9ae', '#fbe9e7', '#f6d8b8', '#ffffff'].map(c => new THREE.Color(c));
  const petals = Array.from({ length: PETALS }, (_, i) => {
    petalMesh.setColorAt(i, petalColors[i % petalColors.length]);
    return {
      p: new THREE.Vector3((Math.random() - 0.5) * 16, Math.random() * 14 - 7, Math.random() * 7 - 4),
      r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      vr: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2),
      speed: 0.35 + Math.random() * 0.5, phase: Math.random() * 6, s: 0.7 + Math.random() * 0.8
    };
  });
  scene.add(petalMesh);
  const dummy = new THREE.Object3D();

  /* ---------- camera fit ---------- */
  const view = { dist: 12, targetY: 0.9 };
  const lookTarget = new THREE.Vector3();
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    view.dist = Math.max(12, (camera.aspect < 1 ? 6.7 : 7) / (2 * tanHalf * camera.aspect)); // keep both portraits in frame
    const visH = 2 * tanHalf * view.dist;
    view.targetY = CY + (0.5 - (camera.aspect < 1 ? 0.53 : 0.33)) * visH; // phones: portraits sit higher, leaving room for tags + verses
    uniforms.uSize.value = (SPACING * h) / (2 * tanHalf) * 1.9;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  /* ---------- scroll → merge ---------- */
  const hero = $('#hero');
  const root = document.documentElement;
  let merge = 0;
  function readMerge() {
    const r = hero.getBoundingClientRect();
    const total = r.height - innerHeight;
    const raw = total > 0 ? clamp01(-r.top / total) : 0;
    const m = clamp01((raw - 0.1) / 0.75);
    return m * m * (3 - 2 * m);
  }

  /* ---------- pointer ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPoint = new THREE.Vector3();
  const look = { x: 0, y: 0 };
  let drag = null, turn = 0, turnTarget = 0;
  const bursts = [{ t: -9, at: new THREE.Vector3() }, { t: -9, at: new THREE.Vector3() }];

  function toLocal(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hitPoint)) return null;
    return world.worldToLocal(hitPoint.clone());
  }
  function portraitAt(p) {
    if (!p) return -1;
    if (merge > 0.5) return Math.abs(p.x - HEART_C.x) < 2.2 && Math.abs(p.y - HEART_C.y) < 2.1 ? 2 : -1;
    for (const side of [-1, 1]) {
      if (Math.abs(p.x - side * SX) < PW / 2 + 0.15 && Math.abs(p.y - CY) < PH / 2 + 0.15) return side < 0 ? 0 : 1;
    }
    return -1;
  }
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, start: turnTarget, moved: 0 }; });
  addEventListener('pointermove', e => {
    look.x = (e.clientX / innerWidth) * 2 - 1;
    look.y = (e.clientY / innerHeight) * 2 - 1;
    if (drag) {
      const dx = e.clientX - drag.x;
      drag.moved = Math.max(drag.moved, Math.abs(dx), Math.abs(e.clientY - drag.y));
      turnTarget = THREE.MathUtils.clamp(drag.start + dx * 0.005, -0.8, 0.8);
    }
    if (e.target === canvas) {
      const p = toLocal(e);
      if (e.pointerType === 'mouse') canvas.style.cursor = portraitAt(p) >= 0 ? 'pointer' : (drag ? 'grabbing' : 'grab');
    }
  });
  addEventListener('pointerup', e => {
    if (drag && drag.moved < 8 && e.target === canvas) {
      const p = toLocal(e);
      const which = portraitAt(p);
      const hit = which === 2 ? [0, 1] : which >= 0 ? [which] : [];
      hit.forEach(i => { bursts[i].t = clock.elapsedTime; bursts[i].at.copy(p); });
      avatars.forEach(a => { if (hit.includes(a.side < 0 ? 0 : 1)) a.spinTarget += Math.PI * 2; });
      if (hit.length) sparkleBurst(e.clientX, e.clientY, 14);
    }
    drag = null;
  });
  addEventListener('pointercancel', () => { drag = null; });

  let tilt = null;
  const onTilt = e => {
    if (e.gamma == null) return;
    tilt = { x: THREE.MathUtils.clamp(e.gamma / 30, -1, 1), y: THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1) };
  };

  /* ---------- photos, name tags and verses pinned to the portraits ---------- */
  const verseEls = { [-1]: $('#verseGroom'), [1]: $('#verseBride') };
  const tagEls = { [-1]: $('#tagGroom'), [1]: $('#tagBride') };
  const vp = new THREE.Vector3();
  const toScreen = (x, y) => {
    vp.set(x, y, 0); world.localToWorld(vp); vp.project(camera);
    return [(vp.x + 1) / 2 * canvas.clientWidth, (1 - vp.y) / 2 * canvas.clientHeight];
  };
  const place = (el, x, y, w) => { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w) el.style.width = w + 'px'; };
  function placeOverlays(assemble) {
    camera.updateMatrixWorld();
    const show = clamp01(assemble * 1.6) * clamp01(1 - merge * 3);      // photos fade in, then dissolve into the heart
    const extras = clamp01(assemble * 1.5 - 0.5) * clamp01(1 - merge * 4);
    const rect = side => {
      const [l, t] = toScreen(side * SX - PW / 2, CY + PH / 2);
      const [r, b] = toScreen(side * SX + PW / 2, CY - PH / 2);
      return { l, t, r, b, w: r - l, h: b - t };
    };
    const g = rect(-1);
    const beside = g.l >= 230;                                          // room for the tags at the sides?
    [-1, 1].forEach(side => {
      const p = rect(side);
      const photo = photos.find(ph => ph.side === side);
      if (photo) {
        place(photo.el, p.l, p.t, p.w); photo.el.style.height = p.h + 'px';
        photo.el.style.opacity = show.toFixed(3);
        uniforms.uHide.value[side < 0 ? 'x' : 'y'] = 1 - clamp01(merge * 3); // no particles until the photos dissolve into the heart
      }
      let below = p.b + 14;
      const tag = tagEls[side];
      if (tag) {
        tag.classList.toggle('beside', beside);
        if (beside) {
          const w = Math.min(300, (side < 0 ? p.l : canvas.clientWidth - p.r) - 40);
          place(tag, side < 0 ? p.l - 22 - w : p.r + 22, p.t + p.h / 2 - tag.offsetHeight / 2, w);
        } else {
          place(tag, p.l - 10, below, p.w + 20);
          below += tag.offsetHeight + 6;
        }
        tag.style.opacity = extras.toFixed(3);
      }
      const verse = verseEls[side];
      if (verse && !verse.querySelector('blockquote').hidden) {
        place(verse, p.l + p.w / 2, below, beside ? p.w * 1.35 : p.w + 20);
        verse.style.opacity = extras.toFixed(3);
      }
    });
  }

  /* ---------- loop ---------- */
  let revealAt = null;
  world.visible = false;
  let onScreen = true;
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; }).observe(canvas);
  const clock = new THREE.Clock();
  const lerp = THREE.MathUtils.lerp;
  const easeBack = x => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    merge = readMerge();
    root.style.setProperty('--merge', merge.toFixed(3));
    if (!onScreen) return;
    const k = 1 - Math.pow(0.001, dt);

    const assemble = revealAt === null ? 0 : clamp01((t - revealAt) / 3.2);
    uniforms.uTime.value = t;
    uniforms.uAssemble.value = assemble;
    uniforms.uMerge.value = merge;
    [uniforms.uBurst0, uniforms.uBurst1].forEach((u, i) => {
      const age = (t - bursts[i].t) / 1.4;
      u.value.set(bursts[i].at.x, bursts[i].at.y, bursts[i].at.z, age >= 0 && age < 1 ? Math.sin(Math.PI * age) * (1 - age) * 1.6 : 0);
    });

    const src = tilt || look;
    if (!drag) turnTarget = lerp(turnTarget, 0, k * 0.3);
    turn = lerp(turn, turnTarget, k);
    world.rotation.y = turn;
    camera.position.x = lerp(camera.position.x, src.x * 0.9, k * 0.5);
    camera.position.y = lerp(camera.position.y, view.targetY - src.y * 0.6, k * 0.5);
    camera.position.z = view.dist + (1 - assemble) * 3;
    lookTarget.set(0, view.targetY, 0);
    camera.lookAt(lookTarget);

    avatars.forEach(a => {
      a.spin = lerp(a.spin, a.spinTarget, k * 0.5);
      a.holder.rotation.y = a.spin;
      a.holder.scale.setScalar(Math.max(0.001, clamp01(assemble * 1.5 - 0.3) * (1 - merge)));
      a.holder.position.y = CY + Math.sin(t * 0.9 + a.side) * 0.05;
    });

    petals.forEach((pt, i) => {
      pt.p.y -= pt.speed * dt;
      pt.p.x += Math.sin(t * 0.8 + pt.phase) * 0.25 * dt;
      if (pt.p.y < -7) { pt.p.y = 7; pt.p.x = (Math.random() - 0.5) * 16; }
      pt.r.x += pt.vr.x * dt; pt.r.y += pt.vr.y * dt; pt.r.z += pt.vr.z * dt;
      dummy.position.copy(pt.p); dummy.rotation.copy(pt.r); dummy.scale.setScalar(pt.s);
      dummy.updateMatrix();
      petalMesh.setMatrixAt(i, dummy.matrix);
    });
    petalMesh.instanceMatrix.needsUpdate = true;

    mixers.forEach(m => m.update(dt));
    placeOverlays(assemble);
    renderer.render(scene, camera);
  }
  frame();

  return {
    reveal() {
      if (revealAt !== null) return;
      world.visible = true;
      revealAt = params.has('still') ? -100 : clock.elapsedTime; // ?still skips the fly-in (for screenshots)
    },
    enableTilt() { addEventListener('deviceorientation', onTilt); }
  };
})();

/* =========================================================
   RING FILM — video frames scrubbed by scroll
   ========================================================= */
(() => {
  const sec = $('#ringFilm');
  const DIR = 'assets/ring-frames/';
  fetch(DIR + 'manifest.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(init)
    .catch(() => sec.remove()); // no frames yet: the photo-built promise scene stays instead

  function init(m) {
    $('#promise')?.remove(); // real footage replaces the photo-built scene
    sec.hidden = false;
    sec.style.setProperty('--len', W.ringFilm?.scrollLength || 4);
    const cv = $('#ringCanvas');
    const ctx = cv.getContext('2d');
    const count = m.count;
    const frames = new Array(count);
    const src = i => `${DIR}frame_${String(i + 1).padStart(4, '0')}.jpg`;

    const caps = (W.ringFilm?.captions || []).map(c => {
      const p = document.createElement('p');
      p.textContent = c.text;
      $('#ringCaptions').appendChild(p);
      return { ...c, el: p };
    });

    // Load coarse-to-fine (every 16th frame first) so fast scrolling always has something close to show.
    const order = [];
    const seen = new Set();
    for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    let next = 0;
    const loadNext = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.onload = () => { frames[i] = img; if (Math.abs(i - want) < Math.abs(shown - want) || shown < 0) draw(); loadNext(); };
      img.onerror = loadNext;
      img.src = src(i);
    };
    for (let k = 0; k < 6; k++) loadNext();

    let want = 0, shown = -1;
    let floral = null;
    { const f = new Image(); f.onload = () => { floral = f; shown = -1; draw(); }; f.src = 'assets/mughal-floral.svg'; }
    function nearest(i) {
      for (let d = 0; d < count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    }
    function size() {
      const dpr = Math.min(devicePixelRatio, 2);
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
      shown = -1;
      draw();
    }
    function draw() {
      const i = nearest(want);
      if (i < 0 || i === shown) return;
      shown = i;
      const img = frames[i];
      const cw = cv.width, ch = cv.height;
      const dpr = cw / cv.clientWidth;
      // the film plays inside a grand Mughal arch: a broad floral band edged in gold, with a second arch around it
      const u = dpr;
      const s = Math.min(Math.min(cw * 0.86, cw - 110 * u) / img.width, (ch * 0.65) / img.height);
      const w = img.width * s, h = img.height * s;
      const x = (cw - w) / 2, y = ch * 0.2;
      const cx = x + w / 2;
      const rise = Math.min(w * 0.62, h * 0.5);     // height of the pointed crown
      const arch = inset => {
        const L = x - inset, R = x + w + inset, B = y + h + inset;
        const top = y - inset * 1.35, spring = y + rise;
        ctx.moveTo(L, B);
        ctx.lineTo(L, spring);
        ctx.bezierCurveTo(L, spring - rise * 0.62, cx - (R - L) * 0.16, top + rise * 0.22, cx, top);
        ctx.bezierCurveTo(cx + (R - L) * 0.16, top + rise * 0.22, R, spring - rise * 0.62, R, spring);
        ctx.lineTo(R, B);
        ctx.closePath();
      };
      const line = (inset, width, style) => {
        ctx.beginPath(); arch(inset * u); ctx.lineWidth = width * u; ctx.strokeStyle = style; ctx.stroke();
      };
      const gold = ctx.createLinearGradient(x, y, x + w, y + h);
      gold.addColorStop(0, '#9a7432'); gold.addColorStop(0.35, '#f3dfa6');
      gold.addColorStop(0.55, '#c9a25a'); gold.addColorStop(0.8, '#f0d896'); gold.addColorStop(1, '#9a7432');
      const BAND_IN = 6, BAND_OUT = 34, OUTER = 50;

      ctx.clearRect(0, 0, cw, ch);
      ctx.save();                                   // deep shadow lifting the whole arch off the ceiling
      ctx.shadowColor = 'rgba(0,0,0,.55)';
      ctx.shadowBlur = 50 * u;
      ctx.shadowOffsetY = 20 * u;
      ctx.beginPath(); arch(BAND_OUT * u); ctx.fillStyle = '#0e1f47'; ctx.fill();
      ctx.restore();

      // floral band (ring between the two arch outlines)
      ctx.save();
      ctx.beginPath(); arch(BAND_OUT * u); arch(BAND_IN * u); ctx.clip('evenodd');
      ctx.fillStyle = '#1c3778'; ctx.fillRect(0, 0, cw, ch);
      if (floral) {
        const pat = ctx.createPattern(floral, 'repeat');
        pat.setTransform(new DOMMatrix().translate(cx, y).scale(0.5 * u));
        ctx.fillStyle = pat; ctx.fillRect(0, 0, cw, ch);
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath(); arch(0); ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      ctx.lineJoin = 'round';
      line(1.5, 3, gold);                           // gilt edge hugging the film
      line(BAND_IN, 3.5, gold);
      line(BAND_IN + 3, 1, '#b85c38');              // terracotta pinstripes, as on the painted arches
      line(BAND_OUT - 3, 1, '#b85c38');
      line(BAND_OUT, 3.5, gold);
      line(OUTER - 8, 1, '#c9a25a');                // second, outer arch
      ctx.setLineDash([0.1, 7 * u]); ctx.lineCap = 'round';
      line(OUTER - 4, 3, '#e3c98a');                // row of gold beads
      ctx.setLineDash([]); ctx.lineCap = 'butt';
      line(OUTER, 1.6, gold);

      // finial (kalash) on the crown
      const ft = y - OUTER * u * 1.35;
      ctx.fillStyle = gold;
      ctx.beginPath(); ctx.arc(cx, ft - 7 * u, 5.5 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, ft - 17 * u, 3.2 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 1.8 * u, ft - 19 * u); ctx.lineTo(cx, ft - 32 * u); ctx.lineTo(cx + 1.8 * u, ft - 19 * u);
      ctx.closePath(); ctx.fill();

      // plinth under the arch
      const pb = y + h + OUTER * u;
      ctx.fillStyle = gold;
      ctx.fillRect(x - (OUTER + 14) * u, pb, w + (OUTER + 14) * 2 * u, 5 * u);
      ctx.fillStyle = '#c9a25a';
      ctx.fillRect(x - (OUTER + 6) * u, pb + 8 * u, w + (OUTER + 6) * 2 * u, 1.2 * u);
    }
    function onScroll() {
      const r = sec.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? clamp01(-r.top / total) : 0;
      sec.style.setProperty('--film', p.toFixed(4));
      // vibrant tiles bloom out from behind the arch, completing at the ring moment
      sec.style.setProperty('--bloom', clamp01((p - 0.4) / 0.22).toFixed(4));
      want = Math.round(p * (count - 1));
      caps.forEach(c => c.el.classList.toggle('on', p >= c.from && p < c.to));
      draw();
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', size);
    size();
    onScroll();
  }
})();

/* =========================================================
   THE PROMISE — photo panels zoom to the hands, a ring flies
   from his hand onto her finger, all driven by scroll
   ========================================================= */
function setupPromise() {
  const sec = $('#promise');
  const P = W.promise || {};
  sec.hidden = false;
  sec.style.setProperty('--len', P.scrollLength || 4.5);
  const sticky = sec.querySelector('.promise-sticky');
  const ringEl = $('#flyRing');
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;

  const gh = P.groomHand || { x: 0.454, y: 0.527 };
  const br = P.brideRing || { x: 0.283, y: 0.583 };
  // camera keyframes per photo: cx/cy = view centre, h = fraction of photo height visible
  const shots = (hand, faceX) => [
    { p: 0.00, cx: faceX, cy: 0.34, h: 0.68 },   // waist-up portrait
    { p: 0.26, cx: faceX, cy: 0.34, h: 0.68 },
    { p: 0.42, cx: hand.x + 0.05, cy: hand.y, h: 0.30 }, // close on the hands
    { p: 0.72, cx: hand.x + 0.05, cy: hand.y, h: 0.30 },
    { p: 0.88, cx: faceX, cy: 0.22, h: 0.44 },   // back up to the faces
    { p: 1.00, cx: faceX, cy: 0.22, h: 0.44 }
  ];
  const panels = [
    { el: $('#ppBride'), src: W.bride.photo, keys: shots(br, W.bride.crop?.x ?? 0.45), side: -1 },
    { el: $('#ppGroom'), src: W.groom.photo, keys: shots(gh, W.groom.crop?.x ?? 0.46), side: 1 }
  ];
  panels.forEach(pn => { pn.img = pn.el.querySelector('img'); pn.img.src = pn.src; });

  const caps = (P.captions || []).map(c => {
    const p = document.createElement('p');
    p.textContent = c.text;
    $('#promiseCaptions').appendChild(p);
    return { ...c, el: p };
  });

  function view(keys, p) {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i], b = keys[i + 1];
    const t = smooth(a.p, b.p, p);
    return { cx: mix(a.cx, b.cx, t), cy: mix(a.cy, b.cy, t), h: mix(a.h, b.h, t) };
  }

  let landed = false, raf = 0;
  function render() {
    raf = 0;
    if (!sec.isConnected) { // replaced by the real ring film: stop listening
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      return;
    }
    const r = sec.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = total > 0 ? clamp01(-r.top / total) : 0;
    sec.style.setProperty('--pp', p.toFixed(4));
    const SW = sticky.clientWidth, SH = sticky.clientHeight;
    const portrait = SW / SH < 1;

    // panel size + position: slide in, then close the gap as the ring travels
    const ph = portrait ? Math.min(SH * 0.56, SW * 0.44 / 0.62) : SH * 0.68;
    const pw = portrait ? SW * 0.44 : Math.min(SW * 0.34, ph * 0.72);
    const gap = mix(portrait ? SW * 0.06 : SW * 0.1, portrait ? SW * 0.015 : SW * 0.012, smooth(0.36, 0.62, p));
    const enter = smooth(0, 0.14, p);
    const top = (SH - ph) / 2 - SH * 0.06;

    const pts = {};
    panels.forEach(pn => {
      const iw = pn.img.naturalWidth, ih = pn.img.naturalHeight;
      const x = SW / 2 + (pn.side < 0 ? -gap / 2 - pw : gap / 2) + pn.side * (1 - enter) * SW * 0.6;
      pn.el.style.width = pw + 'px';
      pn.el.style.height = ph + 'px';
      pn.el.style.transform = `translate(${x}px, ${top}px) rotate(${pn.side * (1 - enter) * 8}deg)`;
      pn.el.style.opacity = enter;
      if (!iw) return;
      const v = view(pn.keys, p);
      const s = ph / (v.h * ih);
      // keep the view inside the photo so no empty edges show
      const halfW = pw / 2 / (iw * s), halfH = ph / 2 / (ih * s);
      const cx = Math.min(1 - halfW, Math.max(halfW, v.cx));
      const cy = Math.min(1 - halfH, Math.max(halfH, v.cy));
      const ox = pw / 2 - cx * iw * s, oy = ph / 2 - cy * ih * s;
      pn.img.style.width = iw + 'px';
      pn.img.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
      const hand = pn.side < 0 ? br : gh;
      pts[pn.side] = { x: x + ox + hand.x * iw * s, y: top + oy + hand.y * ih * s, s, iw };
    });

    // the ring: appears in his hand, arcs over, lands on her finger, then melts into her ring
    const from = pts[1], to = pts[-1];
    if (from && to) {
      const appear = smooth(0.38, 0.44, p);
      const fly = smooth(0.46, 0.66, p);
      const fade = smooth(0.68, 0.76, p);
      const cx = mix(from.x, to.x, 0.5), cy = Math.min(from.y, to.y) - ph * 0.42;
      const u = 1 - fly;
      const x = u * u * from.x + 2 * u * fly * cx + fly * fly * to.x;
      const y = u * u * from.y + 2 * u * fly * cy + fly * fly * to.y;
      const endSize = 0.034 * to.iw * to.s;          // about her ring's size in the photo
      const size = mix(endSize * 1.4, endSize, fly) * (1 + Math.sin(Math.PI * fly) * 2.2);
      ringEl.style.width = ringEl.style.height = size + 'px';
      ringEl.style.transform = `translate(${x - size / 2}px, ${y - size * 0.62}px) perspective(${size * 6}px) rotateY(${fly * 720}deg) rotate(${(1 - fly) * 18 - Math.sin(Math.PI * fly) * 25}deg)`;
      ringEl.style.opacity = appear * (1 - fade);
      const glow = smooth(0.62, 0.67, p) * (1 - smooth(0.72, 0.84, p));
      const g = $('#ringGlow');
      g.style.transform = `translate(${to.x}px, ${to.y}px) scale(${0.4 + glow * (to.s * 0.9)})`;
      g.style.opacity = glow;
      if (fly >= 0.999 && !landed) {
        landed = true;
        const b = sticky.getBoundingClientRect();
        sparkleBurst(b.left + to.x, b.top + to.y, 26);
      }
      if (fly < 0.9) landed = false;
    }
    caps.forEach(c => c.el.classList.toggle('on', p >= c.from && p < c.to));
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(render); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  panels.forEach(pn => pn.img.addEventListener('load', schedule));
  schedule();
}

setupPromise();

// Developer shortcut: index.html?open skips the envelope
if (params.has('open')) {
  envelope.remove();
  document.body.classList.remove('locked');
  document.body.classList.add('revealed');
  stage.reveal();
}
drawTimeline();
