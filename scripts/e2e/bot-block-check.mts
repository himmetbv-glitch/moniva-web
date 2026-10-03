// Checks the crawler blocklist against real user-agent strings, in both places
// it lives: src/lib/bot-block.ts (proxy fallback) and vercel.json (edge deny).
// Run: npx tsx scripts/e2e/bot-block-check.mts
import { readFileSync } from "node:fs";

import { isBlockedBot } from "../../src/lib/bot-block";

const BLOCK = [
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  "Mozilla/5.0 (compatible; SERankingBacklinksBot/1.0; +https://seranking.com/backlinks-crawler)",
  "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)",
  "CCBot/2.0 (https://commoncrawl.org/faq/)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot) Chrome/119.0.6045.214 Safari/537.36",
  "Mozilla/5.0 (compatible;PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
];

// Must stay reachable: previews, search engines, AI search/answers, people.
const ALLOW = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "meta-externalfetcher/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
  "Twitterbot/1.0",
  "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
  "WhatsApp/2.23.20.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
];

const vercel = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
const edgeValue: string = vercel.routes[0].has[0].value;
const edge = new RegExp(edgeValue); // no flags: the edge rule must work case-sensitively

let failures = 0;
const check = (label: string, ua: string, want: boolean, got: boolean) => {
  if (want !== got) {
    failures++;
    console.log(`❌ ${label}: ${want ? "engellenmeliydi" : "GEÇMELİYDİ"} → ${ua}`);
  }
};

for (const ua of BLOCK) {
  check("proxy", ua, true, isBlockedBot(ua));
  check("vercel.json", ua, true, edge.test(ua));
}
for (const ua of ALLOW) {
  check("proxy", ua, false, isBlockedBot(ua));
  check("vercel.json", ua, false, edge.test(ua));
}

console.log(
  failures === 0
    ? `✅ ${BLOCK.length} engellenecek + ${ALLOW.length} izinli UA, iki katmanda da doğru`
    : `❌ ${failures} hata`,
);
process.exit(failures === 0 ? 0 : 1);
