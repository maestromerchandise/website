import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { resolve } from 'node:path'

// Multi-page build: the home page is one long anchor-scrolled document, while
// About is a real static file at about/index.html. Serving it as a file rather
// than a client-side route means Apache on Hostinger resolves /about/ directly,
// so a refresh cannot 404 and no rewrite rules are needed.
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
      },
    },
  },
})
