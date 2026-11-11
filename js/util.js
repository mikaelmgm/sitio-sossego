// Sítio Sossego — utilitários e estado global
'use strict';
const S = window.S = {};

S.TAU = Math.PI * 2;
S.clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
S.lerp = (a, b, t) => a + (b - a) * t;
S.smooth = (a, b, v) => { const t = S.clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
S.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

// RNG com semente (mulberry32) para o cenário sair igual toda vez
S.rng = seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
S.rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
S.pick = arr => arr[Math.random() * arr.length | 0];

// cores
S.hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
S.rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
S.mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
S.mixHex = (a, b, t) => S.rgb(S.mix(S.hex(a), S.hex(b), t));
// gradiente por paradas: stops = [[t, '#hex'], ...]
S.ramp = (stops, t) => {
  if (t <= stops[0][0]) return S.hex(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const a = stops[i - 1], b = stops[i];
      return S.mix(S.hex(a[1]), S.hex(b[1]), (t - a[0]) / (b[0] - a[0]));
    }
  }
  return S.hex(stops[stops.length - 1][1]);
};

S.BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
S.bayer = (x, y) => S.BAYER[(y & 3) * 4 + (x & 3)];

// mola amortecida simples
S.Spring = class {
  constructor(x = 0, k = 120, d = 14) { this.x = x; this.v = 0; this.t = x; this.k = k; this.d = d; }
  step(dt) {
    const a = (this.t - this.x) * this.k - this.v * this.d;
    this.v += a * dt; this.x += this.v * dt; this.a = a;
    return this.x;
  }
};

// ruído 1D suave (para vento e nuvens)
S.noise1 = (() => {
  const r = S.rng(7), g = Array.from({ length: 256 }, () => r() * 2 - 1);
  return x => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return S.lerp(g[i & 255], g[i + 1 & 255], u);
  };
})();

// estado compartilhado entre os módulos
S.st = {
  t: 0, dt: 0,
  W: 512, H: 288, scale: 5,      // tamanho da cena em pixels e escala
  day: 1, dayT: 1,               // 0 = noite, 1 = dia (dayT = alvo)
  wind: .25, gust: 0, gustDir: 1,// vento base + rajada
  rain: 0, rainT: 0,             // intensidade da chuva
  wet: 0,                        // chão molhado (arco-íris depois)
  vol: .5, muted: false,         // volume do PC (0..1)
  amb: true,                     // som ambiente ligado
  music: false, beat: 0, bass: 0,// música tocando + energia
  spec: new Float32Array(32),
  horizon: 126,                  // y onde começa o pasto
};

S.toast = (() => {
  let h;
  return msg => {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(h); h = setTimeout(() => el.classList.remove('show'), 2200);
  };
})();
