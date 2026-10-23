/* patch.js: load right after app.js and before enhance.js.
   Stopgap fixes that use app.js's globals. Fold them into app.js later, then delete this file. */
(() => {
  'use strict';

  /* 1. Stop a possible endless zoom loop. frame() calls map.jumpTo(), which fires "moveend";
        the moveend handler then resets lastZ to -1, so the next frame jumps again.
        This puts lastZ back after our own jump. (Not tested here: check it in DevTools.) */
  const jump = map.jumpTo.bind(map);
  map.jumpTo = (o, e) => {
    const z = lastZ, r = jump(o, e);
    if (o && 'zoom' in o && 'pitch' in o) lastZ = z;
    return r;
  };

  /* 2. Ctrl+L / Cmd+L (focus the address bar) must not start the sound scan. */
  addEventListener('keydown', (e) => {
    if (/^l$/i.test(e.key) && (e.ctrlKey || e.metaKey || e.altKey)) e.stopImmediatePropagation();
  }, true);

  /* 3. Escape closes the top-most open panel. */
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = [['#keys', '#kx'], ['#px', '#pxc'], ['#st', '#stx'], ['#legend', '#lg']].find(([p]) => !$(p).hidden);
    if (open) $(open[1]).click();
  });

  /* 4. Pause the Cesium render loop while the photoreal view is closed (saves battery and GPU). */
  $('#pxc').addEventListener('click', () => { if (pxv) pxv.useDefaultRenderLoop = false; });
  $('#p3').addEventListener('click', () => { if (pxv) pxv.useDefaultRenderLoop = true; });

  /* 5. Keep the map centre's longitude inside -180..180. The backend rejects anything outside that
        range, so place names and climate could fail after panning across the date line. */
  const centre = map.getCenter.bind(map);
  map.getCenter = () => centre().wrap();

  /* 6. Fast travel between places. The old easeTo kept street-level zoom while crossing the world,
        so the map tried to load huge numbers of tiles. flyTo zooms out along the way. When a
        monument is chosen and a Cesium token exists, the photoreal 3D view opens on arrival. */
  window.pick = (lat, lng, z) => {
    busy = true;
    const c = map.getCenter(), far = Math.hypot(lat - c.lat, lng - c.lng) > 2, t = far ? z : Math.max(map.getZoom(), z);
    map.flyTo({ center: [lng, lat], zoom: t, duration: far ? 3200 : 1800, essential: true });
    scrollToZ(t, 'instant');
    if (z >= 17 && key('ion')) map.once('moveend', () => { if ($('#px').hidden) openPx(); });
  };

  /* 7. The extruded OpenStreetMap boxes look cartoonish, so they start hidden. The menu button brings them back. */
  let boxesOn = false;
  const boxes = (on) => {
    try { map.setLayoutProperty('bld3d', 'visibility', on ? 'visible' : 'none'); } catch (e) {}
    $('#b3').setAttribute('aria-pressed', String(on)); $('#b3').classList.toggle('on', on);
  };
  let tries = 0;
  const wait3d = setInterval(() => {
    if ((map.getLayer && map.getLayer('bld3d')) || ++tries > 40) { clearInterval(wait3d); boxes(false); }
  }, 500);
  $('#b3').addEventListener('click', () => { boxesOn = !boxesOn; boxes(boxesOn); });

  /* 8. Local climate sheet on phones, and the About panel. */
  $('#cmob').addEventListener('click', () => {
    $('#cmob').setAttribute('aria-pressed', String($('#climate').classList.toggle('mobile-open')));
  });
  $('#ab').addEventListener('click', () => { $('#about').hidden = false; });
  $('#abx').addEventListener('click', () => { $('#about').hidden = true; });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#about').hidden) $('#abx').click();
    else if ($('#climate').classList.contains('mobile-open')) $('#cmob').click();
  });

  /* 9. Name the new data layers correctly in the "Hearing:" line. */
  const NAMES = { GHRSST: 'sea temperature', MODIS_Terra_NDSI: 'snow cover', VIIRS_SNPP_DayNight: 'night light' };
  const hear = $('#hear');
  new MutationObserver(() => {
    const id = lyr()[0], k = Object.keys(NAMES).find((n) => id.startsWith(n));
    if (k && /^(aerosol|land temperature)/.test(hear.textContent)) hear.textContent = hear.textContent.replace(/^(aerosol|land temperature)/, NAMES[k]);
  }).observe(hear, { childList: true, characterData: true, subtree: true });
})();
