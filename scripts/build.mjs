import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(rootDirectory, "src");
const outputDirectory = path.join(rootDirectory, "dist");
const targets = ["chromium", "firefox"];

await rm(outputDirectory, { recursive: true, force: true });

for (const target of targets) {
  const targetDirectory = path.join(outputDirectory, target);
  await mkdir(targetDirectory, { recursive: true });

  for (const entry of ["_locales", "background.js", "content.js", "main-world.js", "icons", "lib", "popup"]) {
    await cp(path.join(sourceDirectory, entry), path.join(targetDirectory, entry), { recursive: true });
  }

  const manifestPath = path.join(sourceDirectory, "manifests", `${target}.json`);
  const manifestText = await readFile(manifestPath, "utf8");
  JSON.parse(manifestText);
  await writeFile(path.join(targetDirectory, "manifest.json"), `${manifestText.trim()}\n`);
}

console.log("Pacotes gerados em dist/chromium e dist/firefox.");
