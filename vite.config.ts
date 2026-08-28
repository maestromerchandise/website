import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

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
    babel({ presets: [reactCompilerPreset()] })
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
