// GLSL kaynakları — PRISM CORE sahnesi.
// Tümü ShaderMaterial (GLSL1) içindir; renkler linear çalışma uzayında üretilir,
// tone mapping + sRGB dönüşümü composer'ın OutputPass'ı tarafından yapılır.

/** Ashima Arts 3D simplex noise (MIT). Çekirdek deformasyonu ve nebula için. */
export const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

/* ------------------------------------------------------------------ */
/* Çekirdek (kristal)                                                  */
/* ------------------------------------------------------------------ */

export const CORE_VERT = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uPulse;

varying vec3 vWorldPos;
varying float vNoise;
varying vec3 vObjPos;

${SIMPLEX_3D}

void main() {
  float t = uTime * 0.32;

  float n1 = snoise(position * uFreq + vec3(0.0, 0.0, t));
  float n2 = snoise(position * uFreq * 2.7 + vec3(t * 0.6, 0.0, 0.0));
  float n3 = snoise(position * uFreq * 5.3 - vec3(0.0, t * 0.45, 0.0));
  float d = n1 * 0.62 + n2 * 0.28 + n3 * 0.12;

  // Nefes alma: çekirdek yavaşça şişip söner.
  float breathe = 1.0 + 0.045 * sin(uTime * 0.9) + uPulse * 0.12;

  vNoise = d;
  vObjPos = position;

  vec3 displaced = (position + normal * d * uAmp) * breathe;
  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = world.xyz;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const CORE_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorHot;
uniform float uIntensity;

varying vec3 vWorldPos;
varying float vNoise;
varying vec3 vObjPos;

void main() {
  // Faset normali: türevlerden üretilir, düz yüzeyli kristal görünümü verir.
  vec3 N = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  vec3 V = normalize(cameraPosition - vWorldPos);
  if (dot(N, V) < 0.0) N = -N;

  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.1);

  vec3 keyDir = normalize(vec3(0.45, 0.75, 0.55));
  vec3 fillDir = normalize(vec3(-0.7, -0.2, 0.4));
  float key = clamp(dot(N, keyDir), 0.0, 1.0);
  float fill = clamp(dot(N, fillDir), 0.0, 1.0);

  float band = clamp(vNoise * 0.5 + 0.5, 0.0, 1.0);
  vec3 base = mix(uColorDeep, uColorMid, band);

  // İç enerji damarları — gürültü çizgileri boyunca akan sıcak ışık.
  float veins = smoothstep(0.55, 0.95, abs(sin(vNoise * 7.0 + uTime * 0.8)));

  vec3 col = base * (0.35 + 0.75 * key + 0.25 * fill);
  // Sıcak vurgu yalnızca ışığa bakan dar bir açıklıkta — gövde rengini yıkamasın.
  col += uColorHot * pow(key, 14.0) * 0.9 * uIntensity;
  col += mix(uColorMid, uColorHot, 0.35) * veins * 0.22 * uIntensity;
  col += uColorMid * fres * 0.85;

  col *= 0.94 + 0.1 * sin(uTime * 1.6 + vNoise * 3.5);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Atmosfer kabuğu (halo)                                              */
/* ------------------------------------------------------------------ */

export const GLOW_VERT = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormalW;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const GLOW_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uPower;
uniform float uStrength;
uniform float uTime;

varying vec3 vWorldPos;
varying vec3 vNormalW;

void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);
  // Kabuk BackSide çizilir: silüete yaklaştıkça (N ⟂ V) parlayan bir hale,
  // merkeze doğru sönen bir alan. abs(), ön/arka yüz ayrımını gereksiz kılar.
  float edge = 1.0 - abs(dot(normalize(vNormalW), V));
  float rim = pow(clamp(edge, 0.0, 1.0), uPower);
  // Kenardaki keskin geçişi yumuşat — kabuk bir cam küre gibi okunmasın.
  rim *= smoothstep(1.0, 0.55, edge);
  float flicker = 0.9 + 0.1 * sin(uTime * 2.1);
  gl_FragColor = vec4(uColor * rim * uStrength * flicker, rim);
}
`;

export const HALO_VERT = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HALO_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColorInner;
uniform vec3 uColorOuter;
uniform float uStrength;
uniform float uTime;

varying vec2 vUv;

void main() {
  float r = length(vUv - 0.5) * 2.0;
  if (r > 1.0) discard;

  // İki katmanlı düşüş: sıkı bir çekirdek parıltısı + geniş, yumuşak bir hale.
  float inner = pow(clamp(1.0 - r * 1.9, 0.0, 1.0), 2.4);
  float outer = pow(clamp(1.0 - r, 0.0, 1.0), 3.2);
  float pulse = 0.92 + 0.08 * sin(uTime * 1.15);

  vec3 col = uColorInner * inner * 1.3 + uColorOuter * outer;
  gl_FragColor = vec4(col * uStrength * pulse, (inner + outer) * 0.9);
}
`;

