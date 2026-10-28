Place icon.ico (Windows), icon.icns (macOS) and icon.png (Linux, 512x512) in this folder
before running `npm run dist`. electron-builder will fail without a Windows icon file
present at build/icon.ico, or you can remove the "icon" lines from electron-builder.yml
to use the default Electron icon for a first test build.
