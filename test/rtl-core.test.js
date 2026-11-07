import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_PATH = path.join(__dirname, '..', 'bin', 'rtl-core.js');

function createMockEnvironment() {
    const listeners = {};
    const mutationCallbacks = [];

    function mockElement(tag = 'div') {
        const attributes = {};
        const children = [];
        return {
            tagName: tag.toUpperCase(),
            attributes,
            children,
            parentElement: null,
            textContent: '',
            value: '',
            getAttribute(k) { return attributes[k] ?? null; },
            setAttribute(k, v) { attributes[k] = String(v); },
            hasAttribute(k) { return Object.prototype.hasOwnProperty.call(attributes, k); },
            removeAttribute(k) { delete attributes[k]; },
            closest(selector) { return null; },
            appendChild(child) {
                child.parentElement = this;
                children.push(child);
                return child;
            }
        };
    }

    const docElements = [];

    const mockDocument = {
        querySelectorAll(selector) {
            if (selector.includes('[contenteditable="true"]') || selector.includes('textarea')) {
                return docElements.filter(el => el.attributes['contenteditable'] === 'true' || el.tagName === 'TEXTAREA');
            }
            return docElements.filter(el => el.tagName !== 'TEXTAREA' && el.attributes['contenteditable'] !== 'true');
        },
        body: {
            addEventListener(event, fn) {
                listeners[event] = fn;
            }
        },
        addEventListener(event, fn) {
            listeners[event] = fn;
        }
    };

    class MockMutationObserver {
        constructor(callback) {
            mutationCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
    }

    const sandbox = {
        window: {},
        document: mockDocument,
        MutationObserver: MockMutationObserver,
        setTimeout,
        clearTimeout,
        console
    };
    sandbox.window = sandbox;

    // Run rtl-core.js inside sandbox
    const code = fs.readFileSync(CORE_PATH, 'utf8');
    vm.runInNewContext(code, sandbox);

    return {
        core: sandbox.window.__antigravityRtlCore,
        docElements,
        mockElement,
        listeners
    };
}

test('rtl-core: Hebrew and mixed Hebrew-English-numbers direction detection', () => {
    const { core, docElements, mockElement } = createMockEnvironment();

    const cases = [
        { text: 'שלום עולם, זוהי בדיקת כיווניות', expected: 'rtl', desc: 'pure Hebrew' },
        { text: 'ברוכים הבאים ל-Google Antigravity IDE', expected: 'rtl', desc: 'Hebrew with English terms' },
        { text: 'התקנת חבילת npm ושרת Node.js הושלמה בהצלחה', expected: 'rtl', desc: 'Hebrew with English technical tokens' },
        { text: 'גרסה 2.4.0 של "Antigravity RTL" כוללת 15 שיפורים (ב-99.9% הצלחה)!', expected: 'rtl', desc: 'Hebrew + English + Numbers + Punctuation (quotes, parens, dots, exclamation)' },
        { text: 'דוח ביצועים עבור "API v2": נרשמו 1,420 בקשות (עלייה של +12.5%), זמן תגובה: 35ms.', expected: 'rtl', desc: 'Hebrew + English + Numbers + complex punctuation (colon, comma, plus, percent)' },
        { text: '* (2026) פרויקט "Antigravity RTL" צמח ב-25%! [ציון: 10/10]', expected: 'rtl', desc: 'Leading neutral punctuation/numbers followed by Hebrew + English + numbers + symbols' },
        { text: '* סך הכל לתשלום (כולל מע"מ): +₪100.50 (+5.5%)', expected: 'rtl', desc: 'Hebrew with symbols, currency, and percentages' },
        { text: 'יתרה זמינה בחשבון: ₪250.00', expected: 'rtl', desc: 'Hebrew with numbers and currency' },
        { text: 'התקדמות מ-100 ל-200 פריטים (כ-50%)', expected: 'rtl', desc: 'Hebrew with numbers, parentheses, and percentages' },
        { text: 'Antigravity IDE v2.0 (גרסה בעברית): סה"כ 100% תאימות!', expected: 'ltr', desc: 'English first strong char with embedded Hebrew, numbers, and punctuation' },
        { text: 'سلام دنیا - گزارش پروژه', expected: 'rtl', desc: 'pure Persian/Arabic' },
        { text: 'کتابخانه React برای فرانت‌اند', expected: 'rtl', desc: 'Persian with English word' },
        { text: 'Review project configuration with Node.js', expected: 'ltr', desc: 'pure English' },
        { text: 'VS Code and Antigravity IDE running locally', expected: 'ltr', desc: 'English technical terms' },
        { text: '123456789', expected: 'auto', desc: 'numbers only' }
    ];

    for (const c of cases) {
        const el = mockElement('p');
        el.textContent = c.text;
        docElements.length = 0;
        docElements.push(el);

        core.updateDir(false);
        assert.equal(el.getAttribute('dir'), c.expected, `Failed for: ${c.desc} ("${c.text}")`);
    }
});

test('rtl-core: forceRTL forces rtl on all text blocks', () => {
    const { core, docElements, mockElement } = createMockEnvironment();

    const el = mockElement('p');
    el.textContent = 'This is strictly English text.';
    docElements.push(el);

    core.updateDir(true);
    assert.equal(el.getAttribute('dir'), 'rtl');
});

test('rtl-core: code blocks and pre elements are never modified', () => {
    const { core, docElements, mockElement } = createMockEnvironment();

    const pre = mockElement('pre');
    pre.textContent = 'const greeting = "שלום עולם";';
    const code = mockElement('code');
    code.textContent = 'npm run build';
    docElements.push(pre, code);

    core.updateDir(false);
    assert.equal(pre.getAttribute('dir'), null);
    assert.equal(code.getAttribute('dir'), null);
});

test('rtl-core: input and textarea direction handling', () => {
    const { core, docElements, mockElement } = createMockEnvironment();

    const textarea = mockElement('textarea');
    textarea.attributes['data-testid'] = 'ask-question-writein';
    textarea.value = 'איך מגדירים את התוסף בעברית?';

    const contenteditable = mockElement('div');
    contenteditable.attributes['contenteditable'] = 'true';
    contenteditable.textContent = 'How do I configure this plugin in English?';

    docElements.push(textarea, contenteditable);

    core.updateDir(false);
    assert.equal(textarea.getAttribute('dir'), 'rtl');
    assert.equal(contenteditable.getAttribute('dir'), 'ltr');
});

test('rtl-core: onToggleShortcut triggers callback on Alt+R', () => {
    const { core, listeners } = createMockEnvironment();
    let triggered = false;

    core.onToggleShortcut(() => { triggered = true; });

    let prevented = false;
    const event = {
        code: 'KeyR',
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        preventDefault() { prevented = true; }
    };

    listeners['keydown'](event);
    assert.equal(triggered, true);
    assert.equal(prevented, true);

    // Ctrl+Alt+R should not trigger (avoids clash with regex toggle)
    triggered = false;
    listeners['keydown']({ ...event, ctrlKey: true });
    assert.equal(triggered, false);
});
