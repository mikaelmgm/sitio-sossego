// Sítio Sossego — mouse/toque: botões, pegar bichos, cliques no cenário, círculo = ovelha, risco = vento
'use strict';
(() => {
  const st = S.st;
  const sfx = (n, o) => S.audio && S.audio.sfx(n, o);
  const FC = ['#ff8fb0', '#ffd84a', '#ffffff', '#b58cff', '#ff7a59', '#7ad0ff'];

  S.input = {
    mode: null, path: [], trail: [], ring: null,
    init(cv) {
      const pos = e => { const r = cv.getBoundingClientRect(), k = cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
      cv.addEventListener('pointerdown', e => { if (e.button) return; try { cv.setPointerCapture(e.pointerId); } catch (_) { } this.down(...pos(e)); });
      cv.addEventListener('pointermove', e => this.move(...pos(e)));
      const up = e => this.up(...pos(e));
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('contextmenu', e => e.preventDefault());
    },

    down(px, py) {
      S.audio && S.audio.unlock();
      const x = px / st.scale, y = py / st.scale, i = S.ui.hit(px, py);
      this.t0 = st.t; this.x0 = x; this.y0 = y; this.path = [[x, y, st.t]];
      if (i >= 0) { this.mode = 'ui'; S.ui.down(i, px); return; }
      const a = S.animals.pick(x, y);
      if (a) { this.mode = 'animal'; this.target = a; this.grabbed = false; return; }
      this.mode = 'draw';
    },
    move(px, py) {
      const x = px / st.scale, y = py / st.scale;
      if (this.mode === 'ui') return S.ui.move(px);
      if (this.mode === 'animal') {
        if (!this.grabbed && (S.dist(x, y, this.x0, this.y0) > 3 || st.t - this.t0 > .25)) { this.grabbed = true; S.animals.grab(this.target); }
        if (this.grabbed) S.animals.drag(x, y);
        return;
      }
      if (this.mode === 'draw') {
        const l = this.path[this.path.length - 1];
        if (S.dist(x, y, l[0], l[1]) >= 1.5) { this.path.push([x, y, st.t]); this.trail.push({ x, y, a: 1 }); if (this.trail.length > 400) this.trail.shift(); }
      }
    },
    up(px, py) {
      const x = px / st.scale, y = py / st.scale, mode = this.mode; this.mode = null;
      if (mode === 'ui') return S.ui.up();
      if (mode === 'animal') { if (this.grabbed) S.animals.release(); else S.animals.poke(this.target); return; }
      if (mode !== 'draw') return;
      const P = this.path, n = P.length;
      let len = 0; for (let i = 1; i < n; i++) len += S.dist(P[i][0], P[i][1], P[i - 1][0], P[i - 1][1]);
      if (len < 5) return this.tap(x, y);
      // círculo?
      let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
      let r = 0; for (const p of P) r += S.dist(p[0], p[1], cx, cy); r /= n;
      let dev = 0, ang = 0;
      for (let i = 0; i < n; i++) {
        dev += Math.abs(S.dist(P[i][0], P[i][1], cx, cy) - r);
        if (i) { let d = Math.atan2(P[i][1] - cy, P[i][0] - cx) - Math.atan2(P[i - 1][1] - cy, P[i - 1][0] - cx); if (d > Math.PI) d -= S.TAU; if (d < -Math.PI) d += S.TAU; ang += d; }
      }
      if (n >= 8 && r >= 5 && dev / n / r < .38 && Math.abs(ang) > 5) return this.makeSheep(cx, cy, r);
      // risco rápido e reto = rajada de vento
      const dx = x - this.x0, dy = y - this.y0, dur = st.t - this.t0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.8 && dur < .9) S.weather.gust(Math.sign(dx), S.clamp(Math.abs(dx) / 200, .4, 1.3));
    },

    makeSheep(cx, cy, r) {
      const roll = Math.random(), variant = roll < .08 ? 'black' : roll < .14 ? 'pink' : roll < .2 ? 'mint' : 'white';
      const gy = S.clamp(cy + 5, S.world.hz(cx) + 4, st.H - 4);
      S.animals.spawn('sheep', cx, gy, { variant, z: Math.max(4, gy - cy), vz: 30, state: 'fall' });
      this.ring = { x: cx, y: cy, r, a: 1 };
      S.fx.burst('puff', cx, cy, 8, { col: '#fff6e8', speed: 16, life: .6, s: 1.2 });
      S.fx.burst('spark', cx, cy, 12, { col: '#fff6c8', speed: 34, life: .6, grav: .2 });
      for (const t of this.trail) t.a = Math.min(t.a, .5);
      sfx('pop'); setTimeout(() => sfx('baa', { pitch: 1.15 }), 180);
    },

    tap(x, y) {
      const wd = S.world, L = wd.L, sc = S.scene, P = S.PROP.cabinAnchor, cx = L.cabin.x - P.x, cy = L.cabin.y - P.y;
      const egg = S.animals.eggAt(x, y); if (egg) return S.animals.hatch(egg);
      const who = S.critters.pick(x, y); if (who) return S.critters.poke(who);
      const seat = sc.swingSeat();
      if (S.dist(x, y, seat.x, seat.y - 6) < 13) { sc.swing.v += (x <= seat.x ? 1 : -1) * 2.6; return sfx('creak'); }
      if (S.sky.sun && S.dist(x, y, S.sky.sun.x, S.sky.sun.y) < 13 && st.day > .5) return S.ui.toggleDay();
      if (S.sky.moon && S.dist(x, y, S.sky.moon.x, S.sky.moon.y) < 12 && st.day < .5) return S.ui.toggleDay();
      const cl = S.sky.cloudAt(x, y); if (cl && y < wd.hz(x)) { cl.rain = 7; return sfx('drip'); }
      if (S.dist(x, y, L.mill.x, L.mill.y - 18) < 16) { sc.millV += 10 * st.gustDir; return sfx('whoosh', { power: .4 }); }
      for (const [wx, wy] of P.win) if (x >= cx + wx && x <= cx + wx + 14 && y >= cy + wy && y <= cy + wy + 12) { sc.lamp = !sc.lightsOn(); return sfx('click'); }
      if (S.dist(x, y, cx + P.chim[0], cy + P.chim[1] + 6) < 8) { for (let i = 0; i < 5; i++) S.fx.add('smoke', cx + P.chim[0] + S.rand(-2, 2), cy + P.chim[1], { vy: -14 - i * 2, life: S.rand(2, 3), col: '#e8e6f0', s: 1.6 }); return sfx('puff'); }
      if (Math.abs(x - (cx + P.door[0])) < 6 && y > cy + 48 && y < cy + 69) { sfx('knock'); S.fx.add('bang', S.critters.cat.x, S.critters.cat.y - 16, { vy: -6, life: .8, col: '#ffe066' }); return; }
      if (S.dist(x, y, L.tree.x, L.tree.y - 72) < 36) {
        sc.shake = 1; sfx('rustle');
        for (let i = 0; i < 10; i++) S.fx.add('leaf', x + S.rand(-20, 20), y + S.rand(-14, 14), { vx: S.rand(-12, 12), life: S.rand(2.5, 4.5), col: S.pick(['#84c955', '#62b24c', '#a2d962', '#e8b04a']), gy: L.tree.y + S.rand(-2, 26) });
        if (Math.random() < .35) S.fx.add('spark', x, y, { vx: S.rand(-5, 5), vy: 0, life: 1.1, col: '#e2504c', s: 2 });
        return;
      }
      if (wd.inPond(x, y)) { S.fx.ripple(x, y, 1.4); S.critters.scatter(x, y); return sfx('plip'); }
      if (y < wd.hz(x)) { S.fx.burst('spark', x, y, 6, { col: st.day < .5 ? '#fff6c8' : '#ffffff', speed: 18, life: .5, grav: .15 }); if (st.day < .5) S.fx.add('star', x - 1, y - 1, { life: .8, col: '#fff6c8' }); return sfx('pluck', { n: 3 + (x / st.W * 9 | 0), up: true }); }
      const f = sc.flowers.find(f => S.dist(x, y, f.x, f.y - 2) < 4);
      if (f) { f.pop = 1; S.fx.burst('spark', f.x, f.y - 4, 5, { col: f.c, speed: 16, life: .5, grav: .3 }); return sfx('pluck', { n: 6 + (f.x % 6), up: true }); }
      if (!wd.blocked(x, y)) {                       // clicar na grama planta uma flor
        sc.flowers.push({ x: x | 0, y: y | 0, c: S.pick(FC), pop: 1, h: 3 + (Math.random() * 2 | 0) }); if (sc.flowers.length > 260) sc.flowers.shift();
        S.fx.burst('puff', x, y, 3, { col: '#d6f08c', speed: 8, life: .35, s: .8 }); sfx('pop', { pitch: 1.4 });
      }
    },

    // rastro brilhante do gesto (camada de brilho)
    drawTrail(gg, dt) {
      this.trail = this.trail.filter(t => {
        t.a -= dt * (this.mode === 'draw' ? .5 : 2.2); if (t.a <= 0) return false;
        gg.globalAlpha = Math.min(1, t.a * 1.4); gg.fillStyle = t.a > .7 ? '#ffffff' : '#ffe9a8';
        gg.fillRect(t.x | 0, t.y | 0, 1, 1); if (t.a > .8) gg.fillRect((t.x | 0) + 1, t.y | 0, 1, 1);
        return true;
      });
      gg.globalAlpha = 1;
      const r = this.ring;
      if (r) {
        r.a -= dt * 2; r.r += dt * 26; gg.fillStyle = '#fff6c8';
        for (let a = 0; a < S.TAU; a += .09) { const x = Math.round(r.x + Math.cos(a) * r.r), y = Math.round(r.y + Math.sin(a) * r.r); if (S.bayer(x, y) < r.a) gg.fillRect(x, y, 1, 1); }
        if (r.a <= 0) this.ring = null;
      }
    },
  };
})();
