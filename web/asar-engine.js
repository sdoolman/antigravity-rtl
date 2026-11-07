/**
 * Pure JavaScript in-memory ASAR parser and packer.
 * Compatible with Node.js and modern Web Browsers (zero dependencies).
 */

/**
 * @typedef {Object} AsarParsed
 * @property {Record<string, any>} header
 * @property {number} dataOffset
 * @property {Uint8Array} raw
 */

/**
 * Parses an ASAR archive from a Uint8Array buffer.
 * @param {Uint8Array} buf
 * @returns {AsarParsed}
 */
export function parseAsar(buf) {
    if (buf.byteLength < 16) {
        throw new Error('File too small to be a valid ASAR archive.');
    }
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const magic = view.getUint32(0, true);
    if (magic !== 4) {
        throw new Error('Invalid ASAR magic header.');
    }
    const sizeOfHeader = view.getUint32(4, true);
    const pickleHeaderSize = view.getUint32(8, true);
    const headerLen = view.getUint32(12, true);

    if (sizeOfHeader + 8 > buf.byteLength) {
        throw new Error('Truncated ASAR file: header exceeds file size.');
    }

    const headerBytes = buf.subarray(16, 16 + headerLen);
    const headerJson = JSON.parse(new TextDecoder('utf-8').decode(headerBytes));
    const dataOffset = sizeOfHeader + 8;

    return {
        header: headerJson,
        dataOffset,
        raw: buf
    };
}

/**
 * Traverses the ASAR header tree to locate a file entry.
 * @param {Record<string, any>} header
 * @param {string} filePath
 * @returns {Record<string, any> | null}
 */
export function findEntry(header, filePath) {
    const parts = filePath.split('/').filter(Boolean);
    let current = header;
    for (const part of parts) {
        if (!current || !current.files || !current.files[part]) {
            return null;
        }
        current = current.files[part];
    }
    return current;
}

/**
 * Extracts a file's contents as a Uint8Array.
 * @param {AsarParsed} parsed
 * @param {string} filePath
 * @returns {Uint8Array | null}
 */
export function extractFileBytes(parsed, filePath) {
    const entry = findEntry(parsed.header, filePath);
    if (!entry || entry.offset === undefined || entry.size === undefined) {
        return null;
    }
    const start = parsed.dataOffset + Number(entry.offset);
    return parsed.raw.subarray(start, start + entry.size);
}

/**
 * Ensures directory path exists in the ASAR tree.
 * @param {Record<string, any>} header
 * @param {string} dirPath
 * @returns {Record<string, any>}
 */
function ensureDirectory(header, dirPath) {
    const parts = dirPath.split('/').filter(Boolean);
    let current = header;
    for (const part of parts) {
        if (!current.files) current.files = {};
        if (!current.files[part]) {
            current.files[part] = { files: {} };
        }
        current = current.files[part];
    }
    return current;
}

/**
 * Re-packs an ASAR archive with updated or new file contents.
 * @param {AsarParsed} parsed Original parsed ASAR
 * @param {Record<string, Uint8Array>} modifications Map of relative path -> new Uint8Array contents
 * @returns {Uint8Array} The freshly packed ASAR buffer
 */
export function patchAndPackAsar(parsed, modifications) {
    // Deep clone the header
    const newHeader = JSON.parse(JSON.stringify(parsed.header));

    // Gather all existing files
    /** @type {Array<{ path: string; origOffset: number; origSize: number; isModified: boolean }>} */
    const fileList = [];

    /**
     * @param {Record<string, any>} currentObj
     * @param {string} prefix
     */
    function walk(currentObj, prefix = '') {
        if (!currentObj || !currentObj.files) return;
        for (const [name, info] of Object.entries(currentObj.files)) {
            const fullPath = prefix ? `${prefix}/${name}` : name;
            if (info.files) {
                walk(info, fullPath);
            } else if (info.offset !== undefined) {
                fileList.push({
                    path: fullPath,
                    origOffset: Number(info.offset),
                    origSize: info.size,
                    isModified: Object.prototype.hasOwnProperty.call(modifications, fullPath)
                });
            }
        }
    }
    walk(newHeader);

    // Sort by original offset to preserve payload ordering where possible
    fileList.sort((a, b) => a.origOffset - b.origOffset);

    // Track which modifications were replacements vs new files
    const handledModifications = new Set();

    /** @type {Array<{ path: string; data: Uint8Array }>} */
    const outputFiles = [];

    for (const item of fileList) {
        if (item.isModified) {
            outputFiles.push({ path: item.path, data: modifications[item.path] });
            handledModifications.add(item.path);
        } else {
            const start = parsed.dataOffset + item.origOffset;
            const slice = parsed.raw.subarray(start, start + item.origSize);
            outputFiles.push({ path: item.path, data: slice });
        }
    }

    // Append any brand-new files not previously in the ASAR (e.g. font files)
    for (const [modPath, data] of Object.entries(modifications)) {
        if (!handledModifications.has(modPath)) {
            outputFiles.push({ path: modPath, data });
            const dir = modPath.includes('/') ? modPath.substring(0, modPath.lastIndexOf('/')) : '';
            const base = modPath.includes('/') ? modPath.substring(modPath.lastIndexOf('/') + 1) : modPath;
            const targetDir = ensureDirectory(newHeader, dir);
            targetDir.files[base] = { size: data.length, offset: '0' };
        }
    }

    // Calculate new offsets and update header entries
    let currentDataOffset = 0;
    let totalPayloadSize = 0;

    for (const file of outputFiles) {
        const entry = findEntry(newHeader, file.path);
        if (entry) {
            entry.offset = String(currentDataOffset);
            entry.size = file.data.byteLength;
            delete entry.integrity; // Remove stale integrity hash
        }
        currentDataOffset += file.data.byteLength;
        totalPayloadSize += file.data.byteLength;
    }

    // Encode Header JSON
    const headerJsonStr = JSON.stringify(newHeader);
    const headerBytes = new TextEncoder().encode(headerJsonStr);
    const hLen = headerBytes.byteLength;
    const alignedLen = (hLen + 3) & ~3;
    const pickleHeaderSize = alignedLen + 4;
    const totalHeaderSize = pickleHeaderSize + 4;
    const fullHeaderSize = 16 + alignedLen;

    const totalAsarSize = fullHeaderSize + totalPayloadSize;
    const result = new Uint8Array(totalAsarSize);
    const view = new DataView(result.buffer, result.byteOffset, result.byteLength);

    // 16-byte header
    view.setUint32(0, 4, true);
    view.setUint32(4, totalHeaderSize, true);
    view.setUint32(8, pickleHeaderSize, true);
    view.setUint32(12, hLen, true);

    result.set(headerBytes, 16);
    // (zeros padding is already zeroed by new Uint8Array)

    // Write file payloads
    let writePos = fullHeaderSize;
    for (const file of outputFiles) {
        result.set(file.data, writePos);
        writePos += file.data.byteLength;
    }

    return result;
}
