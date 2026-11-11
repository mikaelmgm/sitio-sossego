// Sítio Sossego — vento, rajadas, chuva (automática, por botão ou clicando numa nuvem)
'use strict';
(() => {
  const st = S.st;
  const sfx = (n, o) => S.audio && S.audio.sfx(n, o);
  const LEAF = ['#84c955', '#62b24c', '#a2d962', '#e8b04a'];

  S.weather = {
    init() { this.drops = []; this.streaks = []; this.nextRain = S.rand(240, 520); this.rainLeft = 0; this.nextGust = S.rand(15, 40); this.leafT = 3; this.auto = true; },

    gust(dir, power = 1) {
      st.gust = Math.min(1.6, st.gust + power); st.gustDir = dir;
      const L = S.world.L.tree;
      for (let i = 0; i < 6 + power * 8; i++) S.fx.add('leaf', L.x + S.rand(-36, 36), L.y - S.rand(50, 96), { vx: dir * S.rand(20, 60), vy: S.rand(-8, 6), life: S.rand(2.5, 5), col: S.pick(LEAF), gy: L.y + S.rand(-4, 40) });
      sfx('whoosh', { power });
    },
    setRain(on) { this.rainLeft = on ? S.rand(50, 90) : 0; st.rainT = on ? 1 : 0; this.nextRain = S.rand(300, 700); },
    toggleRain() { this.setRain(st.rainT < .5); return st.rainT > .5; },

    update(dt) {
      const t = st.t;
      st.gust *= Math.exp(-dt * .8); if (st.gust < .01) st.gust = 0;
      st.wind = .22 + S.noise1(t * .05) * .16 + st.rain * .25;
      this.nextGust -= dt;
      if (this.nextGust < 0) { this.nextGust = S.rand(25, 70); this.gust(Math.random() < .7 ? st.gustDir : -st.gustDir, S.rand(.3, .7)); }
      if (this.auto) { this.nextRain -= dt; if (this.nextRain < 0) this.setRain(true); }
      if (this.rainLeft > 0) { this.rainLeft -= dt; if (this.rainLeft <= 0) st.rainT = 0; }
      st.rain += (st.rainT - st.rain) * dt * .5;
      st.wet = st.rain > .4 ? Math.min(1, st.wet + dt * .2) : Math.max(0, st.wet - dt / 50);
      this.leafT -= dt;
      if (this.leafT < 0) { this.leafT = S.rand(2, 7); const L = S.world.L.tree; S.fx.add('leaf', L.x + S.rand(-34, 34), L.y - S.rand(50, 80), { life: 6, col: S.pick(LEAF), gy: L.y + S.rand(0, 30) }); }
    },

    draw(g, gg, dt) {
      const W = st.W, H = st.H, wd = S.world, slant = (st.wind * 40 + st.gust * 90) * st.gustDir;
      // chuva geral
      const want = Math.round(st.rain * 240);
      while (this.drops.length < want) this.drops.push({ x: S.rand(-40, W + 40), y: S.rand(-H, 0), v: S.rand(230, 330), gy: 0 });
      if (this.drops.length > want) this.drops.length = want;
      g.fillStyle = '#cfe6ff';
      for (const d of this.drops) {
        if (!d.gy) d.gy = S.rand(st.horizon - 6, H + 6);
        d.y += d.v * dt; d.x += slant * dt;
        if (d.y > d.gy) {
          if (wd.inPond(d.x, d.gy) && Math.random() < .5) S.fx.ripple(d.x, d.gy, .5);
          else if (d.gy > st.horizon + 6) { g.fillRect(d.x - 1 | 0, d.gy | 0, 3, 1); }
          d.x = S.rand(-40, W + 40); d.y = S.rand(-30, 0); d.gy = 0; continue;
        }
        g.globalAlpha = .75; g.fillRect(d.x | 0, d.y | 0, 1, 3); g.fillRect(d.x + Math.sign(slant) | 0, d.y + 3 | 0, 1, 2);
      }
      g.globalAlpha = 1;
      // chuva particular de uma nuvem clicada: rega o que está embaixo
      for (const c of S.sky.clouds) if (c.rain > 0) {
        for (let i = 0; i < 3; i++) if (Math.random() < dt * 40) {
          const x = c.x + S.rand(-18, 18), gy = S.rand(Math.max(wd.hz(x) + 2, c.sy + 20), H);
          S.fx.add('drop', x, c.sy + 4, { vx: slant * .5, vy: 90, life: 2, col: '#cfe6ff', gy });
        }
        for (const f of S.scene.flowers) if (Math.abs(f.x - c.x) < 18 && Math.random() < dt * .8) { f.pop = 1; f.h = Math.min(7, f.h + .5); }
      }
      // riscos de vento durante as rajadas
      if (st.gust > .15 && Math.random() < dt * 30 * st.gust) this.streaks.push({ x: st.gustDir > 0 ? -20 : W + 20, y: S.rand(8, H - 20), len: S.rand(14, 40), a: 1, p: Math.random() * 9 });
      gg.fillStyle = '#ffffff';
      this.streaks = this.streaks.filter(s => {
        s.x += st.gustDir * (260 + st.gust * 160) * dt; s.a -= dt * .7;
        for (let i = 0; i < s.len; i++) {
          const k = i / s.len, x = s.x - st.gustDir * i, curl = k < .25 ? Math.sin((.25 - k) * 14) * 3 : 0;
          if (S.bayer(x | 0, s.y | 0) < s.a * (1 - k) * .9) gg.fillRect(x | 0, s.y + Math.sin(k * 5 + s.p) * 1.5 - curl | 0, 1, 1);
        }
        return s.a > 0 && s.x > -60 && s.x < W + 60;
      });
    },
  };
})();
