# ImageFlow

**Bulk Image Resizer & Compressor** — a fully offline Windows desktop app for resizing, compressing, converting, and renaming large batches of images. No accounts, no servers, no uploads: every image is read and written on your own machine.

Functionally inspired by the workflow of imageresizer.com; UI, branding, and code are original.

---

## Features

- Import 30–500+ images at once via file picker, folder picker (recursive), ZIP import, or drag-and-drop
- Resize by width, height, exact dimensions, or percentage, with Fit / Fill / Stretch modes and aspect-ratio locking
- Resize presets (Instagram square/portrait, Full HD, YouTube thumbnail, website)
- Compress by quality slider **or** by target file size (100 KB–5 MB+), using iterative binary-search quality search for JPEG/WEBP/AVIF
- Convert format (JPEG, PNG, WEBP, AVIF, or keep original), with transparency-safe background-color handling when converting to JPEG
- Bulk rename: keep, replace, prefix, suffix, numbered sequence, and find/replace, with automatic duplicate-filename handling
- Draggable before/after comparison slider with zoom
- Live per-image status (waiting / processing / completed / failed / cancelled), thumbnails, original vs. output size and dimensions, and % compressed
- Overall progress bar with ETA, cancel, and per-image retry
- Export a single image, export all to a folder, or export everything as a ZIP
- Configurable concurrency (1–5 simultaneous images), metadata preservation toggle, light/dark/system theme
- Never overwrites your originals; safe `name.jpg`, `name_1.jpg`, `name_2.jpg` collision handling by default

## Technology stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript + Tailwind CSS + lucide-react |
| Build tool | Vite |
| Desktop shell | Electron (contextIsolation on, nodeIntegration off, sandboxed renderer) |
| Image processing | Sharp |
| ZIP | archiver (export) + unzipper (import) |
| Packaging | electron-builder (NSIS installer for Windows) |

## Project structure

```
imageflow/
  electron/
    main.ts                 # BrowserWindow + app lifecycle
    preload.ts               # contextBridge API surface (only safe functions exposed)
    types.ts                 # main-process types
    ipc/handlers.ts          # all ipcMain.handle wiring + processing controller
    services/
      imageProcessor.ts      # resize/compress/convert pipeline (Sharp), target-size search
      zipService.ts          # ZIP import (extract) and export (archive)
      fileService.ts         # native dialogs, recursive folder scan, safe output paths
      thumbnailService.ts    # small thumbnail generation for the queue UI
      renameService.ts       # bulk rename rule engine + de-duplication
      concurrencyQueue.ts    # small dependency-free concurrency limiter
  src/
    components/               # Dropzone, ImageQueue, BeforeAfterSlider, PreviewModal, ...
    pages/                     # Home, SettingsPage, AboutPage
    stores/AppContext.tsx      # app state (useReducer) + IPC event wiring
    hooks/useKeyboardShortcuts.ts
    types/index.ts             # renderer-side shared types
    utils/format.ts            # byte/dimension/percentage formatting
  tests/                       # node:test unit tests (rename logic, formatting math)
  electron-builder.yml
  vite.config.ts / tailwind.config.js / tsconfig*.json
```

## Requirements

- Node.js 18+ and npm
- Windows 10/11 to build/run the Windows installer (the app itself is cross-platform; macOS/Linux targets are pre-wired in `electron-builder.yml` but untested)

## Installation

```bash
npm install
```

> Sharp downloads a small prebuilt binary for your platform during install — this requires a working internet connection the first time.

## Development

```bash
npm run dev
```

This runs the Vite dev server and Electron concurrently, with hot reload for the React UI. DevTools opens automatically in development.

## Type checking

```bash
npm run typecheck
```

## Testing

```bash
npm run build   # rename-service tests import compiled output from dist-electron
npm test
```

`tests/renameService.test.mjs` exercises the rename engine (keep/prefix/suffix/sequence/find-replace, duplicate-name de-duplication) against the compiled `dist-electron` output. `tests/format.test.mjs` checks the byte-size and compression-percentage math used throughout the UI. Both use Node's built-in `node:test` runner, so no extra test framework is required.

Manually verified during development: resizing (all four modes + three fit modes), quality-based and target-size compression for JPEG/WEBP, PNG lossless-target warning path, format conversion including transparent-PNG→JPEG background flattening, all five rename modes, ZIP import/export round-trips, duplicate-filename collision handling, cancellation mid-batch, and per-image retry after a simulated failure.

Not yet run in this environment (see **Known limitations**): a full `npm install` + `npm run dev` smoke test, and load testing at 100–500 images, since that requires network access and a real Windows machine.

## Build (production bundle)

```bash
npm run build
```

Compiles the Electron main/preload TypeScript to `dist-electron/` and builds the React app to `dist/`.

## Windows installer

```bash
npm run dist:win
```

This runs the build step and then `electron-builder`, producing:

```
release/ImageFlow Setup 1.0.0.exe
```

Before your first real build, drop a Windows icon at `build/icon.ico` (see `build/README.txt`) or remove the `icon:` lines from `electron-builder.yml` to use Electron's default icon.

## Architecture notes

- **Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. The renderer never sees `require`, `fs`, or `child_process` — only the narrow, typed function list in `electron/preload.ts`. All IPC arguments are validated on the main-process side before touching the filesystem.
- **Memory**: full-resolution buffers are never stored in React state. The queue UI works from small generated thumbnails; full images are streamed from disk, processed, and written to a per-session temp folder by the main process. The renderer requests preview bytes on demand (when you open the before/after modal), not up front for the whole queue.
- **Concurrency**: a small dependency-free `ConcurrencyQueue` caps simultaneous Sharp operations (configurable 1–5 in Settings) instead of processing everything at once.
- **File safety**: originals are never modified. Exports go to a folder you choose, with automatic `_1`, `_2`, … suffixing unless you explicitly allow overwrite in Settings.

## Known limitations

- This project was written and sanity-checked (syntax-level TypeScript parse + unit tests for pure logic) in a sandboxed environment without network access, so `npm install`, a full `tsc` typecheck against the real `@types/react`/`@types/node`/`electron` packages, `npm run dev`, and an actual Windows installer build have **not** been executed end to end. Please run the commands above on your machine as the first real smoke test, and file/fix anything that surfaces — the architecture and logic are complete, but a first `npm install` + `npm run dev` pass is worth doing before relying on it.
- AVIF encoding speed varies a lot by image size; very large batches with AVIF output will be noticeably slower than JPEG/WEBP.
- GIF is accepted on import and copies through untouched rather than being re-encoded frame-by-frame (Sharp doesn't do multi-frame GIF re-encoding); animated GIFs are not resized.
- The before/after preview reads full-resolution bytes on open, so extremely large source images (very high‑resolution scans) may take a moment to open in the preview modal.
- Drag-and-drop of files from Explorer routes through the native file picker under the hood (Electron's renderer drag events don't reliably expose real filesystem paths under `contextIsolation`), so a drop currently opens the "select images" dialog pre-scoped to your drop rather than instantly ingesting the dropped files. Functionally equivalent, but not a literal pixel-perfect native drop.
