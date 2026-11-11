// Sítio Sossego — layout, colinas e chão (tudo assado uma vez em canvases)
'use strict';
(() => {
  const st = S.st;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const GREENS = ['#bfe676', '#a2d962', '#84c955', '#69b84d', '#55a548', '#479444'];

  S.world = {
    init() {
      const W = st.W, H = st.H;
      st.horizon = Math.round(H * .44);
      // âncoras (x,y = ponto de apoio no chão)
      this.L = {
        cabin: { x: Math.round(W * .235), y: Math.round(H * .64) },
        tree: { x: Math.round(W * .585), y: Math.round(H * .675) },
        pond: { x: Math.round(W * .60), y: Math.round(H * .865), rx: Math.round(W * .125), ry: Math.round(H * .062) },
        coop: { x: Math.round(W * .86), y: Math.round(H * .615) },
        pen: { x0: Math.round(W * .775), x1: Math.round(W * .965), y0: Math.round(H * .60), y1: Math.round(H * .73) },
        garden: { x: Math.round(W * .385), y: Math.round(H * .70) },
        mill: { x: Math.round(W * .105), y: Math.round(H * .40) },
        line: { x0: Math.round(W * .345), x1: Math.round(W * .455), y: Math.round(H * .585) },
        cow: { x: Math.round(W * .15), y: Math.round(H * .86) },
        scare: { x: Math.round(W * .43), y: Math.round(H * .665) },
      };
      this.sky = mk(W, H); this.lit = mk(W, H); this.glow = mk(W, H);
      this.gs = this.sky.getContext('2d'); this.g = this.lit.getContext('2d'); this.gg = this.glow.getContext('2d');
      for (const c of [this.gs, this.g, this.gg]) c.imageSmoothingEnabled = false;
      this.back = this.bakeHills();
      this.ground = this.bakeGround();
    },

    // y do topo do pasto em x
    hz(x) { const u = x / st.W; return st.horizon + Math.sin(u * 4.1 + .4) * 5 + Math.sin(u * 9.3 + 2) * 1.6; },
    inPond(x, y, grow = 0) {
      const p = this.L.pond, dx = (x - p.x) / (p.rx + grow), dy = (y - p.y) / (p.ry + grow);
      return dx * dx + dy * dy < 1;
    },
    blocked(x, y) {
      const L = this.L;
      if (y < this.hz(x) + 3 || y > st.H - 4 || x < 4 || x > st.W - 4) return true;
      if (this.inPond(x, y, 2)) return true;
      if (Math.abs(x - L.cabin.x) < 38 && y > L.cabin.y - 14 && y < L.cabin.y + 2) return true;
      if (Math.abs(x - L.coop.x) < 13 && y > L.coop.y - 8 && y < L.coop.y + 2) return true;
      if (Math.abs(x - L.tree.x) < 5 && Math.abs(y - L.tree.y) < 3) return true;
      return false;
    },

    bakeHills() {
      const W = st.W, H = st.H, p = new S.Pix(W, H), r = S.rng(11), hz = st.horizon;
      const layer = (base, amp, f1, f2, ph, cols, trees) => {
        const top = x => base + Math.sin(x / W * f1 + ph) * amp + Math.sin(x / W * f2 + ph * 2.3) * amp * .35;
        for (let x = 0; x < W; x++) {
          const y0 = Math.round(top(x));
          for (let y = y0; y < hz + 12; y++) {
            const t = (y - y0) / 26 + (S.bayer(x, y) - .5) * .5;
            p.px(x, y, y === y0 ? cols[0] : t < .35 ? cols[1] : t < .8 ? cols[2] : cols[3]);
          }
        }
        for (let i = 0; i < trees; i++) {
          const x = r() * W | 0, y = Math.round(top(x)) + 1 + (r() * 5 | 0), s = 2 + (r() * 2 | 0);
          p.ellipse(x, y - s, s, s + 1, cols[4]); p.px(x - 1, y - s - 1, cols[5]); p.px(x, y, cols[6]);
        }
      };
      // do mais distante (azulado) ao mais próximo
      layer(hz - 26, 9, 5.2, 13, 1.0, ['#c4e2ea', '#b2d6e2', '#a6cedc', '#9cc6d6', '#8fbccc', '#b2d6e2', '#8fbccc'], 0);
      layer(hz - 16, 8, 6.4, 15, 3.1, ['#b6e0b0', '#9ed3a0', '#8fc994', '#84c08a', '#6aa97c', '#8fc994', '#5a916c'], 16);
      layer(hz - 7, 7, 4.3, 11, 5.0, ['#c2e884', '#a0d86e', '#8ccb62', '#7cbf58', '#4f9a52', '#72b860', '#6b4a3a'], 22);
      return p.canvas();
    },

    bakeGround() {
      const W = st.W, H = st.H, p = new S.Pix(W, H), r = S.rng(23), L = this.L;
      const patch = (x, y) => S.noise1(x * .035 + y * .09) * .9 + S.noise1(x * .11 - y * .05 + 40) * .5;
      for (let x = 0; x < W; x++) {
        const y0 = Math.round(this.hz(x));
        for (let y = y0; y < H; y++) {
          const t = (y - y0) / (H - y0);
          let i = t * 4.2 + (S.bayer(x, y) - .5) * 1.1 + patch(x, y) * .7;
          i = S.clamp(Math.round(i), 0, GREENS.length - 1);
          p.px(x, y, y === y0 ? '#d6f08c' : GREENS[i]);
        }
      }
      // caminho de terra: da porta da cabana até a borda de baixo
      for (let k = 0; k <= 1; k += .004) {
        const y = S.lerp(L.cabin.y + 1, H + 4, k);
        const x = L.cabin.x + 6 + Math.sin(k * 3.4) * 26 + k * k * 40, w = 5 + k * 9;
        for (let dx = -w; dx <= w; dx++) {
          const e = Math.abs(dx) / w, px = Math.round(x + dx), py = Math.round(y);
          if (e > .8 && S.bayer(px, py) > .5) continue;
          p.px(px, py, e > .65 ? '#d9bf86' : r() < .06 ? '#c9ab72' : '#ecd9a6');
        }
      }
      // horta
      const g = L.garden;
      for (let row = 0; row < 4; row++) {
        const y = g.y + row * 5;
        p.rect(g.x - 22 + row, y, 44, 3, '#8a5f44'); p.rect(g.x - 22 + row, y, 44, 1, '#a57652');
        for (let i = 0; i < 7; i++) {
          const x = g.x - 19 + row + i * 6;
          if (row === 0) { p.rect(x, y - 2, 3, 3, '#f08a3c'); p.px(x + 1, y - 3, '#3f8f46'); p.px(x, y - 2, '#ffb066'); }
          else if (row === 1) { p.rect(x, y - 2, 3, 2, '#7fd070'); p.px(x + 1, y - 3, '#a8e68c'); }
          else if (row === 2) { p.px(x + 1, y - 1, '#3f8f46'); p.px(x + 1, y - 2, '#3f8f46'); p.px(x, y - 3, '#e2504c'); p.px(x + 2, y - 2, '#e2504c'); }
          else { p.px(x, y - 1, '#58a84c'); p.px(x + 1, y - 2, '#58a84c'); p.px(x + 2, y - 1, '#58a84c'); }
        }
      }
      // lago: margem de areia + água em faixas
      const q = L.pond;
      p.ellipse(q.x, q.y, q.rx + 4, q.ry + 3, '#3f8a44');
      p.ellipse(q.x, q.y, q.rx + 3, q.ry + 2, '#e6d49c');
      p.ellipse(q.x, q.y + 1, q.rx + 1, q.ry, '#2f6f9e');
      p.ellipse(q.x, q.y, q.rx, q.ry, '#3f8fc4');
      p.ellipse(q.x - 2, q.y - 1, q.rx * .82, q.ry * .72, '#52a6d8');
      p.ellipse(q.x - 5, q.y - 2, q.rx * .5, q.ry * .4, '#6cbbe6');
      // pedrinhas e tufos escuros espalhados
      for (let i = 0; i < 150; i++) {
        const x = r() * W | 0, y = Math.round(this.hz(x) + 4 + r() * (H - this.hz(x) - 6));
        if (this.inPond(x, y, 6)) continue;
        if (r() < .12) { p.rect(x, y, 3, 2, '#b9b6c8'); p.px(x, y, '#dcdaea'); p.px(x + 2, y + 1, '#8f8ca6'); }
        else { p.px(x, y, '#3f8a44'); p.px(x + 1, y - 1, '#3f8a44'); p.px(x + 2, y, '#3f8a44'); }
      }
      return p.canvas();
    },
  };
})();
