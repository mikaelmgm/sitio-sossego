// Sítio Sossego — receitas dos efeitos sonoros (sintetizados; "this" é S.audio)
'use strict';
(() => {
  const PENT = [0, 2, 4, 7, 9];
  const R = S.audio.recipes;
  const q = o => (o.quiet ?? 1);

  // ---- botões de vidro ----
  R.tink = function () { this.tone({ f: 2500, dur: .18, gain: .10 }); this.tone({ f: 3740, dur: .1, gain: .05 }); this.tone({ f: 420, f1: 240, dur: .09, gain: .12 }); };
  R.plop = function () { this.tone({ f: 190, f1: 420, dur: .1, gain: .16, glide: .6 }); };
  R.rub = function (o) { this.rubLevel = Math.min(.12, (o.speed || 0) * .1); this.rub.flt.frequency.value = 900 + Math.min(1, o.speed || 0) * 1600; };
  R.pluck = function (o) {
    const n = o.n | 0, f = 392 * Math.pow(2, (PENT[n % 5] + 12 * Math.floor(n / 5)) / 12) * (o.up ? 1 : .5);
    this.tone({ type: 'triangle', f, dur: .45, gain: o.up ? .13 : .08 }); this.tone({ f: f * 2, dur: .2, gain: .04 });
  };
  R.click = function () { this.noise({ dur: .02, gain: .2, flt: ['highpass', 2500] }); this.tone({ f: 1500, dur: .04, gain: .08 }); this.noise({ dur: .02, gain: .15, flt: ['highpass', 2500], when: .07 }); };

  // ---- bichos ----
  R.baa = function (o) {
    const p = (o.pitch || 1) * S.rand(.9, 1.1);
    this.tone({ type: 'sawtooth', f: 330 * p, f1: 290 * p, dur: .5, a: .04, gain: .11 * q(o), flt: ['bandpass', 1100, 2.5], trem: [11, .9], vib: [11, 14], pan: o.pan, bus: o.bus });
  };
  R.moo = function (o) {
    const p = o.pitch || 1;
    this.tone({ type: 'sawtooth', f: 118 * p, f1: 92 * p, dur: 1.0, a: .15, gain: .2 * q(o), flt: ['lowpass', 520, 3, 380], pan: -.5, bus: o.bus });
    this.tone({ type: 'sawtooth', f: 236 * p, f1: 184 * p, dur: .9, a: .2, gain: .05 * q(o), flt: ['bandpass', 900, 3], pan: -.5, bus: o.bus });
  };
  R.cluck = function (o) {
    const n = 2 + (Math.random() * 3 | 0), p = o.pitch || 1;
    for (let i = 0; i < n; i++) this.tone({ type: 'square', f: S.rand(700, 950) * p, f1: 480 * p, dur: .06, gain: .06 * q(o), when: i * S.rand(.09, .14), flt: ['bandpass', 1500, 3], pan: o.pan ?? .5, bus: o.bus });
  };
  R.peep = function () { for (let i = 0; i < 2; i++) this.tone({ f: 3100, f1: 4300, dur: .06, gain: .06, when: i * .1 }); };
  R.quack = function () { for (let i = 0; i < 2; i++) this.tone({ type: 'sawtooth', f: 520, f1: 380, dur: .13, gain: .12, when: i * .17, flt: ['bandpass', 1250, 6] }); };
  R.meow = function () { this.tone({ type: 'sawtooth', f: 520, f1: 760, dur: .22, a: .03, gain: .09, flt: ['bandpass', 1600, 4, 2400], pan: -.4 }); this.tone({ type: 'sawtooth', f: 760, f1: 430, dur: .34, a: .02, gain: .09, when: .2, flt: ['bandpass', 2400, 4, 1100], pan: -.4 }); };
  R.hoot = function (o) { [0, .34, .5].forEach((w, i) => this.tone({ f: i ? 310 : 330, dur: i === 1 ? .12 : .4, a: .05, gain: .11 * q(o), when: w, pan: .25, bus: o.bus })); };
  R.rooster = function () {
    [[420, 560, .16, 0], [560, 600, .12, .2], [600, 720, .5, .36], [720, 380, .45, .86]].forEach(([f, f1, dur, when]) =>
      this.tone({ type: 'sawtooth', f, f1, dur, when, a: .03, gain: .09, flt: ['bandpass', 1700, 3], vib: [14, 10], pan: .5 }));
  };

  // ---- água, vento, madeira ----
  R.plip = function () { this.tone({ f: 800, f1: 1700, dur: .09, gain: .12, glide: .5 }); };
  R.drip = function () { for (let i = 0; i < 4; i++) this.tone({ f: S.rand(900, 1300), f1: 2000, dur: .07, gain: .08, when: i * .09, glide: .5 }); };
  R.splash = function () { this.noise({ dur: .4, gain: .3, flt: ['bandpass', 1500, .8, 420] }); this.tone({ f: 220, f1: 90, dur: .2, gain: .18 }); };
  R.whoosh = function (o) { const p = o.power || 1; this.noise({ dur: .9 + p * .5, a: .25, gain: .12 + p * .12, flt: ['bandpass', 350, 1.2, 1100] }); };
  R.rustle = function () { for (let i = 0; i < 5; i++) this.noise({ dur: .09, gain: .1, when: i * .05, flt: ['highpass', 3200] }); };
  R.creak = function () { this.tone({ type: 'sawtooth', f: 210, f1: 150, dur: .28, a: .03, gain: .07, flt: ['bandpass', 950, 7], trem: [26, .8], pan: .2 }); };
  R.thud = function () { this.tone({ f: 130, f1: 55, dur: .14, gain: .22 }); };
  R.pop = function (o) { const p = o.pitch || 1; this.tone({ f: 320 * p, f1: 1000 * p, dur: .1, gain: .16, glide: .7 }); this.noise({ dur: .03, gain: .1, flt: ['highpass', 3000] }); };
  R.puff = function () { this.noise({ dur: .3, a: .04, gain: .16, flt: ['lowpass', 500, .7, 200] }); };
  // batida de porta pesada: três toques, estalo de nó dos dedos + pancada grave que "cede"
  R.knock = function () {
    for (let i = 0; i < 3; i++) {
      const w = i * .25;
      this.noise({ dur: .03, gain: .22, when: w, flt: ['bandpass', 2200, 1.5], pan: -.4 });
      this.tone({ f: 98, f1: 60, dur: .25, gain: .34, when: w, pan: -.4 });
      this.tone({ f: 190, f1: 128, dur: .1, gain: .14, when: w, pan: -.4 });
    }
  };
})();
