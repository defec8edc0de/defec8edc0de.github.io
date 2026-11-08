/* Runs blocking in <head>: sets data-theme before first paint (no flash). External file — the CSP forbids inline scripts.
   Mode: localStorage['theme-mode'] = auto | day | night (default auto). Auto = Daylight between data-day-start and data-day-end (local time).
   Re-evaluated only when the tab becomes visible again, never while someone is reading. */
(function () {
  var d = document.documentElement, KEY = 'theme-mode';
  d.classList.add('js');
  function read() {
    try { var m = window.localStorage.getItem(KEY); if (m === 'auto' || m === 'day' || m === 'night') return m; } catch (e) {}
    return 'auto';
  }
  function resolve(m, date) {
    if (m === 'day') return 'daylight';
    if (m === 'night') return 'noir';
    var h = (date || new Date()).getHours();
    var s = parseInt(d.getAttribute('data-day-start'), 10); if (isNaN(s)) s = 7;
    var e = parseInt(d.getAttribute('data-day-end'), 10); if (isNaN(e)) e = 19;
    return (h >= s && h < e) ? 'daylight' : 'noir';
  }
  function apply(m) {
    m = m || read();
    var t = resolve(m);
    d.setAttribute('data-theme-mode', m);
    if (d.getAttribute('data-theme') !== t) {
      d.setAttribute('data-theme', t);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', t === 'daylight' ? '#ffffff' : '#0a141e');
    }
    return t;
  }
  function set(m) {
    try { window.localStorage.setItem(KEY, m); } catch (e) {}
    return apply(m);
  }
  apply();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') apply(); });
  window.dfTheme = { read: read, resolve: resolve, apply: apply, set: set };
})();
