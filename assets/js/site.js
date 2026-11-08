// defec8edc0.de — site behaviour. First-party, no dependencies, no inline handlers (CSP: script-src 'self').
const doc = document;
const root = doc.documentElement;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, el = doc) => el.querySelector(sel);
const $$ = (sel, el = doc) => Array.from(el.querySelectorAll(sel));
const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
};
const theme = window.dfTheme;

/* ---------- theme toggle: auto → day → night → auto ---------- */
function setMode(mode, origin) {
  if (!theme) return;
  const run = () => theme.set(mode);
  const before = root.getAttribute('data-theme');
  const after = theme.resolve(mode);
  if (origin && before !== after && doc.startViewTransition && !reduceMotion()) {
    const r = origin.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    root.style.setProperty('--vt-x', x + 'px');
    root.style.setProperty('--vt-y', y + 'px');
    root.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
    doc.startViewTransition(run);
  } else run();
  syncToggle();
}
function syncToggle() {
  const btn = $('[data-theme-toggle]');
  if (!btn || !theme) return;
  const m = theme.read();
  const label = btn.dataset['label' + m.charAt(0).toUpperCase() + m.slice(1)] || '';
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
}
const toggle = $('[data-theme-toggle]');
if (toggle) {
  syncToggle();
  toggle.addEventListener('click', () => {
    const next = { auto: 'day', day: 'night', night: 'auto' }[theme ? theme.read() : 'auto'];
    setMode(next, toggle);
  });
}

/* ---------- dialogs (menu sheet, command palette) ---------- */
function openDialog(dlg) { if (dlg && !dlg.open) dlg.showModal(); }
$$('dialog').forEach((dlg) => {
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // backdrop
  $$('[data-dialog-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
});
const menuBtn = $('[data-menu-open]');
if (menuBtn) menuBtn.addEventListener('click', () => openDialog($('#menu-sheet')));

/* ---------- language hint (one-time, dismissible, no redirect) ---------- */
const hint = $('[data-lang-hint]');
if (hint) {
  const want = hint.dataset.hintLang;
  const prefers = (navigator.languages || [navigator.language || '']).some((l) => (l || '').toLowerCase().startsWith(want));
  if (prefers && !store.get('lang-hint-dismissed')) hint.hidden = false;
  const close = $('[data-lang-hint-dismiss]', hint);
  if (close) close.addEventListener('click', () => { hint.hidden = true; store.set('lang-hint-dismissed', '1'); });
}

/* ---------- unlock vault: short "decrypt" transition, then navigate ---------- */
function unlock(href) {
  if (reduceMotion()) { location.href = href; return; }
  const o = doc.createElement('div');
  o.className = 'unlock-overlay';
  o.setAttribute('role', 'status');
  const pre = doc.createElement('pre');
  const msg = doc.createElement('strong');
  msg.textContent = (doc.documentElement.lang || 'en').startsWith('de') ? 'entschlüssele …' : 'decrypting…';
  o.append(pre, msg);
  doc.body.append(o);
  const hex = '0123456789abcdef';
  let n = 0;
  const tick = () => {
    let s = '';
    for (let r = 0; r < 6; r++) { for (let c = 0; c < 32; c++) s += hex[(Math.random() * 16) | 0]; s += '\n'; }
    pre.textContent = s;
    if (++n < 14) requestAnimationFrame(tick); else location.href = href;
  };
  tick();
  // bfcache: remove the overlay when coming back
  window.addEventListener('pageshow', () => o.remove(), { once: true });
}
$$('[data-unlock]').forEach((a) => a.addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault(); unlock(a.getAttribute('href'));
}));

