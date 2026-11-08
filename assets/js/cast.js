// Lazy asciinema player: loads the vendored player only when a cast scrolls near the viewport, then waits for a click.
const figures = Array.from(document.querySelectorAll('[data-cast]'));
let loading = null;
const loadPlayer = (fig) => {
  if (window.AsciinemaPlayer) return Promise.resolve(window.AsciinemaPlayer);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = fig.dataset.playerCss;
    document.head.append(css);
    const s = document.createElement('script');
    s.src = fig.dataset.playerJs; s.async = true;
    s.onload = () => resolve(window.AsciinemaPlayer);
    s.onerror = reject;
    document.head.append(s);
  });
  return loading;
};
const mount = (fig) => {
  const stage = fig.querySelector('[data-cast-stage]');
  const btn = fig.querySelector('[data-cast-play]');
  loadPlayer(fig).then((AP) => {
    if (!AP || fig.dataset.mounted) return;
    fig.dataset.mounted = '1';
    const host = document.createElement('div');
    stage.classList.add('is-mounted');
    if (btn) btn.remove();
    stage.append(host);
    AP.create(fig.dataset.src, host, {
      cols: +fig.dataset.cols, rows: +fig.dataset.rows,
      idleTimeLimit: +fig.dataset.idle, speed: +fig.dataset.speed,
      poster: fig.dataset.poster, theme: 'df', fit: 'width', terminalFontFamily: '"JetBrains Mono", ui-monospace, monospace',
      controls: true, autoPlay: false, preload: true,
    });
  }).catch(() => { /* leave the noscript/transcript fallback */ });
};
if (figures.length) {
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } }), { rootMargin: '300px 0px' });
    figures.forEach((f) => io.observe(f));
  } else figures.forEach(mount);
}
