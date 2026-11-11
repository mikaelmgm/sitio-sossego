// Sítio Sossego — botões de vidro: interruptor dia/noite, volume, chuva e som ambiente
'use strict';
(() => {
  const st = S.st;
  const sfx = (n, o) => S.audio && S.audio.sfx(n, o);
  // id, tipo (0 interruptor, 1 deslizante, 2 botão), largura do trilho em px de arte, região no atlas
  const DEF = [
    { id: 'amb', kind: 2, w: 12, ax: 64, ay: 0 },
    { id: 'rain', kind: 2, w: 12, ax: 48, ay: 0 },
    { id: 'day', kind: 0, w: 44, ax: 0, ay: 0 },
    { id: 'vol', kind: 1, w: 64, ax: 0, ay: 16 },
  ];

  S.ui = {
    cb: new Float32Array(16), ck: new Float32Array(16), ca: new Float32Array(16), cp: new Float32Array(16),
    init() {
      this.atlas = document.createElement('canvas'); this.atlas.width = 96; this.atlas.height = 32;
      this.ag = this.atlas.getContext('2d');
      this.c = DEF.map(d => Object.assign({ v: d.id === 'day' ? st.day : d.id === 'vol' ? st.vol : 0, pos: new S.Spring(0, 190, 15), wob: new S.Spring(0, 260, 9), press: new S.Spring(0, 420, 22), drag: false }, d));
      this.active = -1; this.layout(true);
    },
    get(id) { return this.c.find(c => c.id === id); },

    layout(snap) {
      const u = this.us = Math.max(2, Math.round(st.scale * .8 * (st.uiScale || 1))), cw = st.W * st.scale;
      let x = cw - 7 * u; const cy = 15 * u;
      for (let i = this.c.length - 1; i >= 0; i--) {
        const c = this.c[i], hw = (c.w / 2 + 2) * u;
        c.cx = x - hw; c.cy = cy; c.hw = hw; c.hh = 8 * u; x -= hw * 2 + 3.5 * u;
        c.x0 = c.cx - hw + 8 * u; c.x1 = c.cx + hw - 8 * u;          // curso do botão
        c.pos.t = c.kind === 2 ? c.cx : S.lerp(c.x0, c.x1, c.v);
        if (snap) { c.pos.x = c.pos.t; c.pos.v = 0; }
      }
    },
    hit(px, py) {
      for (let i = 0; i < this.c.length; i++) { const c = this.c[i]; if (Math.abs(px - c.cx) < c.hw + this.us && Math.abs(py - c.cy) < c.hh + 2 * this.us) return i; }
      return -1;
    },
    down(i, px) {
      const c = this.c[i]; this.active = i; c.drag = true; c.moved = 0; c.px0 = px; c.press.t = 1;
      c.onKnob = Math.abs(px - c.pos.x) < 7 * this.us; c.grabOff = c.onKnob ? px - c.pos.x : 0;
      sfx('tink'); if (c.kind < 2 && !c.onKnob) this.setFromPx(c, px);
    },
    move(px) {
      const c = this.c[this.active]; if (!c || c.kind === 2) return;
      c.moved = Math.max(c.moved, Math.abs(px - c.px0)); this.setFromPx(c, px - c.grabOff);
      sfx('rub', { speed: Math.abs(c.pos.v) / (this.us * 60) });
    },
    up() {
      const c = this.c[this.active]; if (!c) return; this.active = -1; c.drag = false; c.press.t = 0; sfx('plop');
      if (c.kind === 0) this.setVal(c, c.moved < 3 * this.us && c.onKnob ? (c.v > .5 ? 0 : 1) : (c.v > .5 ? 1 : 0)); // toque alterna; arrasto encaixa
      else if (c.kind === 2) this.click(c);
    },
    setFromPx(c, px) { this.setVal(c, S.clamp((px - c.x0) / (c.x1 - c.x0))); },
    setVal(c, v) {
      c.v = v; c.pos.t = S.lerp(c.x0, c.x1, v);
      if (c.id === 'vol') { const stp = Math.round(v * 12); if (stp !== c.step) { sfx('pluck', { n: stp, up: stp > (c.step || 0) }); c.step = stp; } st.vol = v; S.media && S.media.setVolume(v); }
    },
    click(c) {
      if (c.id === 'rain') { const on = S.weather.toggleRain(); S.toast(on ? 'Chuva chegando…' : 'Tempo abrindo'); }
      if (c.id === 'amb') { st.amb = !st.amb; S.audio && S.audio.setAmb(st.amb); S.toast(st.amb ? 'Som do sítio ligado' : 'Som do sítio desligado'); }
    },
    toggleDay() { const c = this.get('day'); this.setVal(c, c.v > .5 ? 0 : 1); sfx('tink'); },
    syncVol(v) { const c = this.get('vol'); if (!c.drag) { c.v = v; c.step = Math.round(v * 12); c.pos.t = S.lerp(c.x0, c.x1, v); } },

    update(dt) {
      const u = this.us;
      this.c.forEach((c, i) => {
        const h = Math.min(dt, 1 / 60); let acc = 0;
        for (let k = 0, n = Math.ceil(dt / h); k < n; k++) { c.pos.step(h); c.press.step(h); c.wob.v -= c.pos.a * h * .00022 / u * 5; c.wob.step(h); acc = c.pos.a; }
        const sp = Math.abs(c.pos.v) / (u * 300), sx = 1 + Math.min(.42, sp * .5) + c.press.x * (c.kind === 2 ? .1 : .05), sy = 1 / sx * (1 - c.press.x * (c.kind === 2 ? .06 : 0));
        if (c.id === 'day') { const n = S.clamp((c.pos.x - c.x0) / (c.x1 - c.x0)); st.day = n; st.dayT = c.v; }
        this.cb.set([c.cx, c.cy, c.hw, c.hh], i * 4);
        this.ck.set(c.kind === 2 ? [c.cx, c.cy, 6.4 * u, 6.4 * u] : [c.pos.x, c.cy, 5.4 * u, 8.7 * u], i * 4);
        this.ca.set([c.ax, c.ay, c.w, 12], i * 4);
        this.cp.set([S.clamp(c.wob.x, -.35, .35), sx, sy, c.kind], i * 4);
      });
      this.drawAtlas();
    },

    drawAtlas() {
      const g = this.ag, t = st.t, d = st.day, R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      // --- interruptor: noite à esquerda, dia à direita, amanhecer pontilhado no meio ---
      const kx = d * 44;
      for (let y = 0; y < 12; y++) for (let x = 0; x < 44; x++) {
        const day = x + (S.bayer(x, y) - .5) * 7 < kx, near = Math.abs(x - kx) < 5;
        R(x, y, 1, 1, day ? (y < 4 ? '#58b4f0' : y < 8 ? '#8ad0f8' : '#c4ecf8') : near && kx > 2 ? (y < 6 ? '#8a5aa8' : '#ff9a8a') : (y < 5 ? '#16163a' : '#2a2860'));
      }
      for (const [x, y, p] of [[4, 2, 0], [11, 5, 2], [16, 1, 4], [22, 4, 1], [27, 2, 3], [33, 6, 5], [39, 2, 2], [19, 7, 6]]) if (x > kx + 2 && Math.sin(t * 2 + p) > -.4) R(x, y, 1, 1, '#fff6c8');
      for (let x = 0; x < 44; x++) { const h = 2 + Math.round(Math.sin(x * .3) * 1.2 + Math.sin(x * .11 + 1) * 1.2), day = x < kx; R(x, 12 - h, 1, h, day ? '#62b24c' : '#2c3f6a'); R(x, 12 - h, 1, 1, day ? '#a2d962' : '#3f568a'); }
      if (kx < 30) { R(34, 2, 5, 5, '#fbf6dc'); R(35, 1, 3, 7, '#fbf6dc'); R(36, 2, 3, 3, '#16163a'); R(37, 1, 2, 5, '#16163a'); }   // lua
      if (kx > 12) { R(5, 2, 5, 5, '#ffe066'); R(6, 1, 3, 7, '#ffe066'); R(4, 3, 7, 3, '#ffe066'); R(6, 3, 2, 2, '#fff6c8'); }      // sol
      // --- volume: alto-falante + 12 barras em escada ---
      const night = d < .5, lit = Math.round(st.vol * 12);
      R(0, 16, 64, 12, night ? '#221f38' : '#3a3152');
      R(3, 20, 2, 4, '#f6ecd8'); R(5, 19, 1, 6, '#f6ecd8'); R(6, 18, 1, 8, '#f6ecd8');
      if (st.muted || lit === 0) { R(8, 20, 1, 1, '#ff6b6b'); R(9, 21, 1, 1, '#ff6b6b'); R(10, 22, 1, 1, '#ff6b6b'); R(10, 20, 1, 1, '#ff6b6b'); R(8, 22, 1, 1, '#ff6b6b'); }
      else { R(8, 21, 1, 2, '#f6ecd8'); if (lit > 5) R(10, 19, 1, 6, '#f6ecd8'); }
      for (let i = 0; i < 12; i++) {
        const on = i < lit && !st.muted, bounce = on && st.music ? Math.round(st.spec[i * 2 + 2] * 3) : 0;
        const h = Math.min(10, 2 + Math.round(i * .72) + bounce), x = 14 + i * 4;
        const col = S.rgb(S.ramp([[0, '#7be0a0'], [.5, '#ffe066'], [1, '#ff7a59']], i / 11));
        R(x, 27 - h, 3, h, on ? col : (night ? '#35325a' : '#544a72')); if (on) R(x, 27 - h, 3, 1, '#ffffff');
      }
      // --- chuva ---
      const rain = st.rainT > .5;
      R(48, 0, 12, 12, rain ? '#6a7896' : '#7cc8f4');
      if (!rain) { R(54, 1, 5, 5, '#ffe066'); R(55, 0, 3, 7, '#ffe066'); }
      const cc = rain ? '#c2cada' : '#ffffff';
      R(50, 5, 8, 3, cc); R(51, 4, 3, 1, cc); R(54, 3, 3, 2, cc); R(49, 6, 10, 2, cc); R(50, 8, 8, 1, rain ? '#8e98ae' : '#cfe2f2');
      if (rain) for (let i = 0; i < 3; i++) R(51 + i * 3, 9 + ((t * 6 + i * 1.3 | 0) % 3), 1, 2, '#cfe6ff');
      // --- som ambiente ---
      R(64, 0, 12, 12, st.amb ? '#ffd9a0' : '#8f8ca6');
      const nc = st.amb ? '#c0483c' : '#5f5c72', bob = st.amb ? Math.round(Math.sin(t * 4)) : 0;
      R(68, 2 + bob, 5, 1, nc); R(68, 3 + bob, 1, 5, nc); R(72, 3 + bob, 1, 4, nc); R(66, 7 + bob, 3, 2, nc); R(70, 6 + bob, 3, 2, nc);
      if (!st.amb) for (let i = 0; i < 8; i++) R(66 + i, 2 + i, 1, 1, '#ff6b6b');
    },
  };
})();
