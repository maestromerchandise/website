import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

/**
 * Redirect /about and /studio to their trailing slash form while developing.
 *
 * Each is a directory holding an index.html, and the dev server only matches one
 * when the path ends in a slash; without it the request falls through to the
 * home page, so /studio quietly served the site instead of the Studio. Apache
 * adds the slash itself in production, which is why the built site is unaffected
 * and the fix belongs to the dev server alone.
 */
function trailingSlash(directories: string[]): Plugin {
  return {
    name: 'trailing-slash',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const [path] = (request.url ?? '').split('?')
        if (!directories.includes(path)) return next()
        response.writeHead(301, { Location: `${request.url?.replace(path, `${path}/`)}` })
        response.end()
      })
    },
  }
}

// Multi-page build: the home page is one long anchor-scrolled document, while
// About is a real static file at about/index.html. Serving it as a file rather
// than a client-side route means Apache on Hostinger resolves /about/ directly,
// so a refresh cannot 404 and no rewrite rules are needed.
//
// The Studio is a third entry for the same reason, and because keeping it out of
// the home page's graph is what stops visitors downloading an editing tool they
// will never open. It lives in studio/ beside the Sanity workspace, since the
// output path mirrors the source path and /studio/ is the URL it has to serve.
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    trailingSlash(['/about', '/studio']),
  ],
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about/index.html'),
        studio: resolve(import.meta.dirname, 'studio/index.html'),
      },
    },
  },
})
