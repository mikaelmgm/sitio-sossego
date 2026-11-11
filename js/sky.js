// Sítio Sossego — céu: gradiente em faixas, sol, lua, estrelas, nuvens, arco-íris, pássaros
'use strict';
(() => {
  const st = S.st;
  const TOP = [[0, '#12122e'], [.35, '#2a2458'], [.55, '#6a5aa8'], [.75, '#5aa0e0'], [1, '#4aaaf0']];
  const MID = [[0, '#1e1c48'], [.35, '#5a3a78'], [.55, '#e88a9a'], [.75, '#9ad0f0'], [1, '#8ad0f8']];
  const BOT = [[0, '#3a3470'], [.35, '#b85a7a'], [.55, '#ffc88a'], [.75, '#ffe8c0'], [1, '#d4f2fa']];
  const CLOUD_PAL = [   // [claro, base, sombra] para noite, aurora, dia, tempestade
    ['#4a4a80', '#3a3a6c', '#2c2c58'], ['#ffe0d0', '#ffb8b0', '#d890a8'],
    ['#ffffff', '#f2f8ff', '#cfe2f2'], ['#aab2c4', '#8e98ae', '#727c96'],
  ];
  const SHAPES = [
    [[0, 0, 12, 5], [-9, 1, 7, 4], [10, 1, 8, 4], [3, -3, 7, 4]],
    [[0, 0, 16, 5], [-12, 1, 8, 4], [12, 1, 9, 4], [-4, -4, 8, 5], [7, -3, 7, 4]],
    [[0, 0, 8, 4], [-6, 1, 5, 3], [6, 1, 5, 3]],
    [[0, 0, 20, 6], [-14, 2, 9, 4], [15, 2, 10, 4], [-6, -5, 9, 5], [6, -6, 10, 6], [16, -2, 6, 4]],
  ];

  S.sky = {
    init() {
      const W = st.W, r = S.rng(5);
      this.h = st.horizon + 14;
      this.grad = document.createElement('canvas'); this.grad.width = W; this.grad.height = this.h;
      this.key = -1;
      this.stars = Array.from({ length: 110 }, () => ({ x: r() * W | 0, y: r() * (this.h - 24) | 0, p: r() * 9, big: r() < .12 }));
      // nuvens pré-desenhadas em 4 paletas
      this.spr = SHAPES.map(sh => CLOUD_PAL.map(pal => S.stamp(60, 26, p => {
        for (const [x, y, rx, ry] of sh) p.ellipse(30 + x, 15 + y, rx, ry, pal[1]);
        for (const [x, y, rx, ry] of sh) p.ellipse(30 + x - 1, 15 + y - 1.5, rx * .7, ry * .55, pal[0]);
        p.rect(0, 20, 60, 6, '#00000000');
        for (let x = 0; x < 60; x++) if (p.get(x, 19)) p.px(x, 19, pal[2]);
      }, null, 0, 0)));
      this.clouds = Array.from({ length: 7 }, (_, i) => ({
        x: r() * W, y: 10 + r() * (this.h * .5), s: i % 4, v: .6 + r() * .8, rain: 0, bob: r() * 9,
      }));
      this.birds = []; this.shoot = null; this.nextBird = 4; this.nextShoot = 12;
    },

    bakeGrad(d, storm) {
      const W = st.W, h = this.h, g = this.grad.getContext('2d'), im = g.createImageData(W, h);
      const gray = S.hex('#8f98ac'), N = 11, cols = [];
      const a = S.ramp(TOP, d), b = S.ramp(MID, d), c = S.ramp(BOT, d);
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        let col = t < .55 ? S.mix(a, b, t / .55) : S.mix(b, c, (t - .55) / .45);
        cols.push(S.mix(col, S.mix(gray, col, .35), storm * (.25 + .6 * d)));
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
        const f = y / h * (N - 1) + (S.bayer(x, y) - .5) * .95;
        const col = cols[S.clamp(Math.round(f), 0, N - 1)], o = (y * W + x) * 4;
        im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    },

    draw(g, dt) {
      const W = st.W, d = st.day, t = st.t, storm = st.rain;
      const key = Math.round(d * 60) * 100 + Math.round(storm * 20);
      if (key !== this.key) { this.bakeGrad(d, storm); this.key = key; }
      g.drawImage(this.grad, 0, 0);

      // estrelas
      const na = S.clamp(1 - d * 2.2) * (1 - storm * .8);
      if (na > .02) for (const s of this.stars) {
        const tw = .55 + .45 * Math.sin(t * (1.2 + s.p * .2) + s.p * 7);
        g.globalAlpha = na * tw; g.fillStyle = s.big ? '#fff6c8' : '#e6e6ff';
        g.fillRect(s.x, s.y, 1, 1);
        if (s.big && tw > .8) { g.globalAlpha = na * .5; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); }
      }
      g.globalAlpha = 1;
      // estrela cadente
      this.nextShoot -= dt;
      if (this.nextShoot < 0 && d < .2) { this.nextShoot = S.rand(9, 26); this.shoot = { x: S.rand(W * .2, W * .9), y: S.rand(4, 40), a: 1 }; }
      if (this.shoot) {
        const s = this.shoot; s.x -= 150 * dt; s.y += 55 * dt; s.a -= dt * 1.4;
        for (let i = 0; i < 9; i++) { g.globalAlpha = Math.max(0, s.a) * (1 - i / 9); g.fillStyle = '#ffffff'; g.fillRect(s.x + i * 2 | 0, s.y - i * .75 | 0, 2, 1); }
        g.globalAlpha = 1; if (s.a <= 0) this.shoot = null;
      }

      // lua (desce quando amanhece) e sol (sobe por trás das colinas)
      const mx = W * .53 + d * 30, my = 26 + S.smooth(.15, .7, d) * (this.h + 10);
      const sx = W * .40 - (1 - d) * 26, sy = S.lerp(this.h + 16, 24, S.smooth(.3, 1, d));
      this.moon = { x: mx, y: my }; this.sun = { x: sx, y: sy };
      if (my < this.h + 12) {
        g.fillStyle = 'rgba(200,210,255,.10)'; this.disc(g, mx, my, 15); this.disc(g, mx, my, 11);
        g.fillStyle = '#fbf6dc'; this.disc(g, mx, my, 8);
        g.fillStyle = '#e4dcc0'; g.fillRect(mx - 3 | 0, my - 2 | 0, 2, 2); g.fillRect(mx + 2 | 0, my + 2 | 0, 2, 1); g.fillRect(mx | 0, my - 5 | 0, 1, 1);
        g.fillStyle = S.rgb(S.ramp(MID, d)); g.globalAlpha = .93; this.disc(g, mx + 4, my - 3, 7); g.globalAlpha = 1;
      }
      if (sy < this.h + 14) {
        const warm = S.mixHex('#ff9a5a', '#fff2a8', S.smooth(.4, .9, d));
        g.fillStyle = 'rgba(255,240,170,.16)'; this.disc(g, sx, sy, 17 + Math.sin(t * 1.3)); this.disc(g, sx, sy, 13);
        g.fillStyle = warm; this.disc(g, sx, sy, 9);
        g.fillStyle = '#fffbe0'; this.disc(g, sx - 2, sy - 2, 5);
        for (let i = 0; i < 8; i++) {            // raios girando devagar
          const a = i / 8 * S.TAU + t * .15, r0 = 12, r1 = 15 + (i & 1) * 2;
          g.fillStyle = warm;
          g.fillRect(Math.round(sx + Math.cos(a) * r0), Math.round(sy + Math.sin(a) * r0), 1, 1);
          g.fillRect(Math.round(sx + Math.cos(a) * r1), Math.round(sy + Math.sin(a) * r1), 1, 1);
        }
      }

      // arco-íris depois da chuva
      const rb = st.wet * S.smooth(.6, 1, d) * (1 - storm);
      if (rb > .03) {
        const cx = W * .66, cy = this.h + 30, R = W * .30, cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
        for (let a = Math.PI; a < S.TAU; a += .0035) for (let k = 0; k < 6; k++) {
          const x = Math.round(cx + Math.cos(a) * (R - k * 2)), y = Math.round(cy + Math.sin(a) * (R - k * 2));
          if (S.bayer(x, y) < rb * .75) { g.fillStyle = cols[k]; g.fillRect(x, y, 1, 2); }
        }
      }

      // nuvens
      const speed = (st.wind * 5 + st.gust * 60) * st.gustDir;
      const pal = d < .3 ? 0 : d < .62 ? 1 : 2;
      for (const c of this.clouds) {
        c.x += speed * c.v * dt; c.rain = Math.max(0, c.rain - dt);
        if (c.x > W + 40) c.x = -40; if (c.x < -40) c.x = W + 40;
        const y = c.y + Math.sin(t * .4 + c.bob) * 1.5, wetc = Math.max(storm, c.rain > 0 ? 1 : 0);
        g.drawImage(this.spr[c.s][pal], Math.round(c.x - 30), Math.round(y - 15));
        if (wetc > .05) { g.globalAlpha = wetc * .9; g.drawImage(this.spr[c.s][3], Math.round(c.x - 30), Math.round(y - 15)); g.globalAlpha = 1; }
        c.sy = y;
      }

      // pássaros de dia
      this.nextBird -= dt;
      if (this.nextBird < 0 && d > .6 && storm < .3) {
        this.nextBird = S.rand(6, 18); const dir = Math.random() < .5 ? 1 : -1, n = 1 + (Math.random() * 4 | 0), y0 = S.rand(12, this.h * .55);
        for (let i = 0; i < n; i++) this.birds.push({ x: dir > 0 ? -10 - i * 9 : W + 10 + i * 9, y: y0 + i * 4 * (i & 1 ? 1 : -1), dir, p: Math.random() * 6 });
      }
      g.fillStyle = '#3a3555';
      this.birds = this.birds.filter(b => {
        b.x += b.dir * 34 * dt; const up = Math.sin(t * 9 + b.p) > 0, x = b.x | 0, y = b.y + Math.sin(t * 2 + b.p) * 2 | 0;
        g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + (up ? -1 : 0), 1, 1); g.fillRect(x + 1, y + (up ? -1 : 0), 1, 1);
        g.fillRect(x - 2, y + (up ? -2 : 1), 1, 1); g.fillRect(x + 2, y + (up ? -2 : 1), 1, 1);
        return b.x > -30 && b.x < W + 30;
      });
    },

    disc(g, cx, cy, r) {
      for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); g.fillRect(Math.round(cx) - w, Math.round(cy) + j, w * 2, 1); }
    },
    cloudAt(x, y) { return this.clouds.find(c => Math.abs(x - c.x) < 20 && Math.abs(y - c.sy) < 8); },
  };
})();
