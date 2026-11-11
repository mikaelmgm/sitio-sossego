// Sítio Sossego — sprites dos bichos (mapas de texto, todos virados para a direita)
'use strict';
(() => {
  const INK = '#2a2440';

  // ---------- ovelha ----------
  const sheepMaps = {
    a: [
      '...wwwww.....',
      '..wwwwwwwff..',
      '.wwwwwwwwfef.',
      '.wwwwwwwwfff.',
      '.wwwwwwwwwf..',
      '.swwwwwwww...',
      '..sswwwss....',
      '..l..l.l..l..',
      '..l..l.l..l..',
    ],
    b: [
      '.............',
      '...wwwww.....',
      '..wwwwwwwff..',
      '.wwwwwwwwfef.',
      '.wwwwwwwwfff.',
      '.wwwwwwwwwf..',
      '.swwwwwwww...',
      '..sswwwss....',
      '...ll...ll...',
    ],
    sleep: [
      '.............',
      '.............',
      '...wwwww.....',
      '..wwwwwwww...',
      '.wwwwwwwwwff.',
      '.wwwwwwwwfcf.',
      '.swwwwwwwwff.',
      '..sswwwwss...',
      '.............',
    ],
    held: [
      '...wwwww.....',
      '..wwwwwwwff..',
      '.wwwwwwwwfEf.',
      '.wwwwwwwwfff.',
      '.wwwwwwwwwf..',
      '.swwwwwwww...',
      '..sswwwss....',
      '.l..l...l..l.',
      '.l..l...l..l.',
    ],
  };
  const sheepPals = {
    white: { w: '#fff6e8', s: '#dfd0c4', f: '#4a3f55', e: '#ffffff', E: '#ffffff', c: '#8f84a0', l: '#4a3f55' },
    black: { w: '#5a5068', s: '#463d54', f: '#e9dccb', e: '#2a2440', E: '#2a2440', c: '#a89a8c', l: '#e9dccb' },
    pink:  { w: '#ffd3e0', s: '#f0b0c6', f: '#6b4a66', e: '#ffffff', E: '#ffffff', c: '#b08aa8', l: '#6b4a66' },
    mint:  { w: '#d6f5e3', s: '#b0dcc6', f: '#3f5560', e: '#ffffff', E: '#ffffff', c: '#8aa8a8', l: '#3f5560' },
  };

  // ---------- galinha ----------
  const henMaps = {
    a: [
      '.....r..',
      '....www.',
      '....wkwo',
      'w..wwww.',
      'wwwwwww.',
      '.wwswww.',
      '..wwww..',
      '...o.o..',
    ],
    b: [
      '.....r..',
      '....www.',
      '....wkwo',
      'w..wwww.',
      'wwwwwww.',
      '.wwswww.',
      '..wwww..',
      '..o...o.',
    ],
    peck: [
      '........',
      'w.......',
      'ww.www..',
      '.wwwwwr.',
      '.wwswwww',
      '..wwwwkw',
      '...o.o.o',
      '........',
    ],
    sleep: [
      '........',
      '........',
      '....r...',
      '...www..',
      'w.wwcwo.',
      'wwwwwww.',
      '.wwswww.',
      '..wwww..',
    ],
  };
  const henPals = {
    white: { w: '#fffaf0', s: '#e6dccf', r: '#e2504c', k: INK, c: '#9a8f8a', o: '#f2a23a' },
    brown: { w: '#c98a5a', s: '#a56c44', r: '#e2504c', k: INK, c: '#6b4630', o: '#f2a23a' },
    gray:  { w: '#b9b6c8', s: '#9794aa', r: '#e2504c', k: INK, c: '#5f5c72', o: '#f2a23a' },
  };
  const chickMap = ['.yy.', 'ykyo', 'yyy.', '.o..'];

  // ---------- vaca ----------
  const cowMaps = {
    a: [
      '...............h..h...',
      '..wwwwwwwwwwww.wwww...',
      '.wwbbbwwwwwbbwwwwkww..',
      'twwbbbbwwwbbbwwwwwwpp.',
      'twwwbbwwwwwbbwwwwwwpp.',
      't.wwwwwwwwwwwwwwwww...',
      '..wwwwwwwwwwwwww......',
      '..wwwwwwuuwwwww.......',
      '..ww.ww..u.ww.ww......',
      '..ww.ww....ww.ww......',
      '..dd.dd....dd.dd......',
    ],
    graze: [
      '......................',
      '..wwwwwwwwwwww........',
      '.wwbbbwwwwwbbwww......',
      'twwbbbbwwwbbbwwww.....',
      'twwwbbwwwwwbbwwwwh.h..',
      't.wwwwwwwwwwwwwwwwww..',
      '..wwwwwwwwwwwwwwwkww..',
      '..wwwwwwuuwwwww.wwww..',
      '..ww.ww..u.ww.ww.wpp..',
      '..ww.ww....ww.ww..pp..',
      '..dd.dd....dd.dd......',
    ],
  };
  const cowPal = { w: '#fff6e8', b: '#8a5a44', k: INK, p: '#f4a6a6', h: '#e8d8b0', t: '#8a5a44', u: '#f4a6a6', d: '#4a3f55' };

  // ---------- pato, gato, coruja ----------
  const duckMap = [
    '......ww.',
    '.....wkwo',
    'w....www.',
    'wwwwwwww.',
    '.wwswwww.',
    '..wwwww..',
  ];
  const catMaps = {
    a: ['.b..b.', '.bbbb.', '.ybyb.', '.bbbb.', '..bbb.', '.bbbbt', '.bbbbt', '.b.bb.'],
    b: ['.b..b.', '.bbbb.', '.bbbb.', '.bbbb.', '..bbb.', 'tbbbb.', 't.bbb.', '.b.bb.'],
  };
  const owlMaps = {
    a: ['b...b', 'bbbbb', 'bYbYb', 'bbobb', 'bcccb', '.b.b.'],
    b: ['b...b', 'bbbbb', 'bbbbb', 'bbobb', 'bcccb', '.b.b.'],
  };

  S.buildSprites = () => {
    const build = (maps, pal) => Object.fromEntries(Object.entries(maps).map(([k, m]) => [k, S.sprite(m, pal)]));
    S.SPR = {
      sheep: Object.fromEntries(Object.entries(sheepPals).map(([k, p]) => [k, build(sheepMaps, p)])),
      hen: Object.fromEntries(Object.entries(henPals).map(([k, p]) => [k, build(henMaps, p)])),
      chick: S.sprite(chickMap, { y: '#ffe07a', k: INK, o: '#f2a23a' }),
      cow: build(cowMaps, cowPal),
      duck: S.sprite(duckMap, { w: '#fffaf0', s: '#e0d6cc', k: INK, o: '#f2a23a' }),
      cat: build(catMaps, { b: '#4a4458', y: '#ffd84a', t: '#4a4458' }),
      owl: build(owlMaps, { b: '#8a6a52', Y: '#ffd84a', o: '#f2a23a', c: '#d8c2a0' }),
    };
  };
  S.drawSpr = (g, spr, x, y, flip) => g.drawImage(flip ? spr.l : spr.r, Math.round(x - spr.w / 2), Math.round(y - spr.h + 1));
})();
