/* enhance.js: load AFTER app.js.
   Only reads the DOM and adds layout, menu and screen-reader behaviour.
   It never calls into app.js, so it cannot change how the app itself works. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  /* 1. Publish the real header height as --top-h so the chips row, the
        More menu, the Close-3D button and the 3D view stay below it
        when the header wraps. */
  const header = $('top');
  if (header) {
    const setHeight = () =>
      document.documentElement.style.setProperty('--top-h', header.offsetHeight + 'px');
    setHeight();
    if ('ResizeObserver' in window) new ResizeObserver(setHeight).observe(header);
    else addEventListener('resize', setHeight);
  }

  /* 2. "More" menu: close after a choice, on outside click and on Escape. */
  const more = $('more');
  if (more) {
    more.addEventListener('click', (e) => {
      if (e.target.closest('#more-list button')) more.open = false;
    });
    document.addEventListener('click', (e) => {
      if (more.open && !more.contains(e.target)) more.open = false;
    });
    more.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && more.open) {
        more.open = false;
        const trigger = more.querySelector('summary');
        if (trigger) trigger.focus();
        e.stopPropagation();
      }
    });
  }

  /* 3. Screen-reader announcements. A separate polite live region is used
        because the "Hearing:" line changes continuously while the scan runs. */
  const live = $('live');
  const say = (msg) => {
    if (!live || !msg) return;
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 60);
  };

  const place = $('place');
  if (place && live) {
    let timer;
    let last = place.textContent.trim();
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const now = place.textContent.trim();
        if (now && now !== last) { last = now; say('Now viewing ' + now); }
      }, 1500);
    }).observe(place, { childList: true, characterData: true, subtree: true });
  }

  /* 4. The app marks an active toggle with the .on class, which screen readers
        cannot see. Mirror it to aria-pressed (only once the class really changes). */
  const watchToggle = (id, announce) => {
    const btn = $(id);
    if (!btn) return;
    let state = btn.classList.contains('on') || btn.getAttribute('aria-pressed') === 'true';
    new MutationObserver((records) => {
      const fromClass = records.some((r) => r.attributeName === 'class');
      const now = fromClass ? btn.classList.contains('on') : btn.getAttribute('aria-pressed') === 'true';
      if (fromClass) btn.setAttribute('aria-pressed', String(now));
      if (now === state) return;
      state = now;
      if (announce) say(announce(now));
    }).observe(btn, { attributes: true, attributeFilter: ['class', 'aria-pressed'] });
  };
  watchToggle('listen', (on) => (on ? 'Listening started' : 'Listening stopped'));
  watchToggle('lb', (on) => (on ? 'Labels on' : 'Labels off'));
  watchToggle('tl', (on) => (on ? 'Time-lapse started' : 'Time-lapse stopped'));
})();
