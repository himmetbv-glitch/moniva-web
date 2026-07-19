/**
 * Managed page section datası için locale-aware override.
 *
 * Şema: TR alanları JSON'un kökünde. Diğer diller `_i18n.{locale}` altında
 * partial olarak saklanır. Eksik alanlar TR'ye fallback yapar. Object array
 * alanları index bazlı shallow merge edilir — böylece `slides`, `stats`,
 * `regions` gibi array'lerin override bloklarında yalnız text alanları
 * verilir, teknik alanlar (`img`, `href`, `icon` vb.) TR base'inden gelir.
 *
 * Örnek:
 *   {
 *     slides: [
 *       { img: "/home/hero.jpg", head: "Güvenilir", sub: "Türkçe alt" },
 *     ],
 *     _i18n: {
 *       en: { slides: [{ head: "Reliable", sub: "English sub" }] },
 *     }
 *   }
 *
 * pickLocalized({...}, "en") →
 *   { slides: [{ img: "/home/hero.jpg", head: "Reliable", sub: "English sub" }] }
 */
import type { Locale } from "@prisma/client";

type I18nWrapped<T> = T & {
  _i18n?: Partial<Record<Lowercase<Locale> | string, Partial<T>>>;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Array<object> için item-wise shallow merge (index bazlı). override array'i
// tek doğru kaynak — kısaltma/uzatma override'a göre olur; her item TR
// karşılığından eksik alanları alır.
function mergeArrays(base: unknown, override: unknown[]): unknown[] {
  if (!Array.isArray(base)) return override;
  return override.map((item, i) => {
    const baseItem = base[i];
    if (isPlainObject(item) && isPlainObject(baseItem)) {
      return { ...baseItem, ...item };
    }
    return item;
  });
}

export function pickLocalized<T extends Record<string, unknown>>(
  data: T,
  locale: Locale,
): T {
  const wrapped = data as I18nWrapped<T>;
  const i18n = wrapped._i18n;
  const key = locale.toLowerCase();

  if (!i18n || !i18n[key] || locale === "TR") {
    const { _i18n: _, ...rest } = wrapped;
    return rest as T;
  }

  const override = i18n[key] as Partial<T>;
  const { _i18n: _, ...root } = wrapped;
  const result: Record<string, unknown> = { ...root };

  for (const [k, v] of Object.entries(override)) {
    if (Array.isArray(v)) {
      result[k] = mergeArrays(root[k], v);
    } else {
      result[k] = v;
    }
  }

  return result as T;
}
