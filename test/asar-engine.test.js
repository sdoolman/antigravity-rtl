import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as asar from '@electron/asar';
import { parseAsar, findEntry, extractFileBytes, patchAndPackAsar } from '../web/asar-engine.js';

test('asar-engine: parses real ASAR, replaces a file, appends a new file, and verifies with @electron/asar', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asar-engine-test-'));
    const srcDir = path.join(tmpDir, 'source');
    fs.mkdirSync(path.join(srcDir, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(srcDir, 'dist', 'utils.js'), 'void win.loadURL(url);');
    fs.writeFileSync(path.join(srcDir, 'dist', 'other.txt'), 'keep this untouched');

    const asarFile = path.join(tmpDir, 'app.asar');
    await asar.createPackage(srcDir, asarFile);

    // 1. Read buffer and parse with our pure-JS engine
    const rawBytes = fs.readFileSync(asarFile);
    const parsed = parseAsar(new Uint8Array(rawBytes));

    assert.ok(parsed.header.files.dist);
    assert.ok(findEntry(parsed.header, 'dist/utils.js'));

    const originalUtilsBytes = extractFileBytes(parsed, 'dist/utils.js');
    assert.equal(new TextDecoder().decode(originalUtilsBytes), 'void win.loadURL(url);');

    // 2. Perform replacement and append new font
    const newUtilsContent = new TextEncoder().encode('/* PATCHED */ void win.loadURL(url);');
    const newFontContent = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

    const repackedBytes = patchAndPackAsar(parsed, {
        'dist/utils.js': newUtilsContent,
        'dist/custom-asset.bin': newFontContent
    });

    const repackedFile = path.join(tmpDir, 'repacked.asar');
    fs.writeFileSync(repackedFile, Buffer.from(repackedBytes));

    // 3. Verify with official @electron/asar
    asar.uncache(repackedFile);
    const extractedUtils = asar.extractFile(repackedFile, 'dist/utils.js').toString('utf8');
    assert.equal(extractedUtils, '/* PATCHED */ void win.loadURL(url);');

    const extractedOther = asar.extractFile(repackedFile, 'dist/other.txt').toString('utf8');
    assert.equal(extractedOther, 'keep this untouched');

    const extractedAsset = asar.extractFile(repackedFile, 'dist/custom-asset.bin');
    assert.deepEqual(Array.from(extractedAsset), [0x01, 0x02, 0x03, 0x04]);
});
