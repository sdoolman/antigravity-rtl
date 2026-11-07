/**
 * Cloudflare Worker for Antigravity RTL Web Patcher.
 * Serves the zero-install, 100% in-browser ASAR patcher from Cloudflare's edge.
 */

// If deployed via Wrangler with text/static asset imports:
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If static assets binding exists (Workers Static Assets / Cloudflare Pages)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // Default headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Access-Control-Allow-Origin': '*'
    };

    return new Response(
      `<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0; url=https://github.com/sdoolman/antigravity-rtl"></head>
<body>Redirecting to <a href="https://github.com/sdoolman/antigravity-rtl">Antigravity RTL</a>...</body>
</html>`,
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...securityHeaders
        }
      }
    );
  }
};
