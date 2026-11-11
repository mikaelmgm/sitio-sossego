// Sítio Sossego — desenho em pixels (sem suavização)
'use strict';
(() => {
  const cache = new Map();
  // '#rrggbb' ou '#rrggbbaa' -> uint32 ABGR (little endian)
  const u32 = h => {
    let v = cache.get(h);
    if (v === undefined) {
      const n = parseInt(h.slice(1, 7), 16);
      const a = h.length > 7 ? parseInt(h.slice(7, 9), 16) : 255;
      v = (a << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16 & 255) >>> 0;
      cache.set(h, v);
    }
    return v;
  };
  const shade = (c, f) => {           // clareia (f>1) ou escurece (f<1) um uint32
    const r = Math.min(255, (c & 255) * f), g = Math.min(255, (c >> 8 & 255) * f), b = Math.min(255, (c >> 16 & 255) * f);
    return (c & 0xff000000 | b << 16 | g << 8 | r) >>> 0;
  };

  class Pix {
    constructor(w, h) { this.w = w | 0; this.h = h | 0; this.d = new Uint32Array(this.w * this.h); }
    px(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = u32(c); return this; }
    get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : 0; }
    rect(x, y, w, h, c) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      const v = u32(c), x1 = Math.min(this.w, x + w), y1 = Math.min(this.h, y + h);
      for (let j = Math.max(0, y); j < y1; j++) for (let i = Math.max(0, x); i < x1; i++) this.d[j * this.w + i] = v;
      return this;
    }
    ellipse(cx, cy, rx, ry, c) {
      const v = u32(c);
      for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) {
        if (j < 0 || j >= this.h) continue;
        const dy = (j + .5 - cy) / ry, s = 1 - dy * dy;
        if (s <= 0) continue;
        const hw = Math.sqrt(s) * rx;
        const x0 = Math.max(0, Math.round(cx - hw)), x1 = Math.min(this.w, Math.round(cx + hw));
        for (let i = x0; i < x1; i++) this.d[j * this.w + i] = v;
      }
      return this;
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) {
        this.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
      return this;
    }
    // polígono preenchido (scanline), pts = [[x,y],...]
    poly(pts, c) {
      const v = u32(c);
      let ymin = Infinity, ymax = -Infinity;
      for (const p of pts) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
      for (let j = Math.max(0, Math.floor(ymin)); j <= Math.min(this.h - 1, Math.ceil(ymax)); j++) {
        const yy = j + .5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const x0 = Math.max(0, Math.round(xs[k])), x1 = Math.min(this.w, Math.round(xs[k + 1]));
          for (let i = x0; i < x1; i++) this.d[j * this.w + i] = v;
        }
      }
      return this;
    }
    // luz em cima / sombra embaixo + contorno de 1px: tudo vira "sprite"
    finish(outline = '#2a2440', lit = 1.14, dark = .84) {
      const { w, h, d } = this, src = d.slice(), o = outline ? u32(outline) : 0;
      const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h ? src[y * w + x] : 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const c = src[y * w + x];
        if (c) {
          if (lit && !at(x, y - 1)) d[y * w + x] = shade(c, lit);
          else if (dark && !at(x, y + 1)) d[y * w + x] = shade(c, dark);
        } else if (o && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) d[y * w + x] = o;
      }
      return this;
    }
    canvas(flip = false) {
      const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h;
      const g = cv.getContext('2d'), im = g.createImageData(this.w, this.h);
      const out = new Uint32Array(im.data.buffer);
      if (!flip) out.set(this.d);
      else for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) out[y * this.w + x] = this.d[y * this.w + this.w - 1 - x];
      g.putImageData(im, 0, 0);
      return cv;
    }
  }
  S.Pix = Pix;

  // sprite a partir de um mapa de texto: rows = ['..ab..', ...], pal = {a:'#...'}
  // margem de 1px para o contorno. Devolve {r: canvas, l: canvas espelhado, w, h}
  S.sprite = (rows, pal, outline = '#2a2440') => {
    const w = Math.max(...rows.map(r => r.length)) + 2, h = rows.length + 2, p = new Pix(w, h);
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const c = pal[row[x]]; if (c) p.px(x + 1, y + 1, c); } });
    p.finish(outline, 0, 0);
    return { r: p.canvas(), l: p.canvas(true), w, h };
  };

  // desenha um objeto com funções de forma e devolve canvas com contorno
  S.stamp = (w, h, fn, outline = '#2a2440', lit = 1.14, dark = .84) => {
    const p = new Pix(w, h); fn(p); p.finish(outline, lit, dark); return p.canvas();
  };
})();
