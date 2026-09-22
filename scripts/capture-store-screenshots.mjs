import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(rootDirectory, "store-assets");
const previewPath = path.join(rootDirectory, "store-listing", "previews", "popup-frame.html");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

await mkdir(outputDirectory, { recursive: true });

function browserApiScript(catalog, uiLanguage) {
  return `
    (() => {
      const catalog = ${JSON.stringify(catalog)};
      function getMessage(key, substitutions = []) {
        const entry = catalog[key];
        if (!entry) return "";
        const values = Array.isArray(substitutions) ? substitutions : [substitutions];
        let output = entry.message;
        Object.entries(entry.placeholders || {}).forEach(([name, placeholder]) => {
          const index = Number(placeholder.content.slice(1)) - 1;
          output = output.replaceAll(\`$\${name.toUpperCase()}$\`, String(values[index] ?? ""));
        });
        return output;
      }
      globalThis.chrome = {
        i18n: { getMessage, getUILanguage: () => ${JSON.stringify(uiLanguage)} },
        storage: {
          local: {
            get: async () => ({ allowedHosts: ["video.example", "cinema.example"] }),
            set: async () => {}
          }
        },
        tabs: { query: async () => [{ id: 1, url: "https://video.example/watch" }] },
        permissions: { request: async () => true, remove: async () => true },
        runtime: { sendMessage: async () => ({ ok: true }) }
      };
    })();
  `;
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true
});

try {
  for (const { locale, uiLanguage, filename } of [
    { locale: "en", uiLanguage: "en-US", filename: "screenshot-en-1280x800.png" },
    { locale: "pt_BR", uiLanguage: "pt-BR", filename: "screenshot-pt-BR-1280x800.png" }
  ]) {
    const catalogPath = path.join(rootDirectory, "src", "_locales", locale, "messages.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(browserApiScript(catalog, uiLanguage));
    const page = await context.newPage();
    await page.goto(`${pathToFileURL(previewPath).href}?locale=${locale}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(outputDirectory, filename),
      type: "png",
      animations: "disabled"
    });
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("Store screenshots generated in store-assets.");
