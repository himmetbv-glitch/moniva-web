// PRISM CORE — palet ve parametre sözleşmesi.
// Renkler sRGB hex; THREE.Color bunları otomatik olarak linear çalışma
// uzayına çevirir (ColorManagement r152+ varsayılan olarak açık).

export type PrismPresetId = "nebula" | "solar" | "aurora";

export type PrismPalette = {
  /** Kristalin gölgede kalan derin tonu. */
  deep: string;
  /** Ana gövde rengi ve rim ışığı. */
  mid: string;
  /** Sıcak çekirdek / damarlar. */
  hot: string;
  /** Halo (atmosfer kabuğu). */
  glow: string;
  /** Yörünge halkaları. */
  ring: string;
  /** Vurgulu yay halkası. */
  accent: string;
  /** Nebula bulutları. */
  nebulaA: string;
  nebulaB: string;
  /** Yıldızlar. */
  starA: string;
  starB: string;
};

export type PrismPreset = {
  id: PrismPresetId;
  label: string;
  /** UI'daki swatch için CSS gradient. */
  swatch: string;
  palette: PrismPalette;
};

export const PRESETS: readonly PrismPreset[] = [
  {
    id: "nebula",
    label: "Nebula",
    swatch: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #e879f9 100%)",
    palette: {
      deep: "#1b1046",
      mid: "#7c4dff",
      hot: "#f0e3ff",
      glow: "#6d5bff",
      ring: "#9db8ff",
      accent: "#ff3d8b",
      nebulaA: "#160b3a",
      nebulaB: "#3a1d8c",
      starA: "#cfd9ff",
      starB: "#ffffff",
    },
  },
  {
    id: "solar",
    label: "Solar",
    swatch: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
    palette: {
      deep: "#3d1004",
      mid: "#ff7a18",
      hot: "#fff3d6",
      glow: "#ff8c2b",
      ring: "#ffd08a",
      accent: "#ff2f4d",
      nebulaA: "#2a0d05",
      nebulaB: "#7a2a06",
      starA: "#ffe8c7",
      starB: "#ffffff",
    },
  },
  {
    id: "aurora",
    label: "Aurora",
    swatch: "linear-gradient(135deg, #22d3ee 0%, #34d399 50%, #a7f3d0 100%)",
    palette: {
      deep: "#052e2b",
      mid: "#25e0b0",
      hot: "#e6fffb",
      glow: "#1fd6c6",
      ring: "#9df5e4",
      accent: "#3b82f6",
      nebulaA: "#04211f",
      nebulaB: "#0b5a56",
      starA: "#d6fff6",
      starB: "#ffffff",
    },
  },
] as const;

export const PRESET_BY_ID = Object.fromEntries(
  PRESETS.map((p) => [p.id, p]),
) as Record<PrismPresetId, PrismPreset>;

export type PrismParams = {
  preset: PrismPresetId;
  /** 0–1 → yüzey gürültüsünün frekansı ve genliği. */
  complexity: number;
  /** 0–1 → bloom şiddeti. */
  glow: number;
  /** 0–1 → animasyon hızı. */
  speed: number;
};

export const DEFAULT_PARAMS: PrismParams = {
  preset: "nebula",
  complexity: 0.44,
  glow: 0.62,
  speed: 0.38,
};

export type PrismStats = {
  fps: number;
  drawCalls: number;
  triangles: number;
  particles: number;
};
