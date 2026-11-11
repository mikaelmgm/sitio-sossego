// Sítio Sossego — cena viva: tudo que se mexe no cenário, ordenado por profundidade
'use strict';
(() => {
  const st = S.st;
  // balanço da vegetação em x (pixels), puxado pelo vento e pelas rajadas
  S.sway = (x, amt = 1) => {
    const w = st.wind + st.gust * 1.6;
    return (Math.sin(st.t * (1.4 + w * 2.2) + x * .06) * (.35 + w) + st.gust * st.gustDir * 2.2) * amt;
  };

  S.scene = {
    init() {
      const W = st.W, H = st.H, r = S.rng(41), wd = S.world, L = wd.L;
      const spot = () => { for (let i = 0; i < 30; i++) { const x = 4 + r() * (W - 8), y = wd.hz(x) + 4 + r() * (H - wd.hz(x) - 8); if (!wd.blocked(x, y)) return [x | 0, y | 0]; } return [10, H - 10]; };
      this.tufts = Array.from({ length: 190 }, () => { const [x, y] = spot(); return { x, y, h: 2 + (r() * 3 | 0), c: r() < .5 ? '#3f8a44' : '#58a84c' }; });
      const FC = ['#ff8fb0', '#ffd84a', '#ffffff', '#b58cff', '#ff7a59', '#7ad0ff'];
      this.flowers = Array.from({ length: 80 }, () => { const [x, y] = spot(); return { x, y, c: FC[r() * FC.length | 0], pop: 0, h: 3 + (r() * 2 | 0) }; });
      this.reeds = Array.from({ length: 14 }, (_, i) => { const a = (i < 8 ? 2.6 : -.5) + r() * 1.1; return { x: L.pond.x + Math.cos(a) * (L.pond.rx + 1), y: L.pond.y + Math.sin(a) * (L.pond.ry + 1), h: 6 + (r() * 6 | 0) }; });
      this.lilies = Array.from({ length: 6 }, () => ({ x: L.pond.x + (r() - .5) * L.pond.rx * 1.3, y: L.pond.y + (r() - .5) * L.pond.ry * 1.1, f: r() < .5, p: r() * 9 }));
      this.swing = { a: .12, v: 0 }; this.millA = 0; this.millV = 0; this.smoke = 0; this.lamp = null; this.shake = 0;
      this.clothes = [['#ff8fb0', 6, 8], ['#fff6e8', 8, 6], ['#7ad0ff', 5, 9], ['#ffd84a', 7, 7], ['#fff6e8', 4, 5]];
      this.fenceB = S.PROP.fence(L.pen.x1 - L.pen.x0); this.fenceF = S.PROP.fence(L.pen.x1 - L.pen.x0 + 8);
    },
    lightsOn() { return this.lamp ?? (st.day < .45 || st.rain > .5); },
    swingSeat() {
      const L = S.world.L.tree, A = S.PROP.trunkAnchor, ox = L.x - A.x, oy = L.y - A.y, len = 27, s = this.swing;
      const mx = ox + (A.rope[0][0] + A.rope[1][0]) / 2, my = oy + (A.rope[0][1] + A.rope[1][1]) / 2;
      return { x: mx + Math.sin(s.a) * len, y: my + Math.cos(s.a) * len, ox, oy };
    },

    draw(dt) {
      const wd = S.world, g = wd.g, gg = wd.gg, W = st.W, H = st.H, L = wd.L, P = S.PROP, t = st.t, night = 1 - st.day;
      g.clearRect(0, 0, W, H); gg.clearRect(0, 0, W, H);
      const lights = S.lights = [];
      g.drawImage(wd.back, 0, 0);

      // moinho ao longe: gira com o vento
      this.millV += ((.5 + st.wind * 3 + st.gust * 10) * st.gustDir - this.millV) * dt * 1.5; this.millA += this.millV * dt;
      g.drawImage(P.mill, L.mill.x - 9, L.mill.y - 27);
      for (let i = 0; i < 4; i++) {
        const a = this.millA + i * Math.PI / 2, cx = L.mill.x, cy = L.mill.y - 20, c = Math.cos(a), s = Math.sin(a);
        g.fillStyle = '#2a2440'; this.seg(g, cx, cy, cx + c * 13, cy + s * 13);
        g.fillStyle = '#fff6e8'; this.seg(g, cx + c * 4 - s * 2, cy + s * 4 + c * 2, cx + c * 12 - s * 2, cy + s * 12 + c * 2);
        this.seg(g, cx + c * 4 - s, cy + s * 4 + c, cx + c * 12 - s, cy + s * 12 + c);
      }
      g.fillStyle = '#cc5a4e'; g.fillRect(L.mill.x - 1, L.mill.y - 21, 2, 2);

      g.drawImage(wd.ground, 0, 0);

      // lago: brilhos, peixes, vitórias-régias, ondas
      const q = L.pond;
      for (let i = 0; i < 16; i++) {
        const x = q.x + Math.sin(i * 12.9 + t * .25) * q.rx * .8, y = q.y + Math.cos(i * 7.1) * q.ry * .75, len = 2 + (i % 4);
        if (Math.sin(t * 1.7 + i * 2.1) > .1 && wd.inPond(x, y, -2) && wd.inPond(x + len, y, -2)) { g.fillStyle = i & 1 ? '#a8dcf4' : '#e6f8ff'; g.fillRect(x | 0, y | 0, len, 1); }
      }
      S.animals.drawFish(g, dt);
      for (const l of this.lilies) {
        const x = l.x + Math.sin(t * .5 + l.p) | 0, y = l.y | 0;
        g.fillStyle = '#2f7f4a'; g.fillRect(x - 3, y, 6, 2); g.fillStyle = '#58b860'; g.fillRect(x - 2, y - 1, 5, 2); g.fillStyle = '#3f8fc4'; g.fillRect(x, y - 1, 1, 1);
        if (l.f) { g.fillStyle = '#ff8fb0'; g.fillRect(x - 1, y - 2, 2, 2); g.fillStyle = '#ffe07a'; g.fillRect(x - 1, y - 2, 1, 1); }
      }
      S.fx.drawRipples(g, dt);

      // ---- lista de coisas ordenadas pelo y do "pé" ----
      const D = [];
      const put = (y, f) => D.push({ y, f });
      const cx = L.cabin.x - P.cabinAnchor.x, cy = L.cabin.y - P.cabinAnchor.y;
      put(L.cabin.y, () => g.drawImage(P.cabin, cx, cy));
      put(L.coop.y, () => g.drawImage(P.coop, L.coop.x - 15, L.coop.y - 28));
      put(L.pen.y0, () => g.drawImage(this.fenceB, L.pen.x0, L.pen.y0 - 8));
      put(L.pen.y1, () => g.drawImage(this.fenceF, L.pen.x0 - 4, L.pen.y1 - 8));
      put(L.scare.y, () => g.drawImage(P.scare, L.scare.x - 10 + Math.round(S.sway(L.scare.x, .3)), L.scare.y - 23));
      put(L.cow.y - 16, () => g.drawImage(P.hay, L.cow.x + 26, L.cow.y - 27));
      // varal
      put(L.line.y, () => {
        const { x0, x1, y } = L.line; g.drawImage(P.post, x0 - 2, y - 21); g.drawImage(P.post, x1 - 2, y - 21);
        let u = .1;
        for (let x = x0; x <= x1; x++) { const k = (x - x0) / (x1 - x0); g.fillStyle = '#f6ecd0'; g.fillRect(x, Math.round(y - 19 + Math.sin(k * Math.PI) * 3), 1, 1); }
        for (const [c, w, h] of this.clothes) {
          const x = S.lerp(x0, x1, u), yy = Math.round(y - 18 + Math.sin(u * Math.PI) * 3); u += .18;
          for (let j = 0; j < h; j++) { g.fillStyle = j === h - 1 ? '#2a2440' : c; g.fillRect(Math.round(x + S.sway(x, j / h * 1.4)), yy + j, w, 1); }
        }
      });
      // árvore + balanço
      const sw = this.swing;
      sw.v += (-9 * Math.sin(sw.a) - .45 * sw.v + st.gust * st.gustDir * 5 + Math.sin(t * .7) * st.wind * .5) * dt; sw.a += sw.v * dt;
      put(L.tree.y, () => {
        const seat = this.swingSeat(), A = P.trunkAnchor;
        g.drawImage(P.trunk, seat.ox, seat.oy);
        g.fillStyle = '#e8d8b0';
        this.seg(g, seat.ox + A.rope[0][0], seat.oy + A.rope[0][1], seat.x - 4, seat.y);
        this.seg(g, seat.ox + A.rope[1][0], seat.oy + A.rope[1][1], seat.x + 4, seat.y);
        g.fillStyle = '#2a2440'; g.fillRect(Math.round(seat.x) - 6, Math.round(seat.y), 12, 3);
        g.fillStyle = '#c9905a'; g.fillRect(Math.round(seat.x) - 5, Math.round(seat.y), 10, 2);
      });
      for (const r of this.reeds) put(r.y, () => {
        for (let j = 0; j < r.h; j++) { g.fillStyle = j > r.h - 3 ? '#7a5440' : '#3f8a44'; g.fillRect(Math.round(r.x + S.sway(r.x, j / r.h * 1.5)), r.y - j | 0, 1, 1); }
      });
      for (const f of this.tufts) put(f.y, () => {
        g.fillStyle = f.c;
        for (let j = 0; j < f.h; j++) { const o = Math.round(S.sway(f.x, j / f.h)); g.fillRect(f.x + o, f.y - j, 1, 1); g.fillRect(f.x + 2 - o * (j ? 0 : 1) + (j > 1 ? 1 : 0), f.y - j, 1, 1); }
      });
      for (const f of this.flowers) put(f.y, () => {
        f.pop = Math.max(0, f.pop - dt * 3);
        const o = Math.round(S.sway(f.x, .8)), y = f.y - f.h - Math.round(f.pop * 3);
        g.fillStyle = '#3f8a44'; g.fillRect(f.x, f.y - f.h + 1, 1, f.h); g.fillRect(f.x + o, y + 1, 1, 1);
        g.fillStyle = f.c; g.fillRect(f.x + o - 1, y, 3, 1); g.fillRect(f.x + o, y - 1, 1, 3);
        g.fillStyle = '#ffe07a'; g.fillRect(f.x + o, y, 1, 1);
      });
      S.animals.collect(put, g, gg, dt);
      D.sort((a, b) => a.y - b.y);
      for (const d of D) d.f();

      // copa da árvore por cima (treme quando clicada)
      this.shake = Math.max(0, this.shake - dt * 2.5);
      g.drawImage(P.crown, L.tree.x - 46 + Math.round(S.sway(L.tree.x, .7) + Math.sin(t * 40) * this.shake * 2), L.tree.y - 85);
      S.critters.drawOwl && S.critters.drawOwl();

      // fumaça da chaminé
      const on = this.lightsOn(), chx = cx + P.cabinAnchor.chim[0], chy = cy + P.cabinAnchor.chim[1];
      this.smoke -= dt;
      if (this.smoke < 0) { this.smoke = on ? .22 : .7; S.fx.add('smoke', chx + S.rand(-1, 1), chy, { vy: -9, life: S.rand(2.4, 3.6), col: '#e8e6f0', s: 1.3 }); }

      // luz quente nas janelas, lareira piscando e lanterna
      const flick = .8 + .2 * Math.sin(t * 11) * Math.sin(t * 7.3), glow = on ? Math.max(night, st.rain * .6, this.lamp ? .7 : 0) : 0;
      if (glow > .02) P.cabinAnchor.win.forEach(([wx, wy], i) => {
        const x = cx + wx + 1, y = cy + wy + 1;
        gg.globalAlpha = glow * (i ? flick : .9); gg.fillStyle = i ? '#ffb347' : '#ffd98a'; gg.fillRect(x, y, 12, 10);
        if (i) for (let k = 0; k < 5; k++) { const h = 2 + (Math.sin(t * 9 + k * 2.3) * 2 + 2 | 0); gg.fillStyle = k & 1 ? '#fff0a0' : '#ff6a3c'; gg.fillRect(x + 2 + k * 2, y + 10 - h, 2, h); }
        gg.globalAlpha = glow; gg.fillStyle = '#7a4a3a'; gg.fillRect(x + 5, y, 2, 10); gg.fillRect(x, y + 4, 12, 1);
        gg.globalAlpha = 1;
        lights.push([x + 6, y + 9, i ? 46 : 34, glow * (i ? flick : .8), 1, .66, .30]);
      });
      const lx = cx + P.cabinAnchor.lamp[0], ly = cy + P.cabinAnchor.lamp[1];
      if (night > .3) { gg.fillStyle = '#fff0a0'; gg.fillRect(lx - 1, ly - 2, 3, 4); lights.push([lx, ly + 3, 30, night * .9, 1, .8, .45]); }

      S.fx.draw(g, gg, dt);
      S.weather.draw(g, gg, dt);
    },

    seg(g, x0, y0, x1, y1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
      for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), 1, 1);
    },
  };
})();
