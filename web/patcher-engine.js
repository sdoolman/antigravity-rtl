import { parseAsar, extractFileBytes, patchAndPackAsar } from './asar-engine.js';
import {
    RTL_PAYLOAD,
    VAZIRMATN_FONT_BASE64,
    ANCHOR,
    PATCH_START,
    PATCH_END,
    PATCH_BLOCK
} from './payload-bundle.js';

/**
 * Decodes base64 string to Uint8Array in browser and Node environments.
 * @param {string} b64
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(b64) {
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(b64, 'base64'));
    }
    const binStr = atob(b64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
}

/**
 * Strips the RTL patch block from utils.js source code.
 * @param {string} code
 * @returns {string | null}
 */
export function stripPatch(code) {
    return PATCH_BLOCK.test(code) ? code.replace(PATCH_BLOCK, ANCHOR) : null;
}

/**
 * Checks whether an asar Uint8Array is already patched.
 * @param {Uint8Array} asarBuffer
 * @returns {boolean}
 */
export function isAsarPatched(asarBuffer) {
    const parsed = parseAsar(asarBuffer);
    const utilsBytes = extractFileBytes(parsed, 'dist/utils.js');
    if (!utilsBytes) return false;
    const code = new TextDecoder('utf-8').decode(utilsBytes);
    return code.includes(PATCH_START);
}

/**
 * Patches an Antigravity app.asar buffer with RTL support.
 * @param {Uint8Array} asarBuffer
 * @returns {{ asar: Uint8Array; wasAlreadyPatched: boolean }}
 */
export function patchAsar(asarBuffer) {
    const parsed = parseAsar(asarBuffer);
    const utilsBytes = extractFileBytes(parsed, 'dist/utils.js');
    if (!utilsBytes) {
        throw new Error('dist/utils.js was not found inside the selected app.asar file.');
    }

    let utilsCode = new TextDecoder('utf-8').decode(utilsBytes);
    const wasAlreadyPatched = utilsCode.includes(PATCH_START);

    if (wasAlreadyPatched) {
        const cleaned = stripPatch(utilsCode);
        if (!cleaned) {
            throw new Error('Could not cleanly update existing RTL patch.');
        }
        utilsCode = cleaned;
    }

    if (!utilsCode.includes(ANCHOR)) {
        throw new Error('Target anchor (void win.loadURL(url);) not found in dist/utils.js. Unsupported app version.');
    }

    // Inject payload at anchor
    utilsCode = utilsCode.replace(ANCHOR, () => `${RTL_PAYLOAD.trimEnd()}\n${PATCH_END}`);
    utilsCode = utilsCode.replace(/devTools:\s*!electron_1?\.app\.isPackaged/g, 'devTools: true');

    const newUtilsBytes = new TextEncoder().encode(utilsCode);
    const fontBytes = base64ToUint8Array(VAZIRMATN_FONT_BASE64);

    const patchedAsar = patchAndPackAsar(parsed, {
        'dist/utils.js': newUtilsBytes,
        'dist/Vazirmatn-Variable.woff2': fontBytes
    });

    return {
        asar: patchedAsar,
        wasAlreadyPatched
    };
}

/**
 * Restores original unpatched app.asar from a patched one.
 * @param {Uint8Array} asarBuffer
 * @returns {Uint8Array}
 */
export function restoreAsar(asarBuffer) {
    const parsed = parseAsar(asarBuffer);
    const utilsBytes = extractFileBytes(parsed, 'dist/utils.js');
    if (!utilsBytes) {
        throw new Error('dist/utils.js was not found inside the selected app.asar file.');
    }

    const utilsCode = new TextDecoder('utf-8').decode(utilsBytes);
    if (!utilsCode.includes(PATCH_START)) {
        throw new Error('This app.asar is not currently patched with RTL.');
    }

    let restoredCode = stripPatch(utilsCode);
    if (!restoredCode) {
        throw new Error('Failed to cleanly strip RTL patch block.');
    }

    restoredCode = restoredCode.replace(/devTools:\s*true/g, 'devTools: !electron_1.app.isPackaged');
    const restoredBytes = new TextEncoder().encode(restoredCode);
    return patchAndPackAsar(parsed, {
        'dist/utils.js': restoredBytes
    });
}
