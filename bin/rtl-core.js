/**
 * Antigravity RTL shared direction engine.
 * Injected before the standalone app payload (patch-app.js) and the IDE client (patch-ide.js).
 */
window.__antigravityRtlCore = window.__antigravityRtlCore || (() => {
    const ZERO_WIDTH = /[\u200B-\u200F\uFEFF]/g;
    const RTL_CHAR = /[\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const STRONG_CHAR = /[A-Za-z\u0590-\u05FF\uFB1D-\uFB4F\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    const BLOCKS = `
        .prose > *,
        [data-testid="chat-message"] > *,
        .markdown-body > *,
        .leading-relaxed > *,
        [data-testid="user-input-step"],
        [data-testid="user-input-step"] > *,
        [data-testid="conversation-view"] p,
        [data-testid="conversation-view"] li,
        div:has(> [role="radiogroup"]),
        label[for^="ask-opt-"]
    `;

    function setDir(el, dir) {
        if (el.getAttribute('dir') !== dir) el.setAttribute('dir', dir);
    }

    // Sets dir on inputs and chat blocks from their first strong character.
    function updateDir(forceRTL) {
        document.querySelectorAll('[contenteditable="true"] p, [contenteditable="true"], textarea[data-testid="ask-question-writein"]').forEach(el => {
            const raw = el.tagName === 'TEXTAREA' ? /** @type {any} */ (el).value : el.textContent;
            const text = (raw || '').replace(ZERO_WIDTH, '').trim();
            if (text.length > 0) {
                const firstStrong = text.match(STRONG_CHAR);
                setDir(el, firstStrong && RTL_CHAR.test(firstStrong[0]) ? 'rtl' : 'ltr');
            } else if (el.hasAttribute('dir')) {
                el.removeAttribute('dir');
            }
        });

        document.querySelectorAll(BLOCKS).forEach(el => {
            if (el.tagName === 'PRE' || el.tagName === 'CODE' || el.closest('.monaco-editor') || el.closest('.terminal')) return;

            let dir = 'auto';
            if (forceRTL) {
                dir = 'rtl';
            } else {
                const firstChar = (el.textContent || '').replace(ZERO_WIDTH, '').match(STRONG_CHAR);
                if (firstChar) dir = RTL_CHAR.test(firstChar[0]) ? 'rtl' : 'ltr';
            }
            setDir(el, dir);
        });
    }

    // Runs fn at most once per 400ms after DOM changes, typing or focus.
    function watch(fn) {
        let timer = null;
        const schedule = () => {
            if (timer) return;
            timer = setTimeout(() => {
                timer = null;
                fn();
            }, 400);
        };
        document.body.addEventListener('input', schedule, { capture: true });
        document.body.addEventListener('focusin', schedule, { capture: true });
        new MutationObserver((mutations) => {
            const hasExternal = mutations.some(m => [...m.addedNodes].some(node => !('id' in node) || !node.id || !String(node.id).startsWith('antigravity-rtl')));
            if (hasExternal) schedule();
        }).observe(document.body, { childList: true, subtree: true });
    }

    // Alt+R (⌥R on macOS). Cmd/Ctrl are excluded so ⌥⌘R (VS Code's regex toggle) and AltGr keep working.
    function onToggleShortcut(fn) {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && !e.metaKey && !e.ctrlKey && e.code === 'KeyR') {
                e.preventDefault();
                fn();
            }
        });
    }

    return { updateDir, watch, onToggleShortcut };
})();
