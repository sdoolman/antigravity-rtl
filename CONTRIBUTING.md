# Contributing to Antigravity RTL

Thank you for your interest in improving Antigravity RTL!

## Guidelines

1. **Keep it Debloated & Private**:
   - Zero telemetry, zero analytics, zero external network calls.
   - No nag popups, toasts, or celebration animations.
2. **Typography & BiDi Accuracy**:
   - Hebrew and RTL strings mixed with English, numbers, and punctuation must always retain proper alignment without flipping brackets or math symbols.
   - Monaco code editor, terminal sessions, and inline code blocks must remain strictly LTR.
3. **Testing & Code Quality**:
   - Run `npm test` to ensure all unit tests pass before opening a PR.
   - Run `npm run typecheck` to verify TypeScript types without build overhead.
   - If adding changes to the injection payload, run `npm run build:web` to regenerate the Web Patcher bundle.