/* ---------- command palette (⌘K, Ctrl+K, /) ---------- */
const cmdk = $('#cmdk');
let index = null;
if (cmdk) {
  const input = $('.cmdk-input', cmdk);
  const list = $('.cmdk-list', cmdk);
  const commands = $$('.cmdk-item[data-cmd]', list).map((li) => ({ el: li, label: li.dataset.label.toLowerCase() }));
  let active = 0;

  const loadIndex = () => {
    if (index || !cmdk.dataset.index) return Promise.resolve(index);
    return fetch(cmdk.dataset.index, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => { index = (j && j.items) || []; return index; })
      .catch(() => { index = []; return index; });
  };
  const items = () => $$('.cmdk-item', list).filter((li) => !li.hidden);
  const select = (i) => {
    const all = items();
    if (!all.length) return;
    active = (i + all.length) % all.length;
    all.forEach((li, j) => li.setAttribute('aria-selected', j === active ? 'true' : 'false'));
    all[active].id = 'cmdk-active';
    input.setAttribute('aria-activedescendant', 'cmdk-active');
    all[active].scrollIntoView({ block: 'nearest' });
  };
  const render = () => {
    const q = input.value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const match = (hay) => words.every((w) => hay.includes(w));
    $$('.cmdk-dyn', list).forEach((n) => n.remove());
    commands.forEach((c) => { c.el.hidden = q !== '' && !match(c.label); c.el.removeAttribute('id'); });
    const pages = (index || []).filter((it) => q && match((it.t + ' ' + it.d + ' ' + it.k + ' ' + it.s).toLowerCase())).slice(0, 12);
    if (pages.length) {
      const g = doc.createElement('li');
      g.className = 'cmdk-group cmdk-dyn'; g.setAttribute('role', 'presentation');
      g.textContent = cmdk.dataset.groupPages;
      list.append(g);
      pages.forEach((it) => {
        const li = doc.createElement('li');
        li.className = 'cmdk-item cmdk-dyn'; li.setAttribute('role', 'option'); li.dataset.href = it.u;
        if (it.x) li.dataset.external = '1';
        const t = doc.createElement('span'); t.textContent = it.t + (it.x ? ' ↗' : '');
        const s = doc.createElement('small'); s.textContent = it.s + (it.d ? ' · ' + it.d : '');
        li.append(t, s); list.append(li);
      });
    }
    if (!items().length) {
      const li = doc.createElement('li');
      li.className = 'cmdk-group cmdk-dyn'; li.setAttribute('role', 'presentation');
      li.textContent = cmdk.dataset.empty; list.append(li);
    }
    select(0);
  };
  const run = (li) => {
    if (!li) return;
    const cmd = li.dataset.cmd;
    if (cmd) {
      cmdk.close();
      if (cmd === 'unlock') unlock(cmdk.dataset.vault);
      else if (cmd === 'lang') location.href = cmdk.dataset.langUrl;
      else if (cmd.startsWith('theme-')) setMode(cmd.slice(6), toggle);
      return;
    }
    if (li.dataset.href) {
      if (li.dataset.external) window.open(li.dataset.href, '_blank', 'noopener,noreferrer');
      else location.href = li.dataset.href;
    }
  };
  const open = () => {
    openDialog(cmdk);
    input.value = '';
    render();
    input.focus();
    loadIndex().then(render);
  };
  $$('[data-cmdk-open]').forEach((b) => b.addEventListener('click', open));
  doc.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); cmdk.open ? cmdk.close() : open(); }
    else if (e.key === '/' && !typing && !cmdk.open) { e.preventDefault(); open(); }
  });
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(items()[active]); }
  });
  list.addEventListener('click', (e) => { const li = e.target.closest('.cmdk-item'); if (li) run(li); });
  list.addEventListener('mousemove', (e) => { const li = e.target.closest('.cmdk-item'); const i = items().indexOf(li); if (i >= 0 && i !== active) select(i); });
}

/* ---------- decode effect: text resolves from hex noise (accessible: real text stays in a visually-hidden span) ---------- */
const GLYPHS = '0123456789ABCDEF<>/\\{}[]#$%&*+=';
function decode(el) {
  if (el.dataset.decoded) return;
  el.dataset.decoded = '1';
  const final = el.textContent;
  if (reduceMotion() || !final.trim()) return;
  const sr = doc.createElement('span'); sr.className = 'visually-hidden'; sr.textContent = final;
  const vis = doc.createElement('span'); vis.className = 'decode-vis'; vis.setAttribute('aria-hidden', 'true');
  el.textContent = ''; el.append(sr, vis);
  const chars = Array.from(final);
  const start = performance.now();
  const dur = Math.min(1100, 350 + chars.length * 22);
  const frame = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const solved = Math.floor(p * chars.length);
    let out = '';
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      out += (i < solved || ch === ' ' || ch === '\n') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    vis.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else { el.textContent = final; }
  };
  requestAnimationFrame(frame);
}

