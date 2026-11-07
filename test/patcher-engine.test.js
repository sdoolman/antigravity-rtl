import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as asar from '@electron/asar';
import { patchAsar, restoreAsar, isAsarPatched } from '../web/patcher-engine.js';
import { PATCH_START } from '../web/payload-bundle.js';

test('patcher-engine: web patcher patches, updates, and restores app.asar correctly', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'web-patcher-test-'));
    const srcDir = path.join(tmpDir, 'source');
    fs.mkdirSync(path.join(srcDir, 'dist'), { recursive: true });
    const originalUtils = 'function launch(win, url) {\n    devTools: !electron_1.app.isPackaged,\n    void win.loadURL(url);\n}\n';
    fs.writeFileSync(path.join(srcDir, 'dist', 'utils.js'), originalUtils);

    const asarFile = path.join(tmpDir, 'app.asar');
    await asar.createPackage(srcDir, asarFile);

    const originalBuf = new Uint8Array(fs.readFileSync(asarFile));
    assert.equal(isAsarPatched(originalBuf), false);

    // Patch
    const { asar: patchedBuf, wasAlreadyPatched } = patchAsar(originalBuf);
    assert.equal(wasAlreadyPatched, false);
    assert.equal(isAsarPatched(patchedBuf), true);

    const patchedPath = path.join(tmpDir, 'patched.asar');
    fs.writeFileSync(patchedPath, Buffer.from(patchedBuf));
    asar.uncache(patchedPath);

    const extractedUtils = asar.extractFile(patchedPath, 'dist/utils.js').toString('utf8');
    assert.ok(extractedUtils.includes(PATCH_START));
    assert.ok(extractedUtils.includes('devTools: true'));

    // Re-patch (update)
    const { asar: rePatchedBuf, wasAlreadyPatched: wasPatchedSecondTime } = patchAsar(patchedBuf);
    assert.equal(wasPatchedSecondTime, true);
    assert.equal(isAsarPatched(rePatchedBuf), true);

    // Restore
    const restoredBuf = restoreAsar(rePatchedBuf);
    assert.equal(isAsarPatched(restoredBuf), false);

    const restoredPath = path.join(tmpDir, 'restored.asar');
    fs.writeFileSync(restoredPath, Buffer.from(restoredBuf));
    asar.uncache(restoredPath);

    const restoredUtils = asar.extractFile(restoredPath, 'dist/utils.js').toString('utf8');
    assert.equal(restoredUtils, originalUtils);
});
