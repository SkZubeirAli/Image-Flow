# ImageFlow

**Bulk Image Resizer & Compressor for Windows** — resize, compress, convert and rename hundreds of images at once. Everything runs locally on your computer: no account, no server, no uploads.

![Platform](https://img.shields.io/badge/platform-Windows-0078D6)
![Electron](https://img.shields.io/badge/Electron-31%2B-47848F)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/license-MIT-green)

<!-- Add a screenshot or GIF here once you have one:
![ImageFlow screenshot](docs/screenshot.png)
-->

## Why ImageFlow?

Online image resizers make you upload your photos to someone else's server and often limit batch size. ImageFlow does the same job offline, privately, and on as many files as your computer can handle.

## Features

- **Import** images by file picker, whole folder (recursive) or ZIP archive
- **Resize** by width, height, exact dimensions or percentage, with Fit / Fill / Stretch modes and aspect-ratio lock
- **Presets** for common sizes (Instagram, Full HD, YouTube thumbnail, website)
- **Compress** by quality slider or by **target file size** (e.g. 500 KB), using an iterative quality search for JPEG / WebP / AVIF
- **Convert** between JPEG, PNG, WebP and AVIF, with background-colour handling when transparency is flattened to JPEG
- **Bulk rename**: prefix, suffix, number sequence, replace, find & replace, with automatic duplicate handling
- **Before / after slider** with zoom to inspect the result
- **Queue** with thumbnails, per-image status, size savings, retry and remove
- **Progress** bar with ETA and cancel; configurable concurrency (1–5)
- **Export** one image, all images to a folder, or everything as a ZIP
- **Safe by default**: originals are never modified; name clashes become `name_1.jpg`, `name_2.jpg`
- Light / dark / system theme

## Tech stack

| Area | Technology |
|---|---|
| Desktop shell | Electron (`contextIsolation` on, `nodeIntegration` off, sandboxed renderer) |
| UI | React 18, TypeScript, Tailwind CSS, lucide-react |
| Build | Vite, electron-builder |
| Image processing | [sharp](https://sharp.pixelplumbing.com/) |
| ZIP | archiver, unzipper |

## Getting started

### Requirements

- [Node.js](https://nodejs.org) 18 or newer (LTS recommended)
- Windows 10/11 (macOS/Linux targets are configured but untested)

### Install and run

```bash
git clone https://github.com/SkZubeirAli/imageflow.git
cd imageflow
npm install
npm run dev
```

### Build a Windows installer

```bash
npm run dist:win
```

The installer is written to `release/ImageFlow Setup <version>.exe`.
Put an icon at `build/icon.ico` first (see `build/README.txt`), or remove the `icon:` lines from `electron-builder.yml` to use the default Electron icon.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite and Electron with hot reload |
| `npm run build` | Compile Electron code and build the React app |
| `npm run dist` / `dist:win` | Build and package an installer |
| `npm run typecheck` | Type-check the React code |
| `npm test` | Run unit tests (run `npm run build` first) |

## Project structure

```
electron/            Main process
  main.ts            Window and app lifecycle
  preload.ts         Safe API exposed to the UI (contextBridge)
  ipc/handlers.ts    IPC handlers and processing controller
  services/          imageProcessor, zipService, fileService,
                     thumbnailService, renameService, concurrencyQueue
src/                 React UI
  components/ pages/ stores/ hooks/ types/ utils/
tests/               Unit tests (node:test)
```

## Security and privacy

- Images are read and written only on your machine; the app makes no network requests for processing.
- The renderer has no access to Node APIs. Only a small, explicit set of functions is exposed through `preload.ts`.
- Original files are never overwritten; processed copies are written to a folder you choose.

## Known limitations

- Dropping files onto the window currently opens the file picker rather than importing the dropped files directly.
- Animated GIFs are not resized or re-encoded frame by frame.
- AVIF encoding is much slower than JPEG/WebP on large batches.
- The before/after preview loads full-resolution files, so very large images can take a moment to open.
- Only Windows has been tested.
- Test coverage is currently limited to the rename logic and formatting helpers.

## Roadmap

- Native drag-and-drop of files from Explorer
- Per-image settings overrides
- Automated tests for the image pipeline
- macOS and Linux builds

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
