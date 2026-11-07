<div align="center">

# Antigravity RTL

**Seamless Right-to-Left (RTL) UI & Hebrew Typography for Google Antigravity & Antigravity IDE.**

Read and write naturally in Hebrew and RTL languages without disrupting English text, terminal, or code blocks.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.12-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Checked-3178C6.svg)](tsconfig.json)
[![Web Patcher](https://img.shields.io/badge/Web%20Patcher-Live%20on%20GitHub%20Pages-2ea44f.svg)](https://sdoolman.github.io/antigravity-rtl/)

[🚀 Open Live Web Patcher](https://sdoolman.github.io/antigravity-rtl/) · [CLI Install](#-option-2-cli-terminal) · [CLI Flags](#cli-options--flags) · [Uninstall](#uninstall--restore) · [License](#license)

</div>

---

## ✨ Features

- **Full Hebrew & BiDi Support**: First-class detection and alignment for Hebrew mixed with English words, digits, version numbers, percentages, currency (`₪`), and punctuation.
- **Code & Terminal LTR Isolation**: Monaco editor, terminal, backticks, and inline code blocks remain strictly Left-to-Right (`unicode-bidi: isolate !important`).
- **Zero-Install Web Patcher**: Patch your `app.asar` directly inside Chrome/Edge using the native File System Access API — zero terminal commands, zero Node.js installation, 100% private in local browser memory.
- **Hosted Live on GitHub Pages**: Available out-of-the-box at [sdoolman.github.io/antigravity-rtl](https://sdoolman.github.io/antigravity-rtl/).
- **Dual App Support**: Auto-detects and patches both **Antigravity (Standalone Desktop App)** and **Antigravity IDE** (VS Code Edition).
- **Clean & Debloated**: Zero nagware popups, zero network telemetry, zero foreign prompts, zero bloat.
- **Native System Typography**: Defaulted to modern Hebrew system fonts (**Heebo**, **Assistant**, **Rubik**, **Segoe UI**, **Arial**) with live typography controls for font size and line height.
- **Quick Keyboard Shortcut**: Toggle RTL on the fly with `Alt+R` (Windows/Linux) or `⌥R` (macOS).

---

## 🚀 Installation

### 🌐 Option 1: Zero-Install Web Patcher (Recommended)

If you prefer not to install Node.js, npm, or run terminal commands:

1. Open the **[Live Web Patcher](https://sdoolman.github.io/antigravity-rtl/)** in Chrome, Edge, or Brave.
2. Click **Select `app.asar`** (or drag and drop it into the window).
3. The browser patches your file 100% locally in browser memory in under a second (zero uploads, completely private).

#### Default `app.asar` locations:
- **Windows**: `%LOCALAPPDATA%\Programs\antigravity\resources\app.asar`
- **macOS**: `/Applications/Antigravity.app/Contents/Resources/app.asar`
- **Linux**: `/opt/Antigravity/resources/app.asar`

---

### 💻 Option 2: CLI (Terminal)

> **Before running the patch:** Close Antigravity and Antigravity IDE if open.

Run the clean, debloated fork directly from GitHub:

#### macOS
```bash
npx github:sdoolman/antigravity-rtl
```
*(If you encounter permission issues, grant App Management to your terminal in **System Settings → Privacy & Security → App Management**).*

#### Linux
```bash
sudo npx github:sdoolman/antigravity-rtl
```

#### Windows (PowerShell as Administrator)
```powershell
npx github:sdoolman/antigravity-rtl
```

---

## ⚙️ CLI Options & Flags

| Command / Flag | Description |
| :--- | :--- |
| `npx github:sdoolman/antigravity-rtl` | **Auto-detect & patch**: Patches both Antigravity & Antigravity IDE if detected |
| `npx github:sdoolman/antigravity-rtl --app` | Patch Antigravity Standalone Desktop App only |
| `npx github:sdoolman/antigravity-rtl --ide` | Patch Antigravity IDE only |
| `npx github:sdoolman/antigravity-rtl --restore` | Revert changes and restore original clean backups for all apps |
| `npx github:sdoolman/antigravity-rtl --restore --app` | Revert Standalone App only |
| `npx github:sdoolman/antigravity-rtl --restore --ide` | Revert Antigravity IDE only |
| `npx github:sdoolman/antigravity-rtl --path "/path/to/app"` | Specify a custom path to `app.asar` or IDE installation directory |
| `npx github:sdoolman/antigravity-rtl --browser` | Generates unpacked Chrome/Arc browser extension for remote control mode |

---

## ↺ Uninstall / Restore

To completely remove the patch and revert to your original, clean application files:

```bash
npx github:sdoolman/antigravity-rtl --restore
```

Or for a specific version:
```bash
npx github:sdoolman/antigravity-rtl --restore --app
npx github:sdoolman/antigravity-rtl --restore --ide
```

---

## 🛠️ Development & Testing

All tests use Node.js's native test runner (`node --test`) and TypeScript static checking with zero build overhead:

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
