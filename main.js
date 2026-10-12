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
  setTimeout(() => {
    envelope.classList.add('gone');
    document.body.classList.remove('locked');
    document.body.classList.add('revealed');
  }, reduceMotion ? 300 : 2300);
  setTimeout(() => envelope.remove(), reduceMotion ? 1400 : 3400);
}
$('#openBtn').addEventListener('click', openInvitation);

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
   Events
   ========================================================= */
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

// Verse interludes: drop any left empty in config, and never show two in a row
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
   RING FILM — video frames scrubbed by scroll
   ========================================================= */
(() => {
  const sec = $('#ringFilm');
  const DIR = 'assets/ring-frames/';
  fetch(DIR + 'manifest.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(init)
    .catch(() => sec.remove()); // no frames: leave the section out

  function init(m) {
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
    let target = 0, pos = 0, gliding = false; // the film glides toward the scroll position instead of jumping
    let floral = null;
    { const f = new Image(); f.onload = () => { floral = f; shown = -1; draw(); }; f.src = 'assets/lace-tile.svg'; } // gold lace inside the arch band
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
      // night gives way to day, dawning out from the centre over most of the scroll
      sec.style.setProperty('--bloom', clamp01((p - 0.3) / 0.55).toFixed(4));
      target = p * (count - 1);
      caps.forEach(c => c.el.classList.toggle('on', p >= c.from && p < c.to));
      if (!gliding) { gliding = true; requestAnimationFrame(glide); }
    }
    let lastT = 0;
    function glide(t) {
      const dt = lastT ? Math.min((t - lastT) / 1000, 0.05) : 0.016; lastT = t;
      pos += (target - pos) * (1 - Math.pow(0.0005, dt));   // eases in ~0.3s, so quick flicks still play every frame
      if (Math.abs(target - pos) < 0.3) pos = target;
      want = Math.round(pos);
      draw();
      if (pos !== target) requestAnimationFrame(glide); else { gliding = false; lastT = 0; }
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', size);
    size();
    onScroll();
    pos = target; want = Math.round(pos); draw(); // start on the right frame without gliding in
  }
})();

// Developer shortcut: index.html?open skips the envelope
if (params.has('open')) {
  envelope.remove();
  document.body.classList.remove('locked');
  document.body.classList.add('revealed');
}
