/* patch.js: load right after app.js and before enhance.js.
   Stopgap fixes that use app.js's globals. Fold them into app.js later, then delete this file. */
(() => {
  'use strict';

  /* 1. Ctrl+L / Cmd+L (focus the address bar) must not start the sound scan. */
  addEventListener('keydown', (e) => {
    if (/^l$/i.test(e.key) && (e.ctrlKey || e.metaKey || e.altKey)) e.stopImmediatePropagation();
  }, true);

  /* 2. Escape closes the top-most open panel. */
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = [['#no-street-modal', '#no-st-close'], ['#keys', '#kx'], ['#px', '#pxc'], ['#st', '#stx'], ['#legend', '#lg']].find(([p]) => !$(p).hidden);
    if (open) $(open[1]).click();
  });

  /* 3. Pause the Cesium render loop while the photoreal view is closed (saves battery and GPU). */
  $('#pxc').addEventListener('click', () => { if (pxv) pxv.useDefaultRenderLoop = false; });
  $('#p3').addEventListener('click', () => { if (pxv) pxv.useDefaultRenderLoop = true; });

  /* 4. Keep the map centre's longitude inside -180..180. The backend rejects anything outside that
        range, so place names and climate could fail after panning across the date line. */
  const centre = map.getCenter.bind(map);
  map.getCenter = () => centre().wrap();

  /* 5. Fast travel between places. Smoothly flyTo destination without projection or pitch deformation. */
  window.pick = (lat, lng, z) => {
    busy = true;
    const c = map.getCenter(), far = Math.hypot(lat - c.lat, lng - c.lng) > 2, t = far ? z : Math.max(map.getZoom(), z);
    scrollToZ(t, 'instant');
    zs = t;
    lastZ = t;
    const targetPitch = clamp((t - 13) / 4.5, 0, 1) * 35;
    map.flyTo({ center: [lng, lat], zoom: t, pitch: targetPitch, duration: far ? 2400 : 1400, essential: true });
    map.once('moveend', () => {
      busy = false;
      zs = map.getZoom();
      lastZ = zs;
      scrollToZ(zs, 'instant');
      scheduleLookup();
      if (window.schedulePhotoSpots) schedulePhotoSpots();
    });
  };

  /* 7. Extruded 3D building boxes start hidden so real satellite photographic textures are visible */
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
