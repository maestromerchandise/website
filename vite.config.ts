import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

/**
 * Make the dev server resolve the two page directories the way Apache does.
 *
 * Two things are missing from it. A request for /studio has no trailing slash,
 * so index.html in that folder is never matched and the request falls through
 * to the home page. And /studio/structure/... is a route inside the Studio
 * rather than a file, so a refresh there falls through in the same way, which
 * is what sent an open document back to the site's front page.
 *
 * Apache does both in production through mod_dir and the rewrite in .htaccess,
 * so this only ever runs while developing.
 *
 * The Studio fallback keys off the Accept header rather than the shape of the
 * path: a browser navigating asks for text/html, while the module requests Vite
 * makes for studio-config.ts and the schema files do not, and those must still
 * reach the files they name.
 */
function pageDirectories(): Plugin {
  const directories = ['/about', '/studio']

  return {
    name: 'page-directories',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const [path] = (request.url ?? '').split('?')

        if (directories.includes(path)) {
          response.writeHead(301, { Location: `${path}/` })
          response.end()
          return
        }

        if (path.startsWith('/studio/') && request.headers.accept?.includes('text/html')) {
          request.url = '/studio/index.html'
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    pageDirectories(),
  ],
  server: {
    // Pinned, and strict so Vite fails loudly instead of quietly moving to 5174
    // when the port is busy. The Sanity CORS allowlist names this exact origin,
    // so a drifting port breaks every read the site and the Studio make.
    port: 5173,
    strictPort: true,
  },
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
