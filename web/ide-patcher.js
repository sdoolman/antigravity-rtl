import {
    IDE_HOOK,
    IDE_CLIENT_CODE,
    IDE_MAIN_CODE
} from './payload-bundle.js';

/**
 * Checks whether an Antigravity IDE directory is already patched.
 * @param {FileSystemDirectoryHandle} outDirHandle
 * @returns {Promise<boolean>}
 */
export async function isIdePatched(outDirHandle) {
    try {
        const mainFileHandle = await outDirHandle.getFileHandle('main.js');
        const file = await mainFileHandle.getFile();
        const code = await file.text();
        return code.includes(IDE_HOOK);
    } catch (_) {
        return false;
    }
}

/**
 * Patches Antigravity IDE via FileSystemDirectoryHandle (out/ directory).
 * @param {FileSystemDirectoryHandle} outDirHandle
 * @returns {Promise<{ success: boolean; wasAlreadyPatched: boolean }>}
 */
export async function patchIdeDirectory(outDirHandle) {
    const mainFileHandle = await outDirHandle.getFileHandle('main.js');
    const mainFile = await mainFileHandle.getFile();
    const mainCode = await mainFile.text();

    const wasAlreadyPatched = mainCode.includes(IDE_HOOK);

    if (!wasAlreadyPatched) {
        // Backup original main.js to main.js.rtl-bak
        try {
            const bakHandle = await outDirHandle.getFileHandle('main.js.rtl-bak', { create: true });
            const bakWritable = await bakHandle.createWritable();
            await bakWritable.write(mainCode);
            await bakWritable.close();
        } catch (_) {}

        // Prepend hook
        const patchedMainCode = `${IDE_HOOK}\n${mainCode}`;
        const mainWritable = await mainFileHandle.createWritable();
        await mainWritable.write(patchedMainCode);
        await mainWritable.close();
    }

    // Write companion client script
    const clientHandle = await outDirHandle.getFileHandle('antigravity-rtl-client.js', { create: true });
    const clientWritable = await clientHandle.createWritable();
    await clientWritable.write(IDE_CLIENT_CODE);
    await clientWritable.close();

    // Write companion main script
    const mainHookHandle = await outDirHandle.getFileHandle('antigravity-rtl-main.js', { create: true });
    const mainHookWritable = await mainHookHandle.createWritable();
    await mainHookWritable.write(IDE_MAIN_CODE);
    await mainHookWritable.close();

    return {
        success: true,
        wasAlreadyPatched
    };
}

/**
 * Restores original Antigravity IDE files from backup.
 * @param {FileSystemDirectoryHandle} outDirHandle
 * @returns {Promise<boolean>}
 */
export async function restoreIdeDirectory(outDirHandle) {
    let restored = false;

    // Check for backup file
    try {
        const bakHandle = await outDirHandle.getFileHandle('main.js.rtl-bak');
        const bakFile = await bakHandle.getFile();
        const originalCode = await bakFile.text();

        const mainHandle = await outDirHandle.getFileHandle('main.js');
        const mainWritable = await mainHandle.createWritable();
        await mainWritable.write(originalCode);
        await mainWritable.close();

        await outDirHandle.removeEntry('main.js.rtl-bak');
        restored = true;
    } catch (_) {}

    if (!restored) {
        // Fallback: strip hook line from main.js
        const mainHandle = await outDirHandle.getFileHandle('main.js');
        const mainFile = await mainHandle.getFile();
        let code = await mainFile.text();
        if (code.includes(IDE_HOOK)) {
            code = code.replace(IDE_HOOK + '\n', '').replace(IDE_HOOK, '');
            const mainWritable = await mainHandle.createWritable();
            await mainWritable.write(code);
            await mainWritable.close();
            restored = true;
        }
    }

    // Clean companion files if present
    try { await outDirHandle.removeEntry('antigravity-rtl-client.js'); } catch (_) {}
    try { await outDirHandle.removeEntry('antigravity-rtl-main.js'); } catch (_) {}

    return restored;
}
