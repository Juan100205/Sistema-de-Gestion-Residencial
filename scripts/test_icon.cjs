/**
 * TDD Test: App Icon Verification
 *
 * Verifies that:
 * 1. The icon file (RianoDev.ico) exists at the expected path
 * 2. The icon file is a valid .ico (correct magic bytes)
 * 3. The icon file is not empty (0 bytes)
 * 4. main.js references the icon using a filesystem path (not a Vite import)
 *
 * Usage: node scripts/test_icon.cjs
 * Pass criteria: all 4 checks green
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ICON_PATH = path.join(PROJECT_ROOT, 'src', 'assets', 'RianoDev.ico');
const MAIN_JS_PATH = path.join(PROJECT_ROOT, 'src', 'main.js');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
        failed++;
    }
}

console.log('\n=========================================');
console.log('  TDD: App Icon Verification');
console.log('=========================================\n');

// ── Test 1: Icon file exists ──────────────────────────
console.log('1. Icon file exists');
const iconExists = fs.existsSync(ICON_PATH);
assert(`File exists at: src/assets/RianoDev.ico`, iconExists, `Path: ${ICON_PATH}`);

// ── Test 2: Icon is not empty ─────────────────────────
console.log('\n2. Icon file is not empty');
if (iconExists) {
    const stats = fs.statSync(ICON_PATH);
    const sizeKB = (stats.size / 1024).toFixed(1);
    assert(`File size > 0 bytes (actual: ${sizeKB} KB)`, stats.size > 0);
} else {
    assert('File size > 0 bytes', false, 'Cannot check — file missing');
}

// ── Test 3: Valid .ico magic bytes ────────────────────
console.log('\n3. Icon file is a valid .ico format');
if (iconExists) {
    const buf = Buffer.alloc(4);
    const fd = fs.openSync(ICON_PATH, 'r');
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    // ICO magic: first 4 bytes = 00 00 01 00
    const isValidIco = buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00;
    assert(
        `Valid ICO magic bytes (00 00 01 00), got: ${buf.toString('hex').toUpperCase().match(/../g).join(' ')}`,
        isValidIco
    );
} else {
    assert('Valid ICO magic bytes', false, 'Cannot check — file missing');
}

// ── Test 4: main.js uses filesystem path, not Vite import ──
console.log('\n4. main.js uses filesystem path for icon (no Vite import)');
const mainSource = fs.readFileSync(MAIN_JS_PATH, 'utf8');

const hasViteImport = /import\s+\w+\s+from\s+['"][^'"]*\.ico['"]/i.test(mainSource);
assert(
    `No broken Vite import for .ico file`,
    !hasViteImport,
    hasViteImport ? 'Found: import ... from *.ico — this blocks for 3+ minutes!' : ''
);

const usesGetAppPath = mainSource.includes('getAppPath') || mainSource.includes('RianoDev.ico');
assert(
    `Icon is referenced in main.js`,
    usesGetAppPath,
    usesGetAppPath ? '' : 'Icon path not found in main.js — icon may not be set'
);

// ── Summary ───────────────────────────────────────────
console.log('\n=========================================');
console.log('  RESULTS');
console.log('=========================================');
console.log(`  Passed: ${passed}  Failed: ${failed}`);
console.log(`  Status: ${failed === 0 ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
console.log('=========================================\n');

process.exit(failed === 0 ? 0 : 1);