/* ------------------------------------------------------------------ */
/* Yörünge parçacıkları (instanced kristal kırıkları)                  */
/* ------------------------------------------------------------------ */

export const SHARD_VERT = /* glsl */ `
uniform float uTime;
uniform float uSpread;

// x: yarıçap, y: açısal hız, z: faz, w: ölçek
attribute vec4 aSeed;
// x: eğim, y: yükseliş (yaw), z: dikey salınım genliği
attribute vec3 aTilt;

varying float vFade;
varying float vShade;

mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

void main() {
  float ang = aSeed.z + uTime * aSeed.y;
  float radius = aSeed.x * uSpread;

  vec3 orbit = vec3(cos(ang) * radius, sin(ang * 1.7 + aSeed.z) * aTilt.z, sin(ang) * radius);
  mat3 tilt = rotY(aTilt.y) * rotX(aTilt.x);
  vec3 center = tilt * orbit;

  // Parça kendi ekseninde de döner.
  mat3 spin = rotY(uTime * aSeed.y * 3.1 + aSeed.z) * rotX(uTime * aSeed.y * 2.3);
  vec3 local = spin * position * aSeed.w;

  vec4 world = modelMatrix * vec4(center + local, 1.0);
  vec4 mv = viewMatrix * world;

  // Uzaktakiler sönümlensin, çekirdeğe yakın olanlar parlasın.
  vFade = smoothstep(9.0, 2.0, -mv.z);
  vShade = clamp(1.0 - (radius - 1.6) / 3.2, 0.15, 1.0);

  gl_Position = projectionMatrix * mv;
}
`;

export const SHARD_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uIntensity;

varying float vFade;
varying float vShade;

void main() {
  vec3 col = mix(uColorA, uColorB, vShade);
  gl_FragColor = vec4(col * (0.35 + vShade) * uIntensity, vFade * 0.9);
}
`;

/* ------------------------------------------------------------------ */
/* Yörünge halkaları                                                   */
/* ------------------------------------------------------------------ */

export const RING_VERT = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const RING_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  // Halka boyunca dolaşan ışık izi.
  float head = fract(uTime * uSpeed);
  float d = abs(fract(vUv.x - head + 0.5) - 0.5);
  float streak = smoothstep(0.16, 0.0, d);

  // Uçları yumuşat (yay parçaları için).
  float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);

  float a = (0.28 + streak * 1.5) * uOpacity * ends;
  gl_FragColor = vec4(uColor * (0.6 + streak * 2.2), a);
}
`;

/* ------------------------------------------------------------------ */
/* Yıldız alanı                                                        */
/* ------------------------------------------------------------------ */

export const STARS_VERT = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aPhase;

varying float vTwinkle;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vTwinkle = 0.55 + 0.45 * sin(uTime * 1.3 + aPhase * 6.28318);
  gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mv.z, 0.1));
  gl_Position = projectionMatrix * mv;
}
`;

export const STARS_FRAG = /* glsl */ `
precision highp float;

uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vTwinkle;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  vec3 col = mix(uColorA, uColorB, vTwinkle);
  gl_FragColor = vec4(col * vTwinkle, a * vTwinkle);
}
`;

/* ------------------------------------------------------------------ */
/* Nebula arka planı (iç yüzü boyanmış dev küre)                       */
/* ------------------------------------------------------------------ */

export const NEBULA_VERT = /* glsl */ `
varying vec3 vDir;

void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const NEBULA_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uStrength;

varying vec3 vDir;

${SIMPLEX_3D}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 p = vDir * 1.4 + vec3(0.0, 0.0, uTime * 0.012);
  float n = fbm(p) * 0.5 + 0.5;
  float n2 = fbm(p * 2.1 + 11.3) * 0.5 + 0.5;

  float cloud = pow(clamp(n * n2 * 1.8, 0.0, 1.0), 2.2);
  vec3 col = mix(uColorA, uColorB, clamp(n2, 0.0, 1.0)) * cloud;

  // Merkez bandı biraz daha yoğun — ekvatoral toz.
  col *= 0.55 + 0.45 * (1.0 - abs(vDir.y));

  gl_FragColor = vec4(col * uStrength, 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Final geçişi: vinyet + film grenii + hafif kromatik sapma           */
/* ------------------------------------------------------------------ */

export const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as unknown },
    uTime: { value: 0 },
    uVignette: { value: 1.05 },
    uGrain: { value: 0.055 },
    uAberration: { value: 0.0016 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;

    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 dir = vUv - 0.5;
      float r = length(dir);

      // Kenarlara doğru artan kromatik sapma.
      vec2 off = dir * uAberration * r;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;

      // Vinyet.
      col *= smoothstep(1.15, 0.25, r * uVignette);

      // Gren.
      float g = hash(vUv * 1024.0 + fract(uTime) * 91.7) - 0.5;
      col += g * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
