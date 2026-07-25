import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import {
  CORE_FRAG,
  CORE_VERT,
  GLOW_FRAG,
  GLOW_VERT,
  HALO_FRAG,
  HALO_VERT,
  GRADE_SHADER,
  NEBULA_FRAG,
  NEBULA_VERT,
  RING_FRAG,
  RING_VERT,
  SHARD_FRAG,
  SHARD_VERT,
  STARS_FRAG,
  STARS_VERT,
} from "./shaders";
import {
  DEFAULT_PARAMS,
  PRESET_BY_ID,
  type PrismParams,
  type PrismStats,
} from "./presets";

const SHARD_COUNT = 320;
const STAR_COUNT = 2600;
/** Ikosahedron alt bölünmesi — HUD'daki GEOMETRY etiketi de bunu okur. */
const CORE_DETAIL = 12;

/** Deterministik PRNG — her yeniden yüklemede aynı yıldız alanı çıksın diye. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type EngineOptions = {
  params?: PrismParams;
  reducedMotion?: boolean;
  onStats?: (stats: PrismStats) => void;
  onContextLost?: () => void;
};

/**
 * Sahnenin tamamı — React'ten bağımsız. Parametreler `setParams` ile
 * güncellenir, ölçümler `onStats` ile ~4 Hz raporlanır.
 */
