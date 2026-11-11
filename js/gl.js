// Sítio Sossego — WebGL2: (A) iluminação da cena em baixa resolução, (B) tela cheia com botões de vidro
'use strict';
(() => {
  const st = S.st;
  const VS = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;

  // Passo A: compõe céu + mundo iluminado + brilhos. Metade esquerda = hora atual, direita = dia pleno
  const FA = `#version 300 es
precision highp float;
uniform sampler2D uSky, uLit, uGlow;
uniform vec2 uScene; uniform float uDay, uRain; uniform int uLN;
uniform vec4 uLP[16]; uniform vec3 uLC[16];
out vec4 o;
const float B[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
void main(){
  vec2 sp = floor(gl_FragCoord.xy); float day = uDay;
  if (sp.x >= uScene.x) { sp.x -= uScene.x; day = 1.; }
  ivec2 ip = ivec2(sp);
  vec3 sky = texelFetch(uSky, ip, 0).rgb; vec4 lit = texelFetch(uLit, ip, 0); vec4 glw = texelFetch(uGlow, ip, 0);
  ivec2 bi = ip & 3; float b = (B[bi.y * 4 + bi.x] + .5) / 16.;
  float dq = clamp(floor(day * 12. + b) / 12., 0., 1.);
  vec3 amb = mix(vec3(.26, .30, .62), vec3(1., .74, .70), smoothstep(0., .55, dq));
  amb = mix(amb, vec3(1.), smoothstep(.45, 1., dq));
  amb *= 1. - uRain * .2 * dq;
  vec3 L = vec3(0.);
  for (int i = 0; i < 16; i++) { if (i >= uLN) break;
    float f = clamp(1. - distance(sp + .5, uLP[i].xy) / uLP[i].z, 0., 1.);
    L += uLC[i] * (floor(f * f * 5. + b) / 5.) * uLP[i].w; }
  vec3 c = lit.rgb * (amb + L * (1. - dq * .82));
  c = sky * (1. - lit.a) + c;
  o = vec4(c * (1. - glw.a) + glw.rgb * (1. - .25 * day), 1.);
}`;

  // Passo B: amplia sem suavizar e desenha molduras + botões de vidro/geleia
  const FB = `#version 300 es
precision highp float;
uniform sampler2D uComp, uUi;
uniform vec2 uRes, uScene; uniform float uScale, uUs, uDay;
uniform vec4 uCB[4], uCK[4], uCA[4], uCP[4];
out vec4 o;
float sdPill(vec2 q, vec2 h){ float r = min(h.x, h.y); vec2 d = abs(q) - h + r; return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r; }
float sdCap(vec2 q, vec2 r){ float h = max(r.y - r.x, 0.); q.y -= clamp(q.y, -h, h); return length(q) - r.x; }
vec3 scene(vec2 p, float full){
  vec2 sp = clamp(floor(p / uScale), vec2(0.), uScene - 1.);
  return texelFetch(uComp, ivec2(sp.x + full * uScene.x, sp.y), 0).rgb;
}
// tudo que fica por baixo do vidro: cena, sombras, moldura de plástico e trilho em pixel art
vec3 under(vec2 p, float full, float ksh){
  vec3 c = scene(p, full);
  float th = smoothstep(.3, .7, mix(uDay, 1., full)), u = uUs;
  for (int i = 0; i < 4; i++) {
    vec4 b = uCB[i]; if (b.z <= 0.) continue;
    vec2 q = p - b.xy; float d = sdPill(q, b.zw);
    c *= 1. - .42 * (1. - smoothstep(-2. * u, 7. * u, sdPill(q - vec2(0., 2.5 * u), b.zw)));
    if (d < 1.) {
      float v = q.y / b.w;
      vec3 pl = mix(vec3(.20, .20, .28), vec3(.975, .965, .94), th) * (1. - .09 * v);
      pl += smoothstep(-1.7 * u, -.2 * u, d) * mix(-.15, .13, smoothstep(.35, -.35, v));
      vec2 t2 = b.zw - 2. * u; float d2 = sdPill(q, t2);
      if (d2 < 1.) {
        vec4 a = uCA[i];
        vec2 ap = clamp(floor((q + t2) / u), vec2(0.), a.zw - 1.);
        vec3 tc = texelFetch(uUi, ivec2(a.xy + ap), 0).rgb;
        tc *= 1. - .5 * smoothstep(2.4 * u, 0., -d2) * smoothstep(.5, -1., v);   // sombra interna no topo
        tc *= 1. - .22 * smoothstep(1.1 * u, 0., -d2);
        pl = mix(pl, tc, 1. - smoothstep(-1., 1., d2));
      }
      c = mix(c, pl, 1. - smoothstep(-1., 1., d));
    }
    vec4 k = uCK[i];
    c *= 1. - ksh * .34 * (1. - smoothstep(-1. * u, 4.5 * u, sdCap(p - k.xy - vec2(1.2 * u, 2.4 * u), k.zw)));
  }
  return c;
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 c = under(p, 0., 1.);
  float th = smoothstep(.3, .7, uDay);
  for (int i = 0; i < 4; i++) {
    vec4 k = uCK[i]; if (k.z <= 0.) continue;
    vec4 cp = uCP[i];
    vec2 q = p - k.xy; q.x += q.y * cp.x;                 // tremor = cisalhamento
    vec2 s = cp.yz, qs = q / s, qq = qs;                  // esticar/achatar mantendo o volume
    float h0 = max(k.w - k.z, 0.); qq.y -= clamp(qq.y, -h0, h0);
    float ms = min(s.x, s.y), d = (length(qq) - k.z) * ms;
    if (d < 1.) {
      float h = clamp(-d / (k.z * ms), 0., 1.), rim = 1. - h, bend = rim * rim * rim;
      vec2 n = length(qq) > .001 ? normalize(qq) : vec2(0.);
      float full = cp.w < .5 ? 1. : 0.;                   // o vidro do interruptor carrega a manhã
      vec2 base = k.xy + (p - k.xy) / 1.28 + n * bend * k.z * .62;
      float ca = bend * 2.4 * uUs + .7;
      vec3 g = vec3(under(base + n * ca, full, 0.).r, under(base, full, 0.).g, under(base - n * ca, full, 0.).b);
      g *= 1. - .30 * smoothstep(.60, .88, rim) * (1. - smoothstep(.90, 1., rim));   // faixa escura de refração
      g += .5 * smoothstep(.86, 1., rim) * (.55 - .5 * n.y - .25 * n.x);              // borda brilhante
      g = mix(g, mix(vec3(.72, .76, 1.), vec3(.88, .97, 1.), th), .08 + .22 * rim * rim); // tinta de Fresnel
      vec2 e = qs / k.zw;
      float streak = exp(-pow((e.x + .42) / .17, 2.) - pow((e.y + .34) / .40, 2.));
      float spot = exp(-pow((e.x - .40) / .14, 2.) - pow((e.y - .62) / .09, 2.));
      float foot = exp(-pow(e.x / .5, 2.) - pow((e.y - .78) / .16, 2.));
      g += streak * .6 + spot * .8 + vec3(1., .9, .7) * foot * .2;
      c = mix(c, g, 1. - smoothstep(-1., 1., d));
    }
  }
  o = vec4(c, 1.);
}`;

  S.gfx = {
    init(canvas) {
      const gl = this.gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL2 indisponível');
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const prog = fs => {
        const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
        gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[name] = gl.getUniformLocation(p, name); }
        return { p, u };
      };
      this.A = prog(FA); this.B = prog(FB);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      this.tex = [0, 1, 2, 3, 4].map(() => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; });
      this.fbo = gl.createFramebuffer();
    },
    resize() {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.tex[4]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, st.W * 2, st.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex[4], 0);
    },
    upload(i, cv) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, this.tex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); },

    render(ui) {
      const gl = this.gl, wd = S.world, A = this.A, B = this.B, cv = gl.canvas, L = (S.lights || []).slice(0, 16);
      this.upload(0, wd.sky); this.upload(1, wd.lit); this.upload(2, wd.glow); this.upload(3, ui.atlas);
      // A
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, st.W * 2, st.H); gl.useProgram(A.p);
      gl.uniform1i(A.u.uSky, 0); gl.uniform1i(A.u.uLit, 1); gl.uniform1i(A.u.uGlow, 2);
      gl.uniform2f(A.u.uScene, st.W, st.H); gl.uniform1f(A.u.uDay, st.day); gl.uniform1f(A.u.uRain, st.rain); gl.uniform1i(A.u.uLN, L.length);
      if (L.length) { gl.uniform4fv(A.u.uLP, L.flatMap(l => [l[0], l[1], l[2], l[3]])); gl.uniform3fv(A.u.uLC, L.flatMap(l => [l[4], l[5], l[6]])); }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // B
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height); gl.useProgram(B.p);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.tex[4]);
      gl.uniform1i(B.u.uComp, 4); gl.uniform1i(B.u.uUi, 3);
      gl.uniform2f(B.u.uRes, cv.width, cv.height); gl.uniform2f(B.u.uScene, st.W, st.H);
      gl.uniform1f(B.u.uScale, st.scale); gl.uniform1f(B.u.uUs, ui.us); gl.uniform1f(B.u.uDay, st.day);
      gl.uniform4fv(B.u.uCB, ui.cb); gl.uniform4fv(B.u.uCK, ui.ck); gl.uniform4fv(B.u.uCA, ui.ca); gl.uniform4fv(B.u.uCP, ui.cp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
})();
