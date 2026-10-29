# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [1.0.0] - 2026-10-15

### Added
- Bulk import by files, folder and ZIP
- Resize (width, height, exact, percentage) with Fit / Fill / Stretch
- Quality-based and target-file-size compression
- Format conversion (JPEG, PNG, WebP, AVIF)
- Bulk rename with duplicate handling
- Before/after comparison slider with zoom
- Export single, all, or as ZIP
- Progress, cancel and retry
- Light, dark and system themes

### Fixed
- TypeScript errors with newer `sharp` type definitions
- Blank window in development caused by a too-strict Content-Security-Policy
