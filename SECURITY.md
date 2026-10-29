# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems.
Report them privately using GitHub's "Report a vulnerability" option under the repository's **Security** tab, or contact the maintainer directly.

Include what you found, how to reproduce it, and the version affected. You can expect an acknowledgement within a few days.

## Scope

ImageFlow processes files locally and makes no network requests for image processing. Areas of particular interest: the Electron preload/IPC boundary, ZIP extraction (path traversal) and file-writing logic.
