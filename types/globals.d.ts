// Ambient declarations for injected scripts and runtime globals

declare const win: any;
declare const url: string;
declare const __RTL_CORE__: string;
declare const __RTL_CONFIG__: any;
declare const __FONT_BASE64__: string;

declare interface Window {
    __antigravity_rtl_injected?: boolean;
    __ANTIGRAVITY_RTL_LOADED__?: boolean;
    __antigravityRtlCore?: {
        updateDir: (forceRTL?: boolean) => void;
        watch: (fn: () => void) => void;
        onToggleShortcut: (fn: () => void) => void;
    };
}

declare const chrome: any;
