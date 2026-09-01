import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The renderer's Content-Security-Policy, injected into the built index.html.
 *
 * Build only. The dev server needs inline scripts, eval and a websocket for HMR, and
 * a policy loose enough for that is not a policy: dev loads from localhost over http
 * where the packaged app loads from file://, so the two were never going to share one
 * string. What ships is the strict one.
 *
 * A meta tag rather than a header, because the packaged app is loaded with
 * `loadFile` and a file:// response has no headers to attach a policy to.
 *
 * Every source here is one the app actually uses:
 *   style-src  Google Fonts' stylesheet, linked by loadGoogleFont, plus the inline
 *              style attributes React writes for previews sized at runtime.
 *   font-src   the faces that stylesheet pulls. Local fonts never appear here: they
 *              are read through IPC and handed to FontFace as bytes.
 *   img-src    data: and blob: for the swatch and specimen exports.
 * Everything else is refused, and object-src, base-uri and form-action are closed
 * outright rather than left to fall through to default-src.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  // No frame-ancestors: it is ignored when delivered in a meta element, and Chromium
  // says so in the console. The window is not embeddable anyway.
].join('; ')

const cspPlugin = (): Plugin => ({
  name: 'vault-csp',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: html =>
      html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
  },
})

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [react(), cspPlugin()],
  },
})
