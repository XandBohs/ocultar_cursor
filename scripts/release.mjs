import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZipArchive } from "archiver";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, "..");
const distributionDirectory = path.join(rootDirectory, "dist");
const releaseDirectory = path.join(rootDirectory, "release");
const packageMetadata = JSON.parse(await readFile(path.join(rootDirectory, "package.json"), "utf8"));
const version = packageMetadata.version;

await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(releaseDirectory, { recursive: true });

function createArchive(outputPath, addEntries) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("warning", (error) => {
      if (error.code === "ENOENT") {
        console.warn(error.message);
      } else {
        reject(error);
      }
    });
    archive.on("error", reject);
    archive.pipe(output);
    addEntries(archive);
    archive.finalize();
  });
}

const chromiumFilename = `ocultar-cursor-${version}-chromium.zip`;
const firefoxFilename = `ocultar-cursor-${version}-firefox.zip`;
const sourceFilename = `ocultar-cursor-${version}-source.zip`;

await createArchive(path.join(releaseDirectory, chromiumFilename), (archive) => {
  archive.directory(path.join(distributionDirectory, "chromium"), false);
});

await createArchive(path.join(releaseDirectory, firefoxFilename), (archive) => {
  archive.directory(path.join(distributionDirectory, "firefox"), false);
});

await createArchive(path.join(releaseDirectory, sourceFilename), (archive) => {
  for (const filename of [".gitignore", "package.json", "package-lock.json", "README.md", "PRIVACY.md"]) {
    archive.file(path.join(rootDirectory, filename), { name: filename });
  }

  for (const directory of ["assets", "scripts", "src", "test"]) {
    archive.directory(path.join(rootDirectory, directory), directory);
  }

  archive.file(path.join(rootDirectory, "store-listing", "firefox-source-instructions.md"), {
    name: "BUILD.md"
  });
});

const filenames = [chromiumFilename, firefoxFilename, sourceFilename];
const checksumLines = [];

for (const filename of filenames) {
  const contents = await readFile(path.join(releaseDirectory, filename));
  const checksum = createHash("sha256").update(contents).digest("hex");
  checksumLines.push(`${checksum}  ${filename}`);
}

await writeFile(path.join(releaseDirectory, "SHA256SUMS.txt"), `${checksumLines.join("\n")}\n`);

console.log(`Release ${version} generated in release:`);
for (const filename of [...filenames, "SHA256SUMS.txt"]) {
  console.log(`- ${filename}`);
}
