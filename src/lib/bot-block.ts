/**
 * Crawlers that are refused outright. They loop over every filter/sort/page
 * combination of /[locale]/urunler and every product detail around the clock,
 * and each hit is a fresh server render.
 *
 * The same list is duplicated in vercel.json (`routes[0].has`), which blocks at
 * the edge before any function runs; JSON cannot import it, so keep both in
 * sync. proxy.ts uses this copy as the fallback and robots.txt as the
 * `Disallow: /` group.
 *
 * Deliberately NOT here: facebookexternalhit (link previews), Googlebot,
 * Bingbot, OAI-SearchBot and ChatGPT-User (search and AI-answer visibility).
 * None of them contains any of these tokens, and the bot-block test checks it.
 */
export const BLOCKED_BOTS = [
  "meta-externalagent",
  "GPTBot",
  "SERankingBacklinksBot",
  "Bytespider",
  "CCBot",
  "Amazonbot",
  "PetalBot",
] as const;

const BLOCKED_UA = new RegExp(BLOCKED_BOTS.join("|"), "i");

export function isBlockedBot(userAgent: string | null): boolean {
  return userAgent ? BLOCKED_UA.test(userAgent) : false;
}
