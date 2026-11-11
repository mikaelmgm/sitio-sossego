// Sítio Sossego — construções e objetos (sprites assados com contorno e luz/sombra)
'use strict';
(() => {
  S.buildProps = () => {
    const P = S.PROP = {};

    // ---------- cabana (84x72, apoio em 42,70) ----------
    P.cabin = S.stamp(84, 72, p => {
      // chaminé de pedra
      p.rect(57, 6, 10, 18, '#b9b6c8'); p.rect(56, 5, 12, 3, '#8f8ca6');
      p.px(59, 11, '#8f8ca6'); p.px(63, 15, '#8f8ca6'); p.px(60, 19, '#dcdaea'); p.px(64, 10, '#dcdaea');
      // paredes de tora
      p.rect(11, 40, 62, 28, '#bb845c');
      for (let y = 43; y < 68; y += 4) p.rect(11, y, 62, 1, '#9a6a48');
      for (let y = 41; y < 68; y += 4) p.rect(11, y, 62, 1, '#cf9a70');
      p.rect(11, 40, 3, 28, '#a67450'); p.rect(70, 40, 3, 28, '#a67450');
      // telhado com telhas
      p.poly([[4, 43], [20, 17], [64, 17], [80, 43]], '#cc5a4e');
      for (let y = 21; y < 43; y += 4) for (let x = 4; x < 80; x++) if (p.get(x, y) && p.get(x, y - 1)) p.px(x, y, (x + y) % 6 < 5 ? '#a8433c' : '#cc5a4e');
      p.rect(20, 17, 44, 2, '#e8806c'); p.rect(4, 42, 76, 2, '#8e3a36');
      // janelas (o brilho quente à noite vem da camada de luz)
      for (const x of [17, 53]) {
        p.rect(x, 47, 14, 12, '#f6e8c6'); p.rect(x + 1, 48, 12, 10, '#7ab8d8');
        p.rect(x + 1, 48, 12, 3, '#a6d6ee'); p.rect(x + 6, 48, 2, 10, '#f6e8c6'); p.rect(x + 1, 52, 12, 1, '#f6e8c6');
        p.rect(x - 1, 59, 16, 2, '#e0cfa6');
      }
      // floreira
      p.rect(16, 61, 16, 3, '#8a5f44');
      for (let i = 0; i < 5; i++) { p.px(18 + i * 3, 60, '#58a84c'); p.px(18 + i * 3, 59, i & 1 ? '#ff8fb0' : '#ffd84a'); }
      // porta
      p.rect(36, 49, 12, 19, '#3f7f92'); p.rect(37, 50, 10, 8, '#5aa0b0'); p.rect(37, 60, 10, 7, '#5aa0b0');
      p.px(45, 59, '#ffd84a'); p.rect(35, 48, 14, 1, '#f6e8c6');
      // degrau e lenha
      p.rect(33, 68, 18, 2, '#d8c8a0');
      for (let i = 0; i < 3; i++) { p.ellipse(77, 67 - i * 3, 3, 2, '#9a6a48'); p.px(77, 67 - i * 3, '#e0b888'); }
      // lanterna ao lado da porta
      p.rect(50, 52, 3, 4, '#ffe08a'); p.rect(50, 51, 3, 1, '#4a3f55');
    });
    P.cabinAnchor = { x: 42, y: 70, win: [[17, 47], [53, 47]], chim: [62, 4], lamp: [51, 54], door: [42, 68] };

    // ---------- galinheiro (30x30, apoio 15,28) ----------
    P.coop = S.stamp(30, 30, p => {
      p.rect(6, 22, 2, 6, '#7a5440'); p.rect(22, 22, 2, 6, '#7a5440');
      p.rect(4, 10, 22, 13, '#dc5c50');
      for (let x = 7; x < 26; x += 4) p.rect(x, 10, 1, 13, '#bb463e');
      p.poly([[1, 11], [15, 1], [29, 11]], '#7a5a4a'); p.rect(1, 10, 28, 2, '#5f4438');
      p.poly([[5, 9], [15, 2], [25, 9]], '#96705c');
      p.ellipse(15, 18, 4, 5, '#3a2c38'); p.rect(11, 18, 8, 5, '#3a2c38');
      p.rect(10, 12, 10, 1, '#f6e8c6'); p.rect(4, 22, 22, 1, '#f6e8c6');
      p.line(12, 23, 8, 28, '#c9a070'); p.line(13, 23, 9, 28, '#c9a070'); p.line(14, 23, 10, 28, '#e0b888');
    });

    // ---------- árvore: tronco (com galho do balanço) e copa ----------
    P.trunk = S.stamp(60, 70, p => {
      p.poly([[24, 69], [27, 30], [35, 30], [38, 69]], '#7a5440');
      p.poly([[21, 69], [25, 60], [37, 60], [41, 69]], '#7a5440');
      p.poly([[33, 40], [56, 31], [57, 34], [34, 46]], '#7a5440');      // galho
      p.rect(28, 34, 2, 30, '#96705c'); p.px(33, 50, '#5f4438'); p.px(32, 51, '#5f4438'); p.px(30, 58, '#5f4438');
    });
    P.trunkAnchor = { x: 31, y: 68, rope: [[48, 35], [55, 33]] };
    P.crown = S.stamp(92, 66, p => {
      const blobs = [[46, 36, 30, 20], [24, 40, 18, 14], [68, 40, 18, 14], [34, 24, 20, 15], [58, 22, 20, 15], [46, 14, 16, 11]];
      for (const [x, y, rx, ry] of blobs) p.ellipse(x, y, rx, ry, '#4f9a52');
      for (const [x, y, rx, ry] of blobs) p.ellipse(x - 2, y - 3, rx * .78, ry * .7, '#62b24c');
      for (const [x, y, rx, ry] of blobs) p.ellipse(x - 4, y - 6, rx * .45, ry * .38, '#84c955');
      const r = S.rng(3);
      for (let i = 0; i < 70; i++) { const x = 8 + r() * 76 | 0, y = 6 + r() * 50 | 0; if (p.get(x, y)) p.px(x, y, r() < .5 ? '#a2d962' : '#3f8a44'); }
      for (const [x, y] of [[20, 44], [38, 50], [62, 46], [74, 36], [50, 30], [30, 30]]) { p.rect(x, y, 3, 3, '#e2504c'); p.px(x, y, '#ff8a80'); p.px(x + 1, y - 1, '#5f4438'); }
    }, '#2f6f44');

    // ---------- moinho (torre), espantalho, feno, cerca ----------
    P.mill = S.stamp(18, 28, p => {
      p.poly([[4, 27], [6, 8], [12, 8], [14, 27]], '#f6ecd8');
      p.poly([[5, 9], [9, 2], [13, 9]], '#cc5a4e');
      p.rect(8, 20, 3, 7, '#7a5440'); p.rect(8, 13, 2, 3, '#7ab8d8'); p.rect(11, 10, 2, 17, '#dccfb6');
    });
    P.scare = S.stamp(20, 24, p => {
      p.rect(9, 8, 2, 16, '#7a5440'); p.rect(2, 10, 16, 2, '#7a5440');
      p.rect(6, 9, 8, 8, '#d8584e'); p.rect(6, 12, 8, 1, '#f6e8c6'); p.rect(9, 9, 1, 8, '#f6e8c6');
      p.rect(7, 4, 6, 5, '#f2d9a0'); p.px(8, 6, '#2a2440'); p.px(11, 6, '#2a2440'); p.px(9, 7, '#e2504c'); p.px(10, 7, '#e2504c');
      p.rect(4, 3, 12, 1, '#c9a050'); p.rect(7, 0, 6, 3, '#e0b860');
      p.px(1, 11, '#f2d070'); p.px(18, 11, '#f2d070'); p.px(1, 12, '#f2d070'); p.px(18, 10, '#f2d070');
    });
    P.hay = S.stamp(16, 12, p => {
      p.ellipse(8, 6, 7, 5, '#f2d070');
      for (let y = 3; y < 10; y += 2) p.rect(3, y, 10, 1, '#d8b450');
      p.rect(7, 1, 2, 10, '#c9a050');
    });
    P.fence = w => S.stamp(w, 9, p => {
      p.rect(0, 3, w, 1, '#f0e2bc'); p.rect(0, 6, w, 1, '#f0e2bc');
      for (let x = 1; x < w - 1; x += 7) { p.rect(x, 1, 2, 8, '#f6ecd0'); p.px(x + 1, 8, '#c9b48a'); }
    }, '#6b5a4a', 1, .86);
    P.post = S.stamp(4, 22, p => { p.rect(1, 1, 2, 20, '#8a6248'); p.rect(0, 1, 4, 1, '#8a6248'); });
  };
})();
