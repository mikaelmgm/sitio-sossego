// Sítio Sossego — bichos que andam: ovelhas, galinhas, pintinhos e vacas
'use strict';
(() => {
  const st = S.st;
  const KIND = {
    sheep: { speed: 9, w: 14, h: 10, roam: 70 },
    hen: { speed: 15, w: 9, h: 9, roam: 40 },
    chick: { speed: 17, w: 5, h: 5, roam: 26 },
    cow: { speed: 5, w: 23, h: 12, roam: 60 },
  };
  const sfx = (n, o) => S.audio && S.audio.sfx(n, o);

  S.animals = {
    list: [], eggs: [], held: null,
    init() {
      const L = S.world.L, W = st.W, H = st.H;
      this.list = []; this.eggs = [];
      this.spawn('sheep', W * .46, H * .80, { variant: 'white' });
      this.spawn('sheep', W * .52, H * .74, { variant: 'white' });
      this.spawn('sheep', W * .30, H * .90, { variant: 'black' });
      const hv = ['white', 'brown', 'white', 'gray', 'brown'];
      hv.forEach((v, i) => this.spawn('hen', S.lerp(L.pen.x0 + 8, L.pen.x1 - 8, i / 4), S.lerp(L.pen.y0 + 6, L.pen.y1 - 6, (i * 37 % 10) / 10), { variant: v, home: L.pen }));
      this.spawn('cow', L.cow.x, L.cow.y, { anchor: { x: L.cow.x, y: L.cow.y } });
      this.spawn('cow', L.cow.x - 34, L.cow.y - 22, { anchor: { x: L.cow.x, y: L.cow.y }, dir: -1 });
      S.critters.init();
    },
    spawn(kind, x, y, o = {}) {
      const e = Object.assign({ kind, x, y, z: 0, vz: 0, dir: Math.random() < .5 ? 1 : -1, state: 'idle', timer: S.rand(.5, 3), tx: x, ty: y, ph: Math.random() * 9, squash: 0, zt: 0, variant: 'white' }, o);
      this.list.push(e);
      const sheep = this.list.filter(a => a.kind === 'sheep');
      if (sheep.length > 40) { const old = sheep[0]; S.fx.burst('puff', old.x, old.y - 5, 5, { col: '#e8e6f0', speed: 8, life: .6 }); this.list.splice(this.list.indexOf(old), 1); }
      return e;
    },

    pick(x, y) {
      let best = null, bd = 1e9;
      for (const e of this.list) {
        const k = KIND[e.kind], cy = e.y - e.z - k.h / 2;
        if (Math.abs(x - e.x) <= k.w / 2 + 2 && Math.abs(y - cy) <= k.h / 2 + 2) { const d = S.dist(x, y, e.x, cy) - e.y * .01; if (d < bd) { bd = d; best = e; } }
      }
      return best;
    },
    eggAt(x, y) { return this.eggs.find(e => S.dist(x, y, e.x, e.y - 1) < 4); },
    hatch(egg) {
      this.eggs.splice(this.eggs.indexOf(egg), 1);
      S.fx.burst('spark', egg.x, egg.y - 2, 8, { col: '#fff6c8', speed: 26, life: .5 });
      if (this.list.filter(a => a.kind === 'chick').length < 10) this.spawn('chick', egg.x, egg.y, { vz: 30, z: 1 });
      sfx('peep');
    },
    poke(e) {
      if (e.state === 'sleep') { e.state = 'idle'; e.timer = 2; S.fx.add('bang', e.x, e.y - KIND[e.kind].h - 8, { vy: -6, life: .7, col: '#ffe066' }); }
      if (e.kind === 'sheep') { e.vz = 46; e.z = .1; sfx('baa'); S.fx.add('heart', e.x - 2, e.y - 16, { vy: -9, life: 1.2, col: '#ff6b8a' }); }
      else if (e.kind === 'hen') {
        e.vz = 40; e.z = .1; sfx('cluck'); this.wander(e, 1); e.fast = 1.5;
        if (Math.random() < .3 && this.eggs.length < 8) this.eggs.push({ x: e.x - e.dir * 3, y: e.y, t: 0 });
        S.fx.burst('spark', e.x, e.y - 5, 4, { col: '#fffaf0', speed: 18, life: .5, grav: .3 });
      } else if (e.kind === 'cow') { sfx('moo'); e.squash = 1; S.fx.add('heart', e.x + e.dir * 6, e.y - 18, { vy: -8, life: 1.4, col: '#ff6b8a' }); }
      else { e.vz = 34; e.z = .1; sfx('peep'); }
    },
    grab(e) { this.held = e; e.state = 'held'; e.vz = 0; sfx(e.kind === 'sheep' ? 'baa' : e.kind === 'cow' ? 'moo' : e.kind === 'hen' ? 'cluck' : 'peep', { pitch: 1.25 }); },
    drag(x, y) {
      const e = this.held; if (!e) return;
      const gy = S.clamp(y + 6, S.world.hz(x) + 3, st.H - 3);
      e.dir = x > e.x + .5 ? 1 : x < e.x - .5 ? -1 : e.dir;
      e.x += (x - e.x) * .5; e.y += (gy - e.y) * .5; e.z += (Math.max(8, gy - y + 6) - e.z) * .4;
    },
    release() {
      const e = this.held; if (!e) return; this.held = null;
      e.state = 'fall'; e.vz = 12;
      if (e.kind === 'hen' || e.kind === 'chick') { const p = S.world.L.pen; e.home = (e.x > p.x0 && e.x < p.x1 && e.y > p.y0 && e.y < p.y1) ? p : null; }
      if (e.anchor) e.anchor = { x: e.x, y: e.y };
    },

    wander(e, urgent) {
      const k = KIND[e.kind], wd = S.world;
      for (let i = 0; i < 12; i++) {
        let x, y;
        if (e.home) { x = S.rand(e.home.x0 + 5, e.home.x1 - 5); y = S.rand(e.home.y0 + 5, e.home.y1 - 3); }
        else if (st.rain > .5 && e.kind === 'sheep') { x = wd.L.tree.x + S.rand(-26, 26); y = wd.L.tree.y + S.rand(3, 14); }
        else { const c = e.anchor || e; x = c.x + S.rand(-k.roam, k.roam); y = c.y + S.rand(-k.roam * .4, k.roam * .4); }
        if (!wd.blocked(x, y)) { e.tx = x; e.ty = y; e.state = 'walk'; e.fast = urgent ? 1.6 : 1; return; }
      }
      e.state = 'idle'; e.timer = 1;
    },

    update(e, dt) {
      const k = KIND[e.kind], wd = S.world, night = st.day < .3;
      e.squash = Math.max(0, e.squash - dt * 4);
      if (e.state === 'held') return;
      if (e.z > 0 || e.vz > 0) {                       // no ar: cai
        e.vz -= 220 * dt; e.z += e.vz * dt;
        if (e.hop) { e.x += (e.hop.x - e.x) * dt * 5; e.y += (e.hop.y - e.y) * dt * 5; }
        if (e.z <= 0) {
          e.z = 0; e.vz = 0; e.squash = 1; e.hop = null; if (e.state === 'fall') { e.state = 'idle'; e.timer = S.rand(.6, 2); sfx('thud'); }
          if (wd.inPond(e.x, e.y)) {                   // caiu no lago: splash e pula pra margem
            const q = wd.L.pond, a = Math.atan2((e.y - q.y) / q.ry, (e.x - q.x) / q.rx);
            e.hop = { x: q.x + Math.cos(a) * (q.rx + 9), y: q.y + Math.sin(a) * (q.ry + 7) }; e.vz = 75; e.z = .1;
            S.fx.ripple(e.x, e.y, 1.6); S.fx.burst('drop', e.x, e.y - 2, 10, { col: '#a8dcf4', speed: 30, up: 45, life: .7, gy: e.y }); sfx('splash');
          } else S.fx.burst('puff', e.x, e.y, 3, { col: '#d6f08c', speed: 9, life: .35, s: .8 });
        }
        return;
      }
      if (night && e.state !== 'sleep' && e.state !== 'walk') { e.sleepy = (e.sleepy || 0) + dt; if (e.sleepy > 1.5 + e.ph * .4) e.state = 'sleep'; }
      if (!night) { e.sleepy = 0; if (e.state === 'sleep' && st.day > .45) { e.state = 'idle'; e.timer = S.rand(.2, 2); } }
      if (e.state === 'sleep') {
        e.zt -= dt; if (e.zt < 0) { e.zt = S.rand(1.4, 2.4); S.fx.add('z', e.x + 3, e.y - k.h - 3, { vy: -5, vx: 2, life: 1.8, col: '#cfd6ff' }); }
        return;
      }
      if (e.state === 'walk') {
        const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy), sp = k.speed * (e.fast || 1) * dt;
        if (d < 1 || wd.blocked(e.x + dx / d * 2, e.y + dy / d * 2)) { e.state = 'idle'; e.timer = S.rand(1, 5); e.peck = Math.random() < .6; }
        else { e.x += dx / d * sp; e.y += dy / d * sp * .7; if (Math.abs(dx) > .5) e.dir = dx > 0 ? 1 : -1; }
      } else { e.timer -= dt; if (e.timer < 0) this.wander(e); }
    },

    frame(e) {
      const walk = e.state === 'walk' && ((st.t * 7 + e.ph) | 0) & 1;
      if (e.kind === 'sheep') { const s = S.SPR.sheep[e.variant]; return e.state === 'held' || e.z > 2 ? s.held : e.state === 'sleep' ? s.sleep : walk ? s.b : s.a; }
      if (e.kind === 'hen') { const s = S.SPR.hen[e.variant]; return e.state === 'sleep' ? s.sleep : walk ? s.b : (e.state === 'idle' && e.peck && Math.sin(st.t * 7 + e.ph) > .2) ? s.peck : s.a; }
      if (e.kind === 'cow') return (e.state === 'idle' && Math.sin(st.t * .5 + e.ph) > -.3) ? S.SPR.cow.graze : S.SPR.cow.a;
      return S.SPR.chick;
    },

    collect(put, g, gg, dt) {
      for (const e of this.list) {
        this.update(e, dt);
        put(e.y + (e.state === 'held' ? 200 : 0), () => {
          const k = KIND[e.kind], sw = Math.max(2, k.w * .45 - e.z * .12) | 0;
          g.fillStyle = 'rgba(32,48,56,.28)'; g.fillRect(Math.round(e.x) - sw, Math.round(e.y), sw * 2, 1); g.fillRect(Math.round(e.x) - sw + 1, Math.round(e.y) + 1, sw * 2 - 2, 1);
          const dance = st.music && e.state !== 'sleep' && e.z <= 0 ? Math.round(st.beat * 2) : 0;
          const wig = e.state === 'held' ? Math.round(Math.sin(st.t * 18)) : 0;
          S.drawSpr(g, this.frame(e), e.x + wig, e.y - e.z - dance + Math.round(e.squash), e.dir < 0);
        });
      }
      this.eggs = this.eggs.filter(egg => {
        egg.t += dt; if (egg.t > 45) { this.hatch(egg); return false; }
        put(egg.y, () => { const w = egg.t > 38 && Math.sin(st.t * 30) > 0 ? 1 : 0; g.fillStyle = '#2a2440'; g.fillRect(egg.x - 2 + w, egg.y - 3, 4, 4); g.fillStyle = '#fff6e0'; g.fillRect(egg.x - 1 + w, egg.y - 3, 2, 3); g.fillStyle = '#e6d8c0'; g.fillRect(egg.x - 1 + w, egg.y - 1, 2, 1); });
        return true;
      });
      S.critters.collect(put, g, gg, dt);
    },
    drawFish(g, dt) { S.critters.drawFish(g, dt); },
  };
})();
