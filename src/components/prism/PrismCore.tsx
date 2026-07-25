"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { PrismEngine, PRISM_CORE_DETAIL } from "./PrismEngine";
import {
  DEFAULT_PARAMS,
  PRESETS,
  type PrismParams,
  type PrismPresetId,
  type PrismStats,
} from "./presets";

const INITIAL_STATS: PrismStats = {
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  particles: 0,
};

const SLIDERS: {
  key: keyof Omit<PrismParams, "preset">;
  label: string;
  hint: string;
}[] = [
  { key: "complexity", label: "COMPLEXITY", hint: "Yüzey gürültüsü" },
  { key: "glow", label: "GLOW", hint: "Bloom şiddeti" },
  { key: "speed", label: "SPEED", hint: "Simülasyon hızı" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value);
}

export default function PrismCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PrismEngine | null>(null);

  const [params, setParams] = useState<PrismParams>(DEFAULT_PARAMS);
  const [stats, setStats] = useState<PrismStats>(INITIAL_STATS);
  const [failed, setFailed] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Parametreleri ref'te de tutuyoruz: motor bir kez kurulup yaşıyor,
  // kurulum efekti güncel değerleri bağımlılık listesine girmeden okuyabilmeli.
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let engine: PrismEngine;

    try {
      engine = new PrismEngine(canvas, {
        params: paramsRef.current,
        reducedMotion: media.matches,
        onStats: setStats,
        onContextLost: () =>
          setFailed("WebGL bağlamı kayboldu. Sayfayı yenileyin."),
      });
    } catch (error) {
      console.error("[prism] engine init failed", error);
      // Terminal durum: tek seferlik ekstra render'ın maliyeti önemsiz,
      // alternatifi WebGL yokluğunda boş bir ekran bırakmak olurdu.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed("Bu tarayıcıda WebGL 2 başlatılamadı.");
      return;
    }

    engineRef.current = engine;
    engine.start();

    const onMotionChange = (e: MediaQueryListEvent) =>
      engine.setReducedMotion(e.matches);
    media.addEventListener("change", onMotionChange);

    // Sekme arka plandayken GPU'yu boşuna yormayalım.
    const onVisibility = () => {
      if (document.hidden) engine.stop();
      else engine.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      media.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const update = useCallback((patch: Partial<PrismParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
    engineRef.current?.setParams(patch);
  }, []);

  const randomize = useCallback(() => {
    const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)]
      .id as PrismPresetId;
    update({
      preset,
      complexity: Math.round(Math.random() * 100) / 100,
      glow: 0.3 + Math.round(Math.random() * 60) / 100,
      speed: 0.15 + Math.round(Math.random() * 70) / 100,
    });
  }, [update]);

  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    engineRef.current?.setParams(DEFAULT_PARAMS);
    engineRef.current?.resetView();
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#03030a] text-white">
      <canvas
        ref={canvasRef}
        aria-label="PRISM CORE — etkileşimli 3B çekirdek görselleştirmesi"
        className="absolute inset-0 h-full w-full touch-none"
      />

      {/* Vinyet + tarama çizgileri (canvas'ın üstünde, tıklamayı geçirir) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(2,2,10,0.85)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:repeating-linear-gradient(to_bottom,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_3px)]"
      />

      {failed && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#03030a]/90 px-6 text-center">
          <div className="max-w-sm">
            <p className="font-mono text-[11px] tracking-[0.3em] text-rose-400">
              RENDERER OFFLINE
            </p>
            <p className="mt-3 text-sm text-white/70">{failed}</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Sol üst: başlık bloğu                                         */}
      {/* ------------------------------------------------------------ */}
      {/* pr-24: küçük ekranlarda sağ üstteki KONTROL düğmesine yer bırakır */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-5 pr-24 sm:p-8 sm:pr-28 lg:p-10 lg:pr-10">
        <div className="max-w-md">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] text-white/45 sm:text-[11px]">
            <span className="text-white/70">◆</span>
            REAL-TIME
            <span className="text-white/25">/</span>
            WEBGL 2
            <span className="text-white/25">/</span>
            GPU INSTANCED
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            PRISM{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              CORE
            </span>
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
            Gürültü alanıyla deforme olan bir kristal çekirdek; yörüngesinde
            binlerce parça, üstünde fiziksel bloom ve film grenii. Tamamı tek
            karede, gerçek zamanlı hesaplanıyor.
          </p>

          <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.18em] text-white/40 sm:text-[11px]">
            <div className="flex items-center gap-2">
              <dt className="text-white/30">GEOMETRY</dt>
              <dd className="text-white/70">ICOSA · {PRISM_CORE_DETAIL}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-white/30">SHADING</dt>
              <dd className="text-white/70">CUSTOM GLSL</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-white/30">POST</dt>
              <dd className="text-white/70">BLOOM + GRADE</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Simplex Noise", "Additive Blending", "ACES Filmic"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] tracking-wide text-white/55 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Sol alt: imza kartı                                           */}
      {/* ------------------------------------------------------------ */}
      <div className="pointer-events-none absolute bottom-16 left-5 z-20 hidden sm:left-8 sm:block lg:left-10">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-md">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[13px] font-semibold">
            ✳
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-white/90">Claude Opus 5</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-white/35">
              VIBE CODED · TEK GEÇİŞ
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Sağ: kontrol paneli                                           */}
      {/* ------------------------------------------------------------ */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        className="absolute right-4 top-4 z-40 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-white/70 backdrop-blur-md transition hover:bg-white/[0.12] lg:hidden"
      >
        {panelOpen ? "KAPAT" : "KONTROL"}
      </button>

      <aside
        className={`absolute right-0 top-0 z-30 flex h-dvh w-[280px] max-w-[85vw] flex-col gap-6 overflow-y-auto border-l border-white/[0.07] bg-[#05050f]/80 p-5 backdrop-blur-xl transition-transform duration-300 lg:w-[300px] lg:translate-x-0 lg:border-l-0 lg:bg-transparent lg:p-8 lg:backdrop-blur-none lg:pointer-events-none ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-8 lg:hidden" />

        {/* Telemetri */}
        <section className="lg:pointer-events-auto">
          <dl className="space-y-2 font-mono text-[10px] tracking-[0.18em]">
            <div className="flex items-baseline justify-between">
              <dt className="text-white/35">MODEL</dt>
              <dd className="text-[12px] font-semibold tracking-normal text-white/90">
                Claude Opus 5
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-white/35">FPS</dt>
              <dd
                className={
                  stats.fps >= 50
                    ? "text-emerald-300"
                    : stats.fps >= 30
                      ? "text-amber-300"
                      : "text-rose-300"
                }
              >
                {stats.fps || "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-white/35">DRAW CALLS</dt>
              <dd className="text-white/70">{stats.drawCalls || "—"}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-white/35">TRIANGLES</dt>
              <dd className="text-white/70">
                {stats.triangles ? formatNumber(stats.triangles) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-white/35">PARTICLES</dt>
              <dd className="text-white/70">
                {stats.particles ? formatNumber(stats.particles) : "—"}
              </dd>
            </div>
          </dl>

          {/* Kare bütçesi çubuğu — 60 fps hedefine göre doluluk */}
          <div className="mt-3 h-px w-full bg-white/10">
            <div
              className="h-px bg-gradient-to-r from-indigo-400 to-fuchsia-400 transition-[width] duration-500"
              style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%` }}
            />
          </div>
        </section>

        {/* Presetler */}
        <section className="lg:pointer-events-auto">
          <p className="font-mono text-[10px] tracking-[0.28em] text-white/35">
            PRESETS
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const active = params.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => update({ preset: preset.id })}
                  aria-pressed={active}
                  title={preset.label}
                  className={`h-9 rounded-lg border transition ${
                    active
                      ? "border-white/70 ring-2 ring-white/25"
                      : "border-white/10 hover:border-white/35"
                  }`}
                  style={{ background: preset.swatch }}
                >
                  <span className="sr-only">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Parametreler */}
        <section className="lg:pointer-events-auto">
          <p className="font-mono text-[10px] tracking-[0.28em] text-white/35">
            PARAMETERS
          </p>
          <div className="mt-4 space-y-4">
            {SLIDERS.map((slider) => (
              <div key={slider.key}>
                <div className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.18em]">
                  <label
                    htmlFor={`prism-${slider.key}`}
                    className="text-white/45"
                    title={slider.hint}
                  >
                    {slider.label}
                  </label>
                  <span className="text-white/80">
                    {params[slider.key].toFixed(2)}
                  </span>
                </div>
                <input
                  id={`prism-${slider.key}`}
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={params[slider.key]}
                  onChange={(e) =>
                    update({
                      [slider.key]: Number(e.target.value),
                    } as Partial<PrismParams>)
                  }
                  className="prism-range mt-2 w-full"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Eylemler */}
        <section className="mt-auto space-y-2 pb-4 lg:pointer-events-auto">
          <button
            type="button"
            onClick={randomize}
            className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/10 py-2.5 font-mono text-[11px] tracking-[0.22em] text-indigo-200 transition hover:border-indigo-300/70 hover:bg-indigo-500/20"
          >
            RANDOMIZE
          </button>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 py-2.5 font-mono text-[11px] tracking-[0.22em] text-white transition hover:from-indigo-400 hover:to-violet-400"
          >
            RESET
          </button>
        </section>
      </aside>

      {/* ------------------------------------------------------------ */}
      {/* Alt: durum satırı                                             */}
      {/* ------------------------------------------------------------ */}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 p-4 font-mono text-[10px] tracking-[0.22em] text-white/30 sm:gap-8">
        <span className="hidden sm:inline">PRISM CORE v1.0</span>
        <span>SÜRÜKLE → DÖNDÜR</span>
        <span className="hidden sm:inline">TEKERLEK → YAKINLAŞ</span>
        <span className="text-white/45">{PRESETS.find((p) => p.id === params.preset)?.label.toUpperCase()}</span>
      </footer>
    </main>
  );
}