export class PrismEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  // THREE.Clock r184'te deprecate edildi; Timer ayrıca Page Visibility API ile
  // sekmeden dönüşteki dev delta sıçramasını kendisi bastırıyor.
  private timer = new THREE.Timer();

  private core!: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>;
  private halo!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private bloomSprite!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private shards!: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private stars!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private nebula!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private rings: THREE.Mesh<THREE.TorusGeometry, THREE.ShaderMaterial>[] = [];
  private rig = new THREE.Group();

  private params: PrismParams;
  private reducedMotion: boolean;
  private onStats?: (stats: PrismStats) => void;
  private onContextLost?: () => void;

  private frameId = 0;
  private running = false;
  private disposed = false;

  // Zaman: hız parametresiyle ölçeklendiği için ayrı biriktiriyoruz.
  private simTime = 0;
  private pulse = 0;

  // Kamera hedefleri (yumuşatmalı yörünge kontrolü).
  private azimuth = 0.6;
  private polar = Math.PI / 2 - 0.12;
  private distance = 7.8;
  private targetAzimuth = 0.6;
  private targetPolar = Math.PI / 2 - 0.12;
  private targetDistance = 7.8;
  private pointer = new THREE.Vector2();
  private pointerTarget = new THREE.Vector2();
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private activePointerId: number | null = null;

  // Ölçüm.
  private fpsFrames = 0;
  private fpsAccum = 0;
  private resizeObserver?: ResizeObserver;

  constructor(canvas: HTMLCanvasElement, options: EngineOptions = {}) {
    this.canvas = canvas;
    this.params = { ...DEFAULT_PARAMS, ...options.params };
    this.reducedMotion = options.reducedMotion ?? false;
    this.onStats = options.onStats;
    this.onContextLost = options.onContextLost;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.setClearColor(0x03030a, 1);
    // Composer kare başına birden fazla render yapar; sayaçları kare sonunda
    // toplu okuyabilmek için otomatik sıfırlamayı kapatıyoruz.
    this.renderer.info.autoReset = false;

    const { clientWidth: w, clientHeight: h } = canvas;
    this.camera = new THREE.PerspectiveCamera(
      42,
      Math.max(w, 1) / Math.max(h, 1),
      0.1,
      400,
    );
    this.camera.position.set(0, 0, this.distance);

    this.scene.add(this.rig);

    this.buildNebula();
    this.buildStars();
    this.buildCore();
    this.buildHalo();
    this.buildBloomSprite();
    this.buildRings();
    this.buildShards();

    // ---- post-processing -------------------------------------------------
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.max(w, 1), Math.max(h, 1)),
      this.bloomStrength(),
      0.62,
      0.6,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    // Gren ve vinyet, tone mapping sonrası görüntü uzayında uygulanır.
    this.grade = new ShaderPass(GRADE_SHADER);
    this.composer.addPass(this.grade);

    this.timer.connect(document);

    this.applyPalette();
    this.applyParams();
    this.resize();

    this.bindEvents();
  }

  /* ---------------------------------------------------------------- */
  /* Sahne kurulumu                                                    */
  /* ---------------------------------------------------------------- */

  private buildCore() {
    const geometry = new THREE.IcosahedronGeometry(1, CORE_DETAIL);
    const material = new THREE.ShaderMaterial({
      vertexShader: CORE_VERT,
      fragmentShader: CORE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: 0.22 },
        uFreq: { value: 1.6 },
        uPulse: { value: 0 },
        uIntensity: { value: 1 },
        uColorDeep: { value: new THREE.Color() },
        uColorMid: { value: new THREE.Color() },
        uColorHot: { value: new THREE.Color() },
      },
    });

    this.core = new THREE.Mesh(geometry, material);
    this.core.scale.setScalar(1.0);
    this.rig.add(this.core);
  }

  private buildHalo() {
    const geometry = new THREE.SphereGeometry(1.9, 64, 48);
    const material = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color() },
        uPower: { value: 4.6 },
        uStrength: { value: 0.4 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.halo = new THREE.Mesh(geometry, material);
    this.rig.add(this.halo);
  }

  /**
   * Kabuğun üstüne binen, kameraya dönük yumuşak ışıma. Geometrik bir kenarı
   * olmadığı için hale "cam küre" gibi okunmuyor.
   */
  private buildBloomSprite() {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: HALO_VERT,
      fragmentShader: HALO_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 1 },
        uColorInner: { value: new THREE.Color() },
        uColorOuter: { value: new THREE.Color() },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    this.bloomSprite = new THREE.Mesh(geometry, material);
    this.bloomSprite.scale.setScalar(6.5);
    this.bloomSprite.renderOrder = 2;
    this.rig.add(this.bloomSprite);
  }

  private buildRings() {
    const specs: {
      radius: number;
      tube: number;
      arc: number;
      rot: [number, number, number];
      opacity: number;
      speed: number;
      accent: boolean;
    }[] = [
      {
        radius: 2.05,
        tube: 0.006,
        arc: Math.PI * 2,
        rot: [1.28, 0.2, 0.35],
        opacity: 0.85,
        speed: 0.09,
        accent: false,
      },
      {
        radius: 2.55,
        tube: 0.005,
        arc: Math.PI * 2,
        rot: [-0.75, 0.9, -0.2],
        opacity: 0.6,
        speed: -0.06,
        accent: false,
      },
      {
        radius: 3.35,
        tube: 0.009,
        arc: Math.PI * 1.35,
        rot: [1.05, -0.35, 1.15],
        opacity: 1,
        speed: 0.045,
        accent: true,
      },
    ];

    for (const spec of specs) {
      const geometry = new THREE.TorusGeometry(
        spec.radius,
        spec.tube,
        8,
        320,
        spec.arc,
      );
      const material = new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color() },
          uOpacity: { value: spec.opacity },
          uSpeed: { value: spec.speed },
        },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
      ring.userData.accent = spec.accent;
      ring.userData.spin = spec.speed * 0.35;
      this.rings.push(ring);
      this.rig.add(ring);
    }
  }

  private buildShards() {
    const source = new THREE.OctahedronGeometry(1, 0);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = source.index;
    geometry.setAttribute("position", source.attributes.position);
    geometry.setAttribute("normal", source.attributes.normal);
    geometry.instanceCount = SHARD_COUNT;

    const rand = mulberry32(7);
    const seeds = new Float32Array(SHARD_COUNT * 4);
    const tilts = new Float32Array(SHARD_COUNT * 3);

    for (let i = 0; i < SHARD_COUNT; i++) {
      // Yarıçap: çekirdeğe yakın yoğun, dışa doğru seyrelen bir dağılım.
      const radius = 1.75 + Math.pow(rand(), 1.6) * 3.1;
      const speed = (0.16 + rand() * 0.38) * (rand() > 0.82 ? -1 : 1);
      const phase = rand() * Math.PI * 2;
      const scale = 0.008 + Math.pow(rand(), 2.2) * 0.032;

      seeds.set([radius, speed, phase, scale], i * 4);
      tilts.set(
        [
          (rand() - 0.5) * 1.9,
          rand() * Math.PI * 2,
          0.15 + rand() * 0.55, // dikey salınım
        ],
        i * 3,
      );
    }

    geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
    geometry.setAttribute("aTilt", new THREE.InstancedBufferAttribute(tilts, 3));
    // Küre sınırı: instancing sonrası konumlar shader'da üretildiği için elle veriyoruz.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);

    const material = new THREE.ShaderMaterial({
      vertexShader: SHARD_VERT,
      fragmentShader: SHARD_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: 1 },
        uIntensity: { value: 1 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.shards = new THREE.Mesh(geometry, material);
    this.shards.frustumCulled = false;
    this.rig.add(this.shards);
    // `source` bilinçli olarak dispose edilmiyor: position/normal buffer'ları
    // instanced geometriyle paylaşılıyor, dispose GPU tarafında onları da düşürür.
  }

  private buildStars() {
    const rand = mulberry32(1337);
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // Küresel kabuk üzerine düzgün dağılım.
      const u = rand() * 2 - 1;
      const theta = rand() * Math.PI * 2;
      const r = 18 + rand() * 42;
      const s = Math.sqrt(1 - u * u);

      positions.set([r * s * Math.cos(theta), r * u, r * s * Math.sin(theta)], i * 3);
      sizes[i] = 0.35 + Math.pow(rand(), 3) * 2.1;
      phases[i] = rand();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: STARS_VERT,
      fragmentShader: STARS_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private buildNebula() {
    const geometry = new THREE.SphereGeometry(120, 48, 32);
    const material = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERT,
      fragmentShader: NEBULA_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0.25 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
      },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    });

    this.nebula = new THREE.Mesh(geometry, material);
    this.nebula.renderOrder = -1;
    this.scene.add(this.nebula);
  }

  /* ---------------------------------------------------------------- */
  /* Parametreler                                                      */
  /* ---------------------------------------------------------------- */

  private bloomStrength() {
    return 0.18 + this.params.glow * 1.05;
  }

  private applyPalette() {
    const { palette } = PRESET_BY_ID[this.params.preset];

    const core = this.core.material.uniforms;
    core.uColorDeep.value.set(palette.deep);
    core.uColorMid.value.set(palette.mid);
    core.uColorHot.value.set(palette.hot);

    this.halo.material.uniforms.uColor.value.set(palette.glow);

    const sprite = this.bloomSprite.material.uniforms;
    sprite.uColorInner.value.set(palette.hot);
    sprite.uColorOuter.value.set(palette.glow);

    const shard = this.shards.material.uniforms;
    shard.uColorA.value.set(palette.ring);
    shard.uColorB.value.set(palette.mid);

    for (const ring of this.rings) {
      ring.material.uniforms.uColor.value.set(
        ring.userData.accent ? palette.accent : palette.ring,
      );
    }

    const stars = this.stars.material.uniforms;
    stars.uColorA.value.set(palette.starA);
    stars.uColorB.value.set(palette.starB);

    const nebula = this.nebula.material.uniforms;
    nebula.uColorA.value.set(palette.nebulaA);
    nebula.uColorB.value.set(palette.nebulaB);
  }

  private applyParams() {
    const { complexity, glow } = this.params;

    const core = this.core.material.uniforms;
    core.uFreq.value = 0.55 + complexity * 1.95;
    core.uAmp.value = 0.05 + complexity * 0.22;
    core.uIntensity.value = 0.5 + glow * 0.75;

    this.halo.material.uniforms.uStrength.value = 0.16 + glow * 0.34;
    this.bloomSprite.material.uniforms.uStrength.value = 0.1 + glow * 0.42;
    this.shards.material.uniforms.uIntensity.value = 0.35 + glow * 0.6;
    this.shards.material.uniforms.uSpread.value = 0.85 + complexity * 0.4;
    this.nebula.material.uniforms.uStrength.value = 0.07 + glow * 0.13;

    this.bloom.strength = this.bloomStrength();
  }

  setParams(next: Partial<PrismParams>) {
    const presetChanged =
      next.preset !== undefined && next.preset !== this.params.preset;

    this.params = { ...this.params, ...next };

    if (presetChanged) {
      this.applyPalette();
      // Palet değişiminde kısa bir enerji darbesi.
      this.pulse = 1;
    }
    this.applyParams();
  }

  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
  }

  /** Kamerayı başlangıç açısına yumuşakça döndürür. */
  resetView() {
    this.targetAzimuth = 0.6;
    this.targetPolar = Math.PI / 2 - 0.12;
    this.targetDistance = 7.8;
    this.pointerTarget.set(0, 0);
    this.pulse = 1;
  }

  /* ---------------------------------------------------------------- */
  /* Etkileşim                                                         */
  /* ---------------------------------------------------------------- */

  private onPointerDown = (e: PointerEvent) => {
    if (this.activePointerId !== null) return;
    this.activePointerId = e.pointerId;
    this.dragging = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerTarget.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      ((e.clientY - rect.top) / rect.height) * 2 - 1,
    );

    if (!this.dragging || e.pointerId !== this.activePointerId) return;

    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    this.targetAzimuth -= dx * 0.006;
    this.targetPolar = THREE.MathUtils.clamp(
      this.targetPolar - dy * 0.006,
      0.35,
      Math.PI - 0.35,
    );
  };

  private endDrag = (e: PointerEvent) => {
    if (e.pointerId !== this.activePointerId) return;
    this.dragging = false;
    this.activePointerId = null;
    if (this.canvas.hasPointerCapture(e.pointerId)) {
      this.canvas.releasePointerCapture(e.pointerId);
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.targetDistance = THREE.MathUtils.clamp(
      this.targetDistance + e.deltaY * 0.0026,
      4.2,
      16,
    );
  };

  private onContextLostEvent = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.onContextLost?.();
  };

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.endDrag);
    this.canvas.addEventListener("pointercancel", this.endDrag);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("webglcontextlost", this.onContextLostEvent);

    const parent = this.canvas.parentElement;
    if (parent && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(parent);
    } else {
      window.addEventListener("resize", this.resize);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Döngü                                                             */
  /* ---------------------------------------------------------------- */

  resize = () => {
    if (this.disposed) return;

    const parent = this.canvas.parentElement;
    const width = Math.max(parent?.clientWidth ?? window.innerWidth, 1);
    const height = Math.max(parent?.clientHeight ?? window.innerHeight, 1);

    // Küçük ekranlarda ve yüksek DPR'de piksel bütçesini sınırla.
    const dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.5 : 2);
    this.renderer.setPixelRatio(dpr);
    this.stars.material.uniforms.uPixelRatio.value = dpr;

    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);

    this.camera.aspect = width / height;
    // Dar ekranlarda çekirdek kadraja sığsın diye kamerayı geri çek.
    this.camera.fov = width < 640 ? 54 : 42;
    this.camera.updateProjectionMatrix();
  };

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    const loop = (timestamp: number) => {
      if (!this.running) return;
      this.frameId = requestAnimationFrame(loop);
      this.tick(timestamp);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  private tick(timestamp: number) {
    this.timer.update(timestamp);
    const rawDelta = Math.min(this.timer.getDelta(), 0.1);
    const speed = this.reducedMotion
      ? 0.12
      : 0.25 + this.params.speed * 1.75;

    this.simTime += rawDelta * speed;
    this.pulse = Math.max(0, this.pulse - rawDelta * 1.6);

    const t = this.simTime;

    // ---- uniform güncellemeleri -----------------------------------
    this.core.material.uniforms.uTime.value = t;
    this.core.material.uniforms.uPulse.value = this.pulse;
    this.halo.material.uniforms.uTime.value = t;
    this.bloomSprite.material.uniforms.uTime.value = t;
    // Işıma her zaman kameraya baksın.
    this.bloomSprite.quaternion.copy(this.camera.quaternion);
    this.shards.material.uniforms.uTime.value = t;
    this.stars.material.uniforms.uTime.value = t;
    this.nebula.material.uniforms.uTime.value = t;
    this.grade.uniforms.uTime.value = t;
    for (const ring of this.rings) {
      ring.material.uniforms.uTime.value = t;
      ring.rotation.z += rawDelta * (ring.userData.spin as number);
    }

    this.core.rotation.y += rawDelta * speed * 0.12;
    this.core.rotation.x = Math.sin(t * 0.18) * 0.12;
    this.stars.rotation.y += rawDelta * 0.004;

    // ---- kamera ----------------------------------------------------
    if (!this.dragging && !this.reducedMotion) {
      this.targetAzimuth += rawDelta * 0.045; // yavaş otomatik dönüş
    }

    const ease = 1 - Math.pow(0.001, rawDelta); // kare hızından bağımsız yumuşatma
    this.azimuth += (this.targetAzimuth - this.azimuth) * ease;
    this.polar += (this.targetPolar - this.polar) * ease;
    this.distance += (this.targetDistance - this.distance) * ease;
    this.pointer.lerp(this.pointerTarget, ease * 0.5);

    // İmleç konumuna göre hafif paralaks.
    const az = this.azimuth + this.pointer.x * 0.12;
    const po = THREE.MathUtils.clamp(
      this.polar + this.pointer.y * 0.08,
      0.3,
      Math.PI - 0.3,
    );

    this.camera.position.set(
      this.distance * Math.sin(po) * Math.sin(az),
      this.distance * Math.cos(po),
      this.distance * Math.sin(po) * Math.cos(az),
    );
    this.camera.lookAt(0, 0, 0);
    this.nebula.position.copy(this.camera.position);

    this.renderer.info.reset();
    this.composer.render();

    // ---- ölçüm -----------------------------------------------------
    this.fpsFrames++;
    this.fpsAccum += rawDelta;
    if (this.fpsAccum >= 0.25 && this.onStats) {
      const info = this.renderer.info.render;
      this.onStats({
        fps: Math.round(this.fpsFrames / this.fpsAccum),
        drawCalls: info.calls,
        triangles: info.triangles,
        particles: SHARD_COUNT + STAR_COUNT,
      });
      this.fpsFrames = 0;
      this.fpsAccum = 0;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Temizlik                                                          */
  /* ---------------------------------------------------------------- */

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();

    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.endDrag);
    this.canvas.removeEventListener("pointercancel", this.endDrag);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLostEvent);
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.resize);

    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh | THREE.Points;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });

    this.timer.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}

export const PRISM_CORE_DETAIL = CORE_DETAIL;
export const PRISM_SHARD_COUNT = SHARD_COUNT;
export const PRISM_STAR_COUNT = STAR_COUNT;
