// Sítio Sossego — motor de som (Web Audio, tudo sintetizado ao vivo) + ambiente
'use strict';
(() => {
  const st = S.st;
  S.audio = {
    ctx: null, ambVol: .55, recipes: {},
    init() {
      try {
        const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = c.createGain(); this.master.gain.value = .9;
        const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
        this.master.connect(comp); comp.connect(c.destination);
        this.amb = c.createGain(); this.amb.gain.value = 0; this.amb.connect(this.master);
        this.fxBus = c.createGain(); this.fxBus.gain.value = .8; this.fxBus.connect(this.master);
        // ruído compartilhado (2 s)
        const len = c.sampleRate * 2, buf = this.nbuf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .22; }
        // camadas contínuas: vento, chuva e o "esfrega" dos botões
        this.wind = this.loop('bandpass', 500, .7, this.amb);
        this.rain = this.loop('highpass', 1800, .4, this.amb);
        this.rub = this.loop('bandpass', 1400, 2.5, this.fxBus);
        this.next = { cricket: 1, bird: 2, fire: .5, hen: 9, owl: 14 };
        this.lastDay = st.day;
        c.resume().catch(() => { });
      } catch (e) { console.warn('sem áudio', e); this.ctx = null; }
    },
    unlock() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => { }); },
    setAmb() { },
    loop(type, f, q, out) {
      const c = this.ctx, src = c.createBufferSource(), flt = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.nbuf; src.loop = true; flt.type = type; flt.frequency.value = f; flt.Q.value = q; g.gain.value = 0;
      src.connect(flt); flt.connect(g); g.connect(out); src.start();
      return { flt, g };
    },

    // ---- blocos de síntese ----
    out(pan, bus) {
      const c = this.ctx, g = c.createGain(); let node = g;
      if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = S.clamp(pan, -1, 1); g.connect(p); node = p; }
      node.connect(bus || this.fxBus); return g;
    },
    env(g, t, a, dur, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); },
    // o: {type,f,f1,dur,gain,a,when,pan,bus, flt:[type,f,Q,f1], vib:[rate,depth], trem:[rate,depth]}
    tone(o) {
      const c = this.ctx; if (!c || c.state !== 'running') return;
      const t = c.currentTime + (o.when || 0), osc = c.createOscillator(), g = this.out(o.pan, o.bus), dur = o.dur || .2;
      osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
      if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur * (o.glide || 1));
      if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + .1); }
      let node = osc;
      if (o.flt) { const f = c.createBiquadFilter(); f.type = o.flt[0]; f.frequency.setValueAtTime(o.flt[1], t); f.Q.value = o.flt[2] || 1; if (o.flt[3]) f.frequency.exponentialRampToValueAtTime(o.flt[3], t + dur); node.connect(f); node = f; }
      if (o.trem) { const tg = c.createGain(), l = c.createOscillator(), lg = c.createGain(); tg.gain.value = 1 - o.trem[1] / 2; l.frequency.value = o.trem[0]; lg.gain.value = o.trem[1] / 2; l.connect(lg); lg.connect(tg.gain); l.start(t); l.stop(t + dur + .1); node.connect(tg); node = tg; }
      node.connect(g); this.env(g, t, o.a || .005, dur, o.gain || .2);
      osc.start(t); osc.stop(t + dur + .05);
    },
    noise(o) {
      const c = this.ctx; if (!c || c.state !== 'running') return;
      const t = c.currentTime + (o.when || 0), src = c.createBufferSource(), g = this.out(o.pan, o.bus), dur = o.dur || .2;
      src.buffer = this.nbuf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = o.flt ? o.flt[0] : 'bandpass'; f.frequency.setValueAtTime(o.flt ? o.flt[1] : 1000, t); f.Q.value = o.flt && o.flt[2] || 1;
      if (o.flt && o.flt[3]) f.frequency.exponentialRampToValueAtTime(o.flt[3], t + dur);
      src.connect(f); f.connect(g); this.env(g, t, o.a || .004, dur, o.gain || .2);
      src.start(t, Math.random() * 1.5); src.stop(t + dur + .05);
    },
    sfx(name, o = {}) { const r = this.recipes[name]; if (r && this.ctx) try { r.call(this, o); } catch (e) { } },

    // ---- ambiente: segue vento, chuva, hora e some um pouco quando há música ----
    update(dt) {
      const c = this.ctx; if (!c || c.state !== 'running') return;
      const t = c.currentTime, night = 1 - st.day, A = this.amb, duck = st.music ? .4 : 1;
      A.gain.setTargetAtTime(st.amb ? this.ambVol * duck : 0, t, .4);
      // sem o ajudante de volume do Windows, o botão de volume passa a mandar no som do próprio wallpaper
      this.master.gain.setTargetAtTime(S.media && S.media.helperOk === false ? S.clamp(st.vol * 1.6) * .9 : .9, t, .08);
      const w = st.wind + st.gust * 1.3;
      this.wind.g.gain.setTargetAtTime(.05 + w * .22, t, .3); this.wind.flt.frequency.setTargetAtTime(320 + w * 520 + Math.sin(st.t * .6) * 80, t, .3);
      this.rain.g.gain.setTargetAtTime(st.rain * .5, t, .5);
      this.rub.g.gain.setTargetAtTime(this.rubLevel || 0, t, .03); this.rubLevel = (this.rubLevel || 0) * Math.exp(-dt * 14);
      const n = this.next, bus = A;
      for (const k in n) n[k] -= dt;
      if (n.cricket < 0) {                               // grilos: trens de seno com AM
        n.cricket = night > .6 && st.rain < .4 ? S.rand(.5, 1.6) : 2;
        if (night > .6 && st.rain < .4) { const f = S.rand(3900, 4600), pan = S.rand(-.8, .8); for (let i = 0; i < 3 + (Math.random() * 3 | 0); i++) this.tone({ f, dur: .05, gain: .035, when: i * .075, pan, bus, trem: [70, 1] }); }
      }
      if (n.bird < 0) {                                  // passarinhos de dia
        n.bird = st.day > .6 && st.rain < .3 ? S.rand(1.2, 5) : 3;
        if (st.day > .6 && st.rain < .3) { const f = S.rand(2200, 3600), pan = S.rand(-.9, .9), k = 2 + (Math.random() * 3 | 0); for (let i = 0; i < k; i++) this.tone({ f: f * S.rand(.9, 1.1), f1: f * S.rand(1.15, 1.5), dur: S.rand(.06, .12), gain: .045, when: i * S.rand(.1, .16), pan, bus }); }
      }
      if (n.fire < 0) {                                  // lareira estalando
        n.fire = S.rand(.06, .5);
        if (S.scene.lightsOn()) this.noise({ dur: S.rand(.02, .06), gain: S.rand(.02, .07), flt: ['bandpass', S.rand(900, 2600), 2], pan: -.45, bus });
      }
      if (n.hen < 0) { n.hen = S.rand(8, 22); if (st.day > .6) this.sfx('cluck', { quiet: .35, pan: .6, bus }); }
      if (n.owl < 0) { n.owl = S.rand(16, 40); if (night > .7) this.sfx('hoot', { quiet: .5, bus }); }
      // galo quando amanhece, e um "boa noite" de grilo quando escurece
      if (this.lastDay < .5 && st.day >= .5 && st.dayT > .5) this.sfx('rooster');
      this.lastDay = st.day;
    },
  };
})();