/* ---------- reveal on scroll ---------- */
const revealEls = $$('[data-reveal]');
const decodeEls = $$('[data-decode]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      io.unobserve(el);
      if (el.hasAttribute('data-decode')) decode(el);
      if (el.hasAttribute('data-reveal')) {
        el.classList.add('is-in');
        // terminal table rows decode row by row
        $$('tr[data-row]', el).forEach((tr, i) => setTimeout(() => tr.classList.add('is-in'), reduceMotion() ? 0 : 60 * i));
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  revealEls.concat(decodeEls).forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => { el.classList.add('is-in'); $$('tr[data-row]', el).forEach((tr) => tr.classList.add('is-in')); });
}

/* ---------- transmissions: rotate quietly (pause on hover/focus/hidden; static under reduced motion) ---------- */
const tx = $('[data-tx]');
if (tx) {
  const slots = $$('.tx-item', tx);
  const num = $('[data-tx-n]', tx);
  let i = 0, paused = false;
  const show = (n) => {
    slots[i].hidden = true; slots[i].classList.remove('is-entering');
    i = (n + slots.length) % slots.length;
    slots[i].hidden = false; slots[i].classList.add('is-entering');
    if (num) num.textContent = String(i + 1).padStart(2, '0');
  };
  if (slots.length > 1) {
    if (reduceMotion()) show(Math.floor(Math.random() * slots.length));
    else {
      ['mouseenter', 'focusin'].forEach((ev) => tx.addEventListener(ev, () => { paused = true; }));
      ['mouseleave', 'focusout'].forEach((ev) => tx.addEventListener(ev, () => { paused = false; }));
      setInterval(() => { if (!paused && doc.visibilityState === 'visible') show(i + 1); }, 12000);
    }
  }
}

/* ---------- email: assembled on click, never present in the HTML ---------- */
$$('[data-email-reveal]').forEach((btn) => btn.addEventListener('click', () => {
  let addr;
  try { addr = atob(btn.dataset.u) + '@' + atob(btn.dataset.d); } catch (e) { return; }
  const a = doc.createElement('a');
  a.href = 'mailto:' + addr; a.textContent = addr; a.className = 'email-address';
  btn.replaceWith(a); a.focus();
}));

/* ---------- print (resume): open all <details> while printing ---------- */
$$('[data-print]').forEach((b) => { b.hidden = false; b.addEventListener('click', () => window.print()); });
let closedForPrint = [];
window.addEventListener('beforeprint', () => { closedForPrint = $$('details:not([open])'); closedForPrint.forEach((d) => { d.open = true; }); });
window.addEventListener('afterprint', () => { closedForPrint.forEach((d) => { d.open = false; }); closedForPrint = []; });

/* ---------- copy buttons on code blocks ---------- */
if (navigator.clipboard) {
  $$('.prose .highlight, .prose > pre').forEach((block) => {
    const pre = block.matches('pre') ? block : $('pre', block);
    if (!pre) return;
    const host = block.matches('pre') ? pre : block;
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'copy-btn'; b.textContent = 'copy';
    b.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.innerText).then(() => { b.textContent = 'copied'; setTimeout(() => { b.textContent = 'copy'; }, 1400); });
    });
    host.style.position = 'relative';
    host.append(b);
  });
}

/* ---------- console banner ---------- */
try {
  const w = $$('.tx-whisper').map((p) => p.textContent.trim());
  // eslint-disable-next-line no-console
  console.log('%c0xDEFEC8EDC0DE%c\n' + (w[(Math.random() * w.length) | 0] || '> hello') + '\n> ⌘K for commands. Found something? /.well-known/security.txt',
    'font:700 16px monospace;color:#fec503;background:#0a141e;padding:4px 8px', 'font:12px monospace;color:#63A4B5');
} catch (e) { /* ignore */ }
