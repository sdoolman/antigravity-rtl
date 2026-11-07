#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import picocolors from 'picocolors';
import prompts from 'prompts';

import {
    patchApp,
    restoreApp,
    getAppAsarPath,
    detectAppAsarPath,
    hasAppBackup
} from './patch-app.js';
import {
    patchIde,
    restoreIde,
    getIdeAppPath,
    detectIdeAppPath,
    resolveIdeAppDir,
    hasIdeBackup
} from './patch-ide.js';

import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { cyan, bold, blue, green, yellow } = picocolors;

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

function printBanner() {
    console.log(bold(cyan(`\n  Antigravity RTL Patcher v${pkg.version}\n`)));
}

printBanner();

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage:
  npx antigravity-rtl [options] [path]

Options:
  --ide              Patch or restore Antigravity IDE only (VS Code Edition)
  --app              Patch or restore Antigravity Standalone App only
  -r, --restore      Revert changes and restore original backup files
  --path <dir/file>  Specify custom path to IDE directory or app.asar
  --browser          Install the Remote Control browser extension folder
  -h, --help         Show this help message

Default Behavior:
  Running without --app or --ide will auto-detect installed applications:
  • If both Antigravity and Antigravity IDE are found, both will be patched.
  • If only one is found, that one will be patched.
  • Running with --restore will restore all detected applications with backups.

Examples:
  npx antigravity-rtl               # Auto-detect and patch both/available apps
  npx antigravity-rtl --ide         # Patch only Antigravity IDE
  npx antigravity-rtl --app         # Patch only Antigravity Standalone App
  npx antigravity-rtl --restore     # Restore all detected patched apps
  npx antigravity-rtl -r --ide      # Restore only Antigravity IDE
  npx antigravity-rtl --browser     # Extension for Remote Control in Chrome/Arc
`);
    process.exit(0);
}

function installBrowserExtension() {
    const dest = path.join(os.homedir(), '.antigravity-rtl-extension');
    const extDir = path.join(__dirname, '..', 'extension');
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(path.join(extDir, 'manifest.json'), path.join(dest, 'manifest.json'));
    fs.copyFileSync(path.join(__dirname, 'remote-client.js'), path.join(dest, 'content.js'));
    fs.copyFileSync(path.join(__dirname, 'Vazirmatn-Variable.woff2'), path.join(dest, 'Vazirmatn-Variable.woff2'));
    console.log(green(`\nRemote Control extension ready:\n  ${dest}\n`));
    console.log('The remote UI is a cross-origin iframe, so the desktop patch cannot reach it.');
    console.log('In Chrome or Arc: open the extensions page, turn on Developer Mode,');
    console.log('then Load unpacked and choose the folder above. Reload the remote tab.');
    console.log(yellow('Browser settings are stored in the extension, separate from ~/.antigravity-rtl.json.\n'));
    const openCmd = process.platform === 'darwin' ? `open "${dest}"` : process.platform === 'win32' ? `explorer "${dest}"` : `xdg-open "${dest}"`;
    exec(openCmd, () => {});
}

if (args.includes('--browser')) {
    installBrowserExtension();
    process.exit(0);
}

const isRestore = args.includes('--restore') || args.includes('-r');
const forceIde = args.includes('--ide');
const forceApp = args.includes('--app');

// Find custom path argument if provided e.g. --path /foo/bar or last positional argument
let customPath = null;
const pathArgIdx = args.indexOf('--path');
if (pathArgIdx !== -1 && args[pathArgIdx + 1]) {
    customPath = args[pathArgIdx + 1];
} else {
    const nonFlags = args.filter(a => !a.startsWith('-'));
    if (nonFlags.length > 0) {
        customPath = nonFlags[0];
    }
}

async function main() {
    const [runApp, runIde, verb] = isRestore
        ? [restoreApp, restoreIde, 'restore']
        : [patchApp, patchIde, 'patch'];
    let ok = false;

    if (customPath) {
        const ideDir = resolveIdeAppDir(customPath);
        ok = (forceIde || ideDir) ? await runIde(ideDir || customPath) : await runApp(customPath);
    } else if (forceApp && !forceIde) {
        ok = await runApp(await getAppAsarPath());
    } else if (forceIde && !forceApp) {
        ok = await runIde(await getIdeAppPath());
    } else {
        const appPath = detectAppAsarPath();
        const ideDir = detectIdeAppPath();

        if (!appPath && !ideDir) {
            console.log(yellow('⚠ Could not automatically locate Antigravity or Antigravity IDE.'));
            const { target } = await prompts({
                type: 'select',
                name: 'target',
                message: `Which application would you like to ${verb}?`,
                choices: [
                    { title: 'Antigravity IDE (VS Code Edition)', value: 'ide' },
                    { title: 'Antigravity (Standalone App)', value: 'app' }
                ],
                initial: 0
            });
            if (!target) process.exit(0);
            ok = target === 'ide' ? await runIde(await getIdeAppPath()) : await runApp(await getAppAsarPath());
        } else {
            const targets = [
                appPath && { name: 'Antigravity (Standalone App)', run: o => runApp(appPath, o), hasBackup: hasAppBackup(appPath) },
                ideDir && { name: 'Antigravity IDE', run: o => runIde(ideDir, o), hasBackup: hasIdeBackup(ideDir) }
            ].filter(t => t && (!isRestore || t.hasBackup));

            if (targets.length === 0) {
                console.log(yellow('⚠ No backup files found to restore for detected application(s).\n'));
                return;
            }

            const multi = targets.length > 1;
            if (multi && !isRestore) {
                console.log(bold(cyan('ℹ Found both Antigravity (Standalone App) and Antigravity IDE!')));
                console.log(bold(cyan('  Patching both applications...\n')));
            }
            for (const [i, t] of targets.entries()) {
                if (isRestore) console.log(blue(`ℹ Found backup for ${t.name}. Restoring...`));
                else if (multi) console.log(bold(`${i ? '\n' : ''}--- ${i + 1}/2: ${t.name} ---`));
                else console.log(blue(`ℹ Found ${t.name}. Patching...\n`));
                if (await t.run({ exitOnError: !multi })) ok = true;
            }
            if (multi && ok && !isRestore) {
                console.log(bold(green('\n✨ Done! Please restart your application(s) to enjoy RTL.\n')));
            }
        }
    }

    if (ok && !isRestore) {
        console.log(cyan('\nRemote Control in the browser is separate. Set it up with: npx antigravity-rtl --browser\n'));
    }
}

main().catch(e => {
    console.error('\n✖ An unexpected error occurred:', e.message);
    process.exit(1);
});
