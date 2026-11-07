<div align="center">

# Antigravity RTL

**Seamless Right-to-Left (RTL) UI & Hebrew Typography for Google Antigravity & Antigravity IDE.**

Read and write naturally in Hebrew and RTL languages without disrupting English text, terminal, or code blocks.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Checked-3178C6.svg)](tsconfig.json)
[![Cloudflare Ready](https://img.shields.io/badge/Cloudflare-Worker%20%2F%20Pages-F38020.svg)](wrangler.toml)

[Web Patcher](#-option-1-zero-install-web-patcher) · [CLI Install](#-option-2-cli-terminal) · [CLI Flags](#cli-options--flags) · [Uninstall](#uninstall--restore) · [License](#license)

</div>

---

## ✨ Features

- **Full Hebrew & BiDi Support**: First-class handling of Hebrew text mixed with English, numbers, version strings, currency, and punctuation.
- **Code & Terminal LTR Isolation**: Monaco editor, terminal, backticks, and inline code blocks remain strictly Left-to-Right (`unicode-bidi: isolate`).
- **Zero-Install Web Patcher**: Patch your `app.asar` directly inside Chrome/Edge using the native File System Access API — zero terminal commands, zero Node.js installation, 100% private in browser memory.
- **Deploy to Cloudflare**: Ready to deploy as a Cloudflare Worker or Cloudflare Pages static web app (`npx wrangler deploy`).
- **Supports Both Apps**: Auto-detects and patches **Antigravity (Standalone Desktop App)** and **Antigravity IDE** (VS Code Edition).
- **Clean & Debloated**: Zero nagware popups, zero network telemetry, zero foreign prompts, zero bloat.
- **Native System Typography**: Optimized for modern Hebrew system fonts (**Heebo**, **Assistant**, **Rubik**, **Segoe UI**, **Arial**) with live typography sliders for font size and line height.
- **Quick Keyboard Shortcut**: Toggle RTL on the fly with `Alt+R` (Windows/Linux) or `⌥R` (macOS).

---

## 🚀 Installation

### 🌐 Option 1: Zero-Install Web Patcher

If you prefer not to install Node.js, npm, or run terminal commands:

1. Open [`web/index.html`](web/index.html) in your browser (or your deployed Cloudflare Worker).
2. Click **Select `app.asar`** (or drag and drop it into the window).
3. The browser patches your file 100% locally in browser memory in under a second (zero uploads, completely private).

#### Default `app.asar` paths:
- **Windows**: `%LOCALAPPDATA%\Programs\antigravity\resources\app.asar`
- **macOS**: `/Applications/Antigravity.app/Contents/Resources/app.asar`
- **Linux**: `/opt/Antigravity/resources/app.asar`

> **Deploy your own Web Patcher to Cloudflare:**
> ```bash
> npx wrangler deploy
> ```

---

### 💻 Option 2: CLI (Terminal)

> **Before running the patch:** Close Antigravity and Antigravity IDE if open.

#### macOS
```bash
npx antigravity-rtl
```
*(If you encounter permission issues, grant App Management to your terminal in **System Settings → Privacy & Security → App Management**).*

#### Linux
```bash
sudo npx antigravity-rtl
```

#### Windows (PowerShell as Administrator)
```powershell
npx antigravity-rtl
```

---

## ⚙️ CLI Options & Flags

| Flag | Description |
| :--- | :--- |
| `npx antigravity-rtl` | **Auto-detect & patch**: Patches both Antigravity & Antigravity IDE if detected |
| `npx antigravity-rtl --app` | Patch Antigravity Standalone Desktop App only |
| `npx antigravity-rtl --ide` | Patch Antigravity IDE only |
| `npx antigravity-rtl --restore` | Revert changes and restore original clean backups for all apps |
| `npx antigravity-rtl --restore --app` | Revert Standalone App only |
| `npx antigravity-rtl --restore --ide` | Revert Antigravity IDE only |
| `npx antigravity-rtl --path "/path/to/app"` | Specify a custom path to `app.asar` or IDE installation directory |
| `npx antigravity-rtl --browser` | Generates unpacked Chrome/Arc browser extension for remote control mode |

---

## ↺ Uninstall / Restore

To completely remove the patch and revert to your original, clean application files:

```bash
npx antigravity-rtl --restore
```

Or for a specific version:
```bash
npx antigravity-rtl --restore --app
npx antigravity-rtl --restore --ide
```

---

## 🛠️ Development & Testing

All tests use Node.js's native test runner (`node --test`) and TypeScript static checking:

```bash
# Run test suite (12 tests covering ASAR engine, BiDi detector, and patchers)
npm test

# Run TypeScript typecheck
npm run typecheck

# Rebuild web patcher payload bundle
npm run build:web
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

- Original work Copyright (c) 2026 mmnaderi.
- Fork enhancements, Hebrew typography, and Web Patcher Copyright (c) 2026 [sdoolman](https://github.com/sdoolman).
