// Sítio Sossego — Wallpaper Engine: música tocando, espectro de áudio, propriedades; e o ajudante de volume
'use strict';
(() => {
  const st = S.st, HELPER = 'http://127.0.0.1:38917';
  const $ = id => document.getElementById(id);

  S.media = {
    title: '', artist: '', playing: false, pos: 0, dur: 0, avg: 0, cool: 0, raw: null, showMusic: true,
    helperOk: null, lastSend: 0, pending: null, noteT: 0,

    init() {
      this.el = $('now'); this.cg = $('cover').getContext('2d'); this.sg = $('spec').getContext('2d');
      this.drawCover(null);
      const W = window;
      if (W.wallpaperRegisterAudioListener) W.wallpaperRegisterAudioListener(a => { this.raw = a; });
      if (W.wallpaperRegisterMediaPropertiesListener) W.wallpaperRegisterMediaPropertiesListener(e => this.setTrack(e.title, e.artist));
      if (W.wallpaperRegisterMediaThumbnailListener) W.wallpaperRegisterMediaThumbnailListener(e => this.drawCover(e.thumbnail));
      if (W.wallpaperRegisterMediaPlaybackListener) W.wallpaperRegisterMediaPlaybackListener(e => { this.playing = e.state === (W.wallpaperMediaIntegration ? W.wallpaperMediaIntegration.PLAYBACK_PLAYING : 1); });
      if (W.wallpaperRegisterMediaTimelineListener) W.wallpaperRegisterMediaTimelineListener(e => { this.pos = e.position; this.dur = e.duration; });
      W.wallpaperPropertyListener = {
        applyGeneralProperties: p => { if (p.fps) st.fps = p.fps; },
        applyUserProperties: p => {
          if (p.uiscale) { st.uiScale = p.uiscale.value; S.ui.layout(true); }
          if (p.ambvolume) S.audio.ambVol = p.ambvolume.value / 100;
          if (p.showmusic) this.showMusic = p.showmusic.value;
          if (p.autorain) S.weather.auto = p.autorain.value;
          if (p.startsound) { st.amb = p.startsound.value; }
        },
      };
      this.demo = /demo/.test(location.search);
      if (this.demo) { this.setTrack('Manhã no Sítio', 'Modo demonstração'); this.playing = true; this.dur = 180; }
      this.poll(); setInterval(() => this.poll(), 4000);
    },

    setTrack(title, artist) {
      if (title === this.title && artist === this.artist) return;
      this.title = title || ''; this.artist = artist || '';
      $('title').textContent = this.title || '—'; $('artist').textContent = this.artist;
      if (this.title) {
        this.bump();
        const L = S.world.L.cabin;
        for (let i = 0; i < 5; i++) S.fx.add(i & 1 ? 'note' : 'note2', L.x + 18 + i * 4, L.y - 26, { vy: -9 - i * 2, vx: 3, life: 1.8 + i * .2, col: S.pick(['#ffd84a', '#ff8fb0', '#7ad0ff']) });
      }
    },
    bump() { this.el.classList.add('bump'); setTimeout(() => this.el.classList.remove('bump'), 90); },
    drawCover(src) {
      const g = this.cg; g.imageSmoothingEnabled = true;
      const blank = () => { g.fillStyle = '#2a2440'; g.fillRect(0, 0, 24, 24); g.fillStyle = '#ff7a59'; g.beginPath(); g.arc(12, 12, 5, 0, 7); g.fill(); g.fillStyle = '#fff6e8'; g.fillRect(11, 11, 2, 2); };
      if (!src) return blank();
      const im = new Image(); im.onload = () => { g.drawImage(im, 0, 0, 24, 24); g.fillStyle = '#2a2440'; g.fillRect(11, 11, 2, 2); }; im.onerror = blank; im.src = src;
    },

    update(dt) {
      // espectro: 128 valores do Wallpaper Engine (64 esq + 64 dir) -> 32 bandas
      let bass = 0;
      if (this.demo) { const b = Math.pow(Math.max(0, Math.sin(st.t * Math.PI * 2 * 1.7)), 8); this.raw = Array.from({ length: 128 }, (_, i) => { const k = i % 64; return (k < 5 ? b * .9 : 0) + Math.max(0, S.noise1(st.t * 3 + k * .7)) * .5 * (1 - k / 80); }); }
      const a = this.raw;
      for (let i = 0; i < 32; i++) {
        let v = 0; if (a) v = Math.min(1, ((a[i] || 0) + (a[i + 64] || 0)) * .5 * 1.6);
        st.spec[i] = Math.max(v, st.spec[i] - dt * 2.2);
      }
      if (a) bass = ((a[0] || 0) + (a[1] || 0) + (a[2] || 0) + (a[64] || 0) + (a[65] || 0) + (a[66] || 0)) / 6;
      this.avg += (bass - this.avg) * Math.min(1, dt * 3); this.cool -= dt;
      st.beat = Math.max(0, st.beat - dt * 5); st.bass += (Math.min(1, bass * 1.5) - st.bass) * Math.min(1, dt * 12);
      const energy = st.spec.reduce((s, v) => s + v, 0) / 32;
      st.music = (this.playing && !!this.title) || energy > .04;
      if (bass > this.avg * 1.3 + .04 && this.cool <= 0) {
        st.beat = 1; this.cool = .2;
        if (st.music && this.showMusic && this.title) this.bump();
      }
      // notinhas saindo da cabana enquanto toca
      this.noteT -= dt;
      if (st.music && this.noteT < 0) { this.noteT = S.rand(.5, 1.1); const L = S.world.L.cabin; S.fx.add(Math.random() < .5 ? 'note' : 'note2', L.x + S.rand(14, 30), L.y - 24, { vy: -8, vx: S.rand(1, 5), life: 2, col: S.pick(['#ffd84a', '#ff8fb0', '#7ad0ff', '#ffffff']) }); }

      const show = this.showMusic && !!this.title;
      this.el.classList.toggle('hidden', !show); this.el.classList.toggle('playing', this.playing);
      if (!show) return;
      if (this.playing && this.dur) this.pos = Math.min(this.dur, this.pos + dt);
      $('barfill').style.width = (this.dur ? this.pos / this.dur * 100 : 0) + '%';
      const g = this.sg; g.clearRect(0, 0, 32, 12);
      for (let i = 0; i < 16; i++) {
        const h = Math.max(1, Math.round((st.spec[i * 2] + st.spec[i * 2 + 1]) * .5 * 11));
        g.fillStyle = st.day < .5 ? '#ffc56b' : '#ff7a59'; g.fillRect(i * 2, 12 - h, 1, h);
        g.fillStyle = st.day < .5 ? '#fff0c0' : '#ffd0a0'; g.fillRect(i * 2, 12 - h, 1, 1);
      }
    },

    // ---- ajudante de volume (programinha local, opcional) ----
    url(path) { return `${HELPER}/${path}${path.includes('?') ? '&' : '?'}t=${encodeURIComponent(window.SITIO_TOKEN || '')}`; },
    poll() {
      if (S.ui.active >= 0) return;
      fetch(this.url('get')).then(r => r.json()).then(j => { this.helperOk = true; st.muted = !!j.muted; if (Math.abs(j.level - st.vol) > .005) { st.vol = j.level; S.ui.syncVol(j.level); } })
        .catch(() => { this.helperOk = false; });
    },
    setVolume(v) {
      if (this.helperOk === false) return;          // o poll() a cada 4 s reativa se o ajudante aparecer
      this.pending = v; const now = performance.now();
      if (now - this.lastSend < 50) { clearTimeout(this.timer); this.timer = setTimeout(() => this.setVolume(this.pending), 60); return; }
      this.lastSend = now;
      fetch(this.url('set?v=' + v.toFixed(3))).then(() => { this.helperOk = true; })
        .catch(() => { this.helperOk = false; });   // sem ajudante: o botão controla o som do próprio sítio (ver audio.js)
    },
  };
})();
