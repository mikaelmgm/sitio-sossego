// Sítio Sossego — bichinhos de enfeite: peixes, pato, gato, coruja, borboletas e vaga-lumes
'use strict';
(() => {
  const st = S.st;
  const sfx = (n, o) => S.audio && S.audio.sfx(n, o);

  S.critters = {
    init() {
      const q = S.world.L.pond, L = S.world.L;
      const inP = () => { const a = Math.random() * S.TAU, r = Math.sqrt(Math.random()) * .8; return [q.x + Math.cos(a) * q.rx * r, q.y + Math.sin(a) * q.ry * r]; };
      this.inP = inP;
      this.fish = Array.from({ length: 8 }, (_, i) => { const [x, y] = inP(); return { x, y, tx: x, ty: y, dir: 1, sp: 1, koi: i < 3, j: 0, p: Math.random() * 9 }; });
      const [dx, dy] = inP(); this.duck = { x: dx, y: dy, tx: dx, ty: dy, dir: 1, t: 2 };
      this.cat = { x: L.cabin.x - 9, y: L.cabin.y + 2, blink: 0, t: 3 };
      this.owl = { x: L.tree.x + 18, y: L.tree.y - 33, blink: 0, t: 2 };
      this.flies = Array.from({ length: 16 }, () => ({ x: S.rand(st.W), y: S.rand(st.horizon, st.H - 10), p: Math.random() * 99 }));
      this.bfly = Array.from({ length: 7 }, (_, i) => ({ x: S.rand(st.W), y: S.rand(st.horizon + 10, st.H - 20), p: Math.random() * 99, c: ['#ff8fb0', '#ffd84a', '#ffffff', '#7ad0ff', '#ff7a59'][i % 5] }));
      this.nextJump = 5;
    },

    scatter(x, y) {
      for (const f of this.fish) if (S.dist(x, y, f.x, f.y) < 26) { const [tx, ty] = this.inP(); f.tx = tx; f.ty = ty; f.sp = 5; }
    },
    pick(x, y) {
      if (S.dist(x, y, this.cat.x, this.cat.y - 4) < 6) return 'cat';
      if (S.dist(x, y, this.duck.x, this.duck.y - 3) < 7) return 'duck';
      if (st.day < .4 && S.dist(x, y, this.owl.x, this.owl.y - 3) < 6) return 'owl';
      return null;
    },
    poke(who) {
      if (who === 'cat') { sfx('meow'); this.cat.blink = .4; S.fx.add('heart', this.cat.x - 2, this.cat.y - 15, { vy: -8, life: 1.2, col: '#ff6b8a' }); }
      if (who === 'duck') { sfx('quack'); S.fx.ripple(this.duck.x, this.duck.y, 1.2); const [tx, ty] = this.inP(); this.duck.tx = tx; this.duck.ty = ty; this.duck.fast = 3; }
      if (who === 'owl') { sfx('hoot'); this.owl.blink = .5; S.fx.add('note', this.owl.x + 3, this.owl.y - 12, { vy: -7, life: 1.3, col: '#cfd6ff' }); }
    },

    drawFish(g, dt) {
      const wd = S.world;
      this.nextJump -= dt * (1 + st.bass * 3);
      for (const f of this.fish) {
        const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy);
        if (d < 2) { [f.tx, f.ty] = this.inP(); f.sp = 1; }
        else { const v = (5 + f.sp * 6) * dt; f.x += dx / d * v; f.y += dy / d * v * .6; f.dir = dx > 0 ? 1 : -1; f.sp += (1 - f.sp) * dt; }
        if (this.nextJump < 0 && !f.j && Math.random() < .2) { this.nextJump = S.rand(4, 11); f.j = .001; S.fx.ripple(f.x, f.y); sfx('plip'); }
        const x = Math.round(f.x), y = Math.round(f.y), wag = Math.sin(st.t * 9 + f.p) > 0 ? 1 : 0;
        if (f.j) {                                         // salto: arco sobre a água
          f.j += dt * 1.6; const h = Math.sin(f.j * Math.PI) * 11, jx = x + Math.round(f.j * 8 * f.dir);
          g.fillStyle = '#2a2440'; g.fillRect(jx - 3, y - h - 1 | 0, 6, 4);
          g.fillStyle = f.koi ? '#ff8a3c' : '#7ab0d0'; g.fillRect(jx - 2, y - h | 0, 4, 2);
          g.fillStyle = '#ffffff'; g.fillRect(jx + f.dir, y - h | 0, 1, 1);
          if (f.j >= 1) { f.j = 0; f.x = jx; S.fx.ripple(jx, y, 1.3); S.fx.burst('drop', jx, y, 5, { col: '#d8f2ff', speed: 16, up: 30, life: .5, gy: y }); }
          continue;
        }
        if (!wd.inPond(x, y, -3)) continue;
        g.fillStyle = f.koi ? '#f0884a' : '#2a6a96';
        g.fillRect(x - 2, y, 4, 1); g.fillRect(x - 1, y - 1, 2, 1); g.fillRect(x - 3 * f.dir - (f.dir < 0 ? 1 : 0), y - wag, 1, 2);
        if (f.koi) { g.fillStyle = '#fff2e0'; g.fillRect(x, y, 1, 1); }
      }
    },

    collect(put, g, gg, dt) {
      const night = 1 - st.day, t = st.t, lights = S.lights;
      // pato
      const d = this.duck, asleep = st.day < .3;
      if (!asleep) {
        const dx = d.tx - d.x, dy = d.ty - d.y, dd = Math.hypot(dx, dy);
        if (dd < 2) { d.t -= dt; d.fast = 1; if (d.t < 0) { d.t = S.rand(2, 7); [d.tx, d.ty] = this.inP(); } }
        else { const v = 5 * (d.fast || 1) * dt; d.x += dx / dd * v; d.y += dy / dd * v * .6; d.dir = dx > 0 ? 1 : -1; if (Math.random() < dt * 1.5) S.fx.ripple(d.x - d.dir * 4, d.y, .6); }
      }
      put(d.y + 1, () => {
        const s = S.SPR.duck, x = Math.round(d.x - s.w / 2), y = Math.round(d.y - s.h + 3 + Math.sin(t * 2) * .6);
        g.drawImage(d.dir < 0 ? s.l : s.r, 0, 0, s.w, s.h - 2, x, y, s.w, s.h - 2);
        g.fillStyle = '#a8dcf4'; g.fillRect(x + 1, y + s.h - 2, s.w - 3, 1);
      });
      // gato na porta
      const c = this.cat; c.t -= dt; c.blink = Math.max(0, c.blink - dt);
      if (c.t < 0) { c.t = S.rand(2, 6); c.blink = .25; }
      put(c.y, () => {
        S.drawSpr(g, c.blink > 0 ? S.SPR.cat.b : S.SPR.cat.a, c.x, c.y, false);
        if (night > .5 && c.blink <= 0) { gg.fillStyle = '#ffe94a'; gg.fillRect(Math.round(c.x) - 2, c.y - 6, 1, 1); gg.fillRect(Math.round(c.x), c.y - 6, 1, 1); }
      });
      // coruja no galho, só à noite
      const o = this.owl; o.t -= dt; o.blink = Math.max(0, o.blink - dt);
      if (o.t < 0) { o.t = S.rand(2, 5); o.blink = .2; }
      this.drawOwl = () => {                               // chamada depois da copa, para ficar na frente das folhas
        if (st.day >= .4) return;
        S.drawSpr(g, o.blink > 0 ? S.SPR.owl.b : S.SPR.owl.a, o.x, o.y, false);
        if (o.blink <= 0) { gg.fillStyle = '#ffe94a'; gg.fillRect(Math.round(o.x) - 2, o.y - 4, 1, 1); gg.fillRect(Math.round(o.x) + 1, o.y - 4, 1, 1); }
      };
      // borboletas (dia, sem chuva)
      const ba = S.smooth(.55, .85, st.day) * (1 - st.rain);
      if (ba > .05) for (const b of this.bfly) {
        b.x += (S.noise1(t * .3 + b.p) * 16 + st.gust * st.gustDir * 40) * dt; b.y += S.noise1(t * .35 + b.p + 50) * 10 * dt;
        if (b.x < -5) b.x = st.W + 4; if (b.x > st.W + 5) b.x = -4; b.y = S.clamp(b.y, st.horizon - 10, st.H - 12);
        put(st.H + 6, () => { const up = Math.sin(t * 16 + b.p) > 0, x = b.x | 0, y = b.y | 0; g.fillStyle = b.c; g.fillRect(x - 1, y - (up ? 1 : 0), 1, 2); g.fillRect(x + 1, y - (up ? 1 : 0), 1, 2); g.fillStyle = '#2a2440'; g.fillRect(x, y, 1, 1); });
      }
      // vaga-lumes (noite): pulsam com o grave da música
      const fa = S.smooth(.55, .9, night) * (1 - st.rain * .8);
      if (fa > .05) this.flies.forEach((f, i) => {
        f.x += S.noise1(t * .25 + f.p) * 9 * dt; f.y += S.noise1(t * .3 + f.p + 30) * 7 * dt;
        f.x = (f.x + st.W) % st.W; f.y = S.clamp(f.y, st.horizon - 16, st.H - 8);
        const pulse = S.clamp(.5 + .5 * Math.sin(t * 2.2 + f.p) + st.bass * .8) * fa;
        if (pulse > .25) { gg.globalAlpha = pulse; gg.fillStyle = '#eaff8a'; gg.fillRect(f.x | 0, f.y | 0, 1, 1); gg.globalAlpha = pulse * .35; gg.fillRect((f.x | 0) - 1, (f.y | 0) - 1, 3, 3); gg.globalAlpha = 1; }
        if (i < 7) lights.push([f.x, f.y, 11, pulse * .8, .8, 1, .4]);
      });
    },
  };
})();
