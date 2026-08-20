import { readFile } from "node:fs/promises";

const host = "booktrace.app";
const key = process.env.INDEXNOW_KEY;
const keyLocation = `https://${host}/${key}.txt`;

if (!key) throw new Error("INDEXNOW_KEY is missing");

for (let attempt = 1; attempt <= 18; attempt += 1) {
  const response = await fetch(keyLocation, { cache: "no-store" });
  if (response.ok && (await response.text()).trim() === key) break;
  if (attempt === 18) throw new Error("The deployed IndexNow key was not available in time");
  await new Promise((resolve) => setTimeout(resolve, 10_000));
}

const sitemap = await readFile(new URL("../../sitemap.xml", import.meta.url), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow returned ${response.status}: ${await response.text()}`);
}

console.log(`IndexNow accepted ${urlList.length} URLs with status ${response.status}`);
