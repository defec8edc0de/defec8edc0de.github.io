// Hero glyph field: slow-drifting hex/ASCII glyphs, pointer parallax, an occasional amber "signal" pulse.
// Cheap by design: 2D canvas, DPR capped, ~30 fps, pauses when off-screen or hidden. Reduced motion = one static frame.
const canvas = document.querySelector('[data-hero-canvas]');
if (canvas && canvas.getContext) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const GL = '0123456789abcdef0123456789ABCDEF<>/{}[]=+*#:;.'.split('');
  const FRAME_MS = 1000 / 30;
  let W = 0, H = 0, dpr = 1, cell = 18, cols = 0, rows = 0;
  let grid = []; // { ch, a (base alpha), seed }
  let colors = { glyph: 'rgba(99,164,181,.55)', hot: '#fec503', day: false };
  let px = 0, py = 0, tx = 0, ty = 0; // parallax (current, target)
  let pulse = null; // { x, y, r, t0 }
  let running = false, visible = true, last = 0, raf = 0, t0 = performance.now();

  const readColors = () => {
    const cs = getComputedStyle(root);
    colors = {
      glyph: cs.getPropertyValue('--glyph').trim() || colors.glyph,
      hot: cs.getPropertyValue('--glyph-hot').trim() || colors.hot,
      day: root.getAttribute('data-theme') === 'daylight',
    };
  };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = Math.max(1, Math.floor(r.width)); H = Math.max(1, Math.floor(r.height));
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = W < 640 ? 16 : 19;
    cols = Math.ceil(W / cell) + 2; rows = Math.ceil(H / cell) + 2;
    grid = new Array(cols * rows);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = { ch: GL[(Math.random() * GL.length) | 0], a: Math.random(), seed: Math.random() * 1000 };
    }
    draw(performance.now(), true);
  };

  const draw = (now) => {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    ctx.font = `${Math.round(cell * 0.72)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    const drift = (t * 6) % cell; // slow vertical drift
    const density = colors.day ? 0.28 : 0.55;
    const pr = pulse ? (now - pulse.t0) / 1000 * 420 : -1;
    if (pulse && pr > Math.hypot(W, H)) pulse = null;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const g = grid[y * cols + x];
        if (g.a > density) continue;
        // rare mutation
        if (Math.random() < 0.0025) g.ch = GL[(Math.random() * GL.length) | 0];
        const cx = x * cell - cell + px * (0.4 + g.a);
        const cy = y * cell - cell + drift + py * (0.4 + g.a);
        // fade toward the left/text side so the copy stays readable
        const fadeX = Math.min(1, Math.max(0.12, (cx / W) * 1.35));
        let alpha = (0.14 + 0.5 * Math.sin(g.seed + t * 0.6) ** 2) * fadeX * (colors.day ? 0.55 : 0.75);
        let hot = false;
        if (pulse) {
          const d = Math.abs(Math.hypot(cx - pulse.x, cy - pulse.y) - pr);
          if (d < 26) { hot = true; alpha = Math.min(1, alpha + (1 - d / 26) * 0.85); }
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = hot ? colors.hot : colors.glyph;
        ctx.fillText(g.ch, cx, cy);
      }
    }
    ctx.globalAlpha = 1;
  };

  const loop = (now) => {
    raf = 0;
    if (!running) return;
    if (now - last >= FRAME_MS) {
      last = now;
      if (!pulse && Math.random() < 0.004) pulse = { x: W * (0.45 + Math.random() * 0.5), y: H * Math.random(), t0: now };
      draw(now);
    }
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || reduce.matches || !visible || document.visibilityState !== 'visible') return;
    running = true; raf = requestAnimationFrame(loop);
  };
  const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; };

  readColors();
  resize();
  if (!reduce.matches) start();

  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });
  window.addEventListener('pointermove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * -14;
    ty = (e.clientY / window.innerHeight - 0.5) * -10;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? start() : stop()));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
  }
  reduce.addEventListener && reduce.addEventListener('change', () => (reduce.matches ? (stop(), draw(performance.now())) : start()));
  new MutationObserver(() => { readColors(); draw(performance.now()); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  // a pulse on first load, from the right side
  if (!reduce.matches) setTimeout(() => { pulse = { x: W * 0.8, y: H * 0.4, t0: performance.now() }; }, 900);
}
