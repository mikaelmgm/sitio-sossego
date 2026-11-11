// Sítio Sossego — inicialização e laço principal
'use strict';
(() => {
  const st = S.st, cv = document.getElementById('gl');
  let ready = false, last = 0, acc = 0;
  st.fps = 60; st.uiScale = 1;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(320, Math.round(innerWidth * dpr)), h = Math.max(200, Math.round(innerHeight * dpr));
    if (ready && w === cv.width && h === cv.height) return;
    cv.width = w; cv.height = h;
    // pixels inteiros: 1080p -> 4x (480x270), 1440p -> 5x (512x288), 4K -> 8x
    st.scale = Math.max(1, Math.round(Math.min(h / 270, w / 440)));
    st.W = Math.ceil(w / st.scale); st.H = Math.ceil(h / st.scale);
    document.documentElement.style.setProperty('--u', (st.scale / dpr) + 'px');
    S.world.init(); S.sky.init(); S.scene.init(); S.animals.init();
    S.gfx.resize(); S.ui.layout(true);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const raw = Math.min(.1, (now - last) / 1000 || 0); last = now;
    acc += raw; const step = 1 / st.fps;
    if (acc < step - .002) return;                 // limite de quadros (configurável no Wallpaper Engine)
    const dt = Math.min(.05, acc); acc = 0;
    st.t += dt; st.dt = dt;
    S.weather.update(dt);
    S.ui.update(dt);
    S.media?.update(dt);
    const wd = S.world;
    S.sky.draw(wd.gs, dt);
    S.scene.draw(dt);
    S.input.drawTrail(wd.gg, dt);
    S.audio?.update(dt);
    S.gfx.render(S.ui);
    document.documentElement.classList.toggle('night', st.day < .5);
  }

  try {
    const hr = new Date().getHours();
    st.day = st.dayT = hr >= 6 && hr < 18 ? 1 : 0;
    S.buildSprites(); S.buildProps();
    S.gfx.init(cv); S.weather.init(); S.ui.init();
    resize(); ready = true;
    S.input.init(cv);
    S.media?.init(); S.audio?.init();
    addEventListener('resize', resize);
    requestAnimationFrame(frame);
  } catch (err) {
    console.error(err);
    document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;left:8px;bottom:8px;color:#fff;background:#a33;padding:8px;font:12px monospace;white-space:pre-wrap;max-width:90vw">${String(err && err.stack || err)}</pre>`);
  }
})();
