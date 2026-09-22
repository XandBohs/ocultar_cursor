# Firefox source build instructions

## Environment

- Operating system: Windows, macOS, or Linux
- Node.js: version 20 or newer
- npm: version bundled with the selected Node.js release

## Build

The published extension contains unminified JavaScript and no remotely hosted code. The build script validates the manifests and copies the Firefox-specific source files into the distribution directory.

From the source archive root, run:

```sh
npm ci
npm run check
```

The Firefox files submitted for review are generated in `dist/firefox`. The corresponding upload archive can be reproduced with:

```sh
npm run release
```

The resulting Firefox package is `release/ocultar-cursor-1.2.2-firefox.zip`.

## Source mapping

- `src/manifests/firefox.json` becomes `dist/firefox/manifest.json`.
- `src/background.js`, `src/content.js`, `src/main-world.js`, `src/icons`, `src/lib`, `src/popup`, and `src/_locales` are copied without compilation or minification.
- `scripts/build.mjs` implements the complete build process.

No environment variables, secrets, network services, or proprietary tools are required to build the extension after dependencies are installed.
