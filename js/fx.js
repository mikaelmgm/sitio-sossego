// Sítio Sossego — partículas: folhas, fumaça, corações, notas, z's, faíscas, ondas na água
'use strict';
(() => {
  const st = S.st;
  const GLYPH = {
    heart: ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'],
    note: ['..xx', '..x.', '..x.', 'xxx.', 'xxx.'],
    note2: ['.xxxx', '.x..x', '.x..x', 'xx.xx', 'xx.xx'],
    z: ['xxx', '.x.', 'xxx'],
    bang: ['x', 'x', 'x', '.', 'x'],
    star: ['.x.', 'xxx', '.x.'],
  };
  S.glyph = (g, name, x, y, col) => {
    const m = GLYPH[name]; g.fillStyle = col; x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < m.length; j++) for (let i = 0; i < m[j].length; i++) if (m[j][i] === 'x') g.fillRect(x + i, y + j, 1, 1);
  };

  S.fx = {
    list: [], ripples: [],
    // kind: leaf | puff | smoke | heart | note | z | bang | spark | drop | egg
    add(kind, x, y, o = {}) {
      this.list.push(Object.assign({ kind, x, y, vx: 0, vy: 0, life: 1, age: 0, col: '#ffffff', s: 1, p: Math.random() * 9 }, o));
      if (this.list.length > 700) this.list.shift();
    },
    burst(kind, x, y, n, o = {}) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * S.TAU, v = (o.speed || 20) * (.4 + Math.random() * .8);
        this.add(kind, x, y, Object.assign({}, o, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), life: (o.life || .7) * (.6 + Math.random() * .7) }));
      }
    },
    ripple(x, y, big = 1) { this.ripples.push({ x, y, r: 1, big, a: 1 }); if (this.ripples.length > 40) this.ripples.shift(); },

    // lit = camada iluminada (folha, fumaça); glow = camada que brilha (coração, nota...)
    draw(g, gg, dt) {
      const wind = (st.wind * 8 + st.gust * 70) * st.gustDir;
      this.list = this.list.filter(p => {
        p.age += dt; if (p.age > p.life) return false;
        const k = p.age / p.life;
        switch (p.kind) {
          case 'leaf':
            p.vx += (wind - p.vx) * dt * 1.5; p.vy += (9 - p.vy) * dt * 2;
            p.x += (p.vx + Math.sin(st.t * 5 + p.p) * 9) * dt; p.y += p.vy * dt;
            if (p.gy && p.y > p.gy) { p.y = p.gy; p.vy = 0; p.vx *= .9; }
            g.fillStyle = p.col; g.fillRect(p.x | 0, p.y | 0, 2, 1); g.fillRect((p.x | 0) + (Math.sin(st.t * 6 + p.p) > 0 ? 1 : 0), (p.y | 0) - 1, 1, 1);
            break;
          case 'smoke': case 'puff': {
            p.vx += (wind * .6 - p.vx) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 1 - dt * .5;
            const r = p.s * (1 + k * 2.2) | 0;
            for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++)
              if (i * i + j * j <= r * r && S.bayer(p.x + i | 0, p.y + j | 0) > k * 1.1 - .1) { g.fillStyle = (i + j < -r * .4) ? '#ffffff' : p.col; g.fillRect(p.x + i | 0, p.y + j | 0, 1, 1); }
            break;
          }
          case 'heart': case 'note': case 'note2': case 'z': case 'bang': case 'star':
            p.x += (p.vx + Math.sin(st.t * 3 + p.p) * 5) * dt; p.y += p.vy * dt;
            if (k < .85 || (st.t * 20 | 0) & 1) S.glyph(gg, p.kind, p.x, p.y, p.col);
            break;
          case 'spark':
            p.vy += 60 * dt * (p.grav ?? 1); p.x += p.vx * dt; p.y += p.vy * dt;
            if (k < .7 || S.bayer(p.x | 0, p.y | 0) > k - .4) { gg.fillStyle = p.col; gg.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
            break;
          case 'drop':
            p.vy += 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.gy && p.y > p.gy) return false;
            g.fillStyle = p.col; g.fillRect(p.x | 0, p.y | 0, 1, 2);
            break;
          case 'egg':
            g.fillStyle = '#2a2440'; g.fillRect((p.x | 0) - 1, (p.y | 0) - 2, 4, 4);
            g.fillStyle = '#fff6e0'; g.fillRect(p.x | 0, (p.y | 0) - 1, 2, 2); g.fillRect(p.x | 0, (p.y | 0) - 2, 2, 1);
            break;
        }
        return true;
      });
    },
    drawRipples(g, dt) {
      this.ripples = this.ripples.filter(r => {
        r.r += dt * 14 * r.big; r.a -= dt * (1.1 / r.big);
        if (r.a <= 0) return false;
        g.fillStyle = r.a > .5 ? '#d8f2ff' : '#8fd0f0';
        for (let a = 0; a < S.TAU; a += .16 / Math.max(1, r.r * .2)) {
          const x = Math.round(r.x + Math.cos(a) * r.r), y = Math.round(r.y + Math.sin(a) * r.r * .42);
          if (S.world.inPond(x, y, -1) && S.bayer(x, y) < r.a + .2) g.fillRect(x, y, 1, 1);
        }
        return true;
      });
    },
  };
})();
