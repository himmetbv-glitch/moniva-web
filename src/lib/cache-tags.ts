/**
 * Data-cache tags. Public catalogue reads are cached for an hour; every admin
 * mutation that changes what they return calls `updateTag` (Server Actions) or
 * `revalidateTag(tag, { expire: 0 })` (Route Handlers) so the next request sees
 * the edit immediately. Scripts that write the database directly
 * (`prisma/import/*`) do not invalidate — their changes appear within the hour.
 *
 *   catalog  — categories, brands, products (images, datasheets, OEM, kits)
 *              and the catalogue page's managed labels
 *   settings — site settings and the footer's legal pages
 */
export const CATALOG_TAG = "catalog";
export const SETTINGS_TAG = "settings";

export const CACHE_SECONDS = 3600;

/**
 * Which database a cached value came from, folded into every cache key.
 *
 * The data cache does not know about databases: a local server that once ran
 * against the dev DB keeps serving those rows after being pointed at
 * production, and nothing guarantees preview and production deployments keep
 * separate caches either. Host + database name only — never the credentials.
 */
export const CACHE_SCOPE = (() => {
  try {
    const url = new URL(process.env.DATABASE_URL ?? "");
    return `${url.host}${url.pathname}`;
  } catch {
    return "default";
  }
})();
