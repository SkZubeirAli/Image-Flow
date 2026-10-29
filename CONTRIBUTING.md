# Contributing to ImageFlow

Thanks for your interest in improving ImageFlow!

## Getting set up

1. Fork the repository and clone your fork.
2. Install Node.js 18+ and run `npm install`.
3. Start the app with `npm run dev`.

## Making changes

1. Create a branch: `git checkout -b feature/short-description`.
2. Keep changes focused; one feature or fix per pull request.
3. Before opening a PR, make sure these pass:
   ```bash
   npm run typecheck
   npm run build
   npm test
   ```
4. Update `CHANGELOG.md` under "Unreleased" and the README if behaviour changes.

## Code guidelines

- TypeScript everywhere; avoid `any` where a real type is practical.
- Keep Electron security intact: no `nodeIntegration`, and expose new capabilities only through `electron/preload.ts` with validated arguments.
- Do not keep full-resolution images in React state; use thumbnails for the UI.
- Never overwrite a user's original files.

## Commit messages

Short, imperative, descriptive, e.g. `Fix target-size search for WebP`.

## Reporting bugs and requesting features

Use the issue templates. For bugs, include your Windows version, Node version, steps to reproduce, and any error text from the app or terminal.
