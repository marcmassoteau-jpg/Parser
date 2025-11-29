/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/Parser/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize for WASM
    target: 'esnext',
    rollupOptions: {
      output: {
        // Separate WASM files
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'wasm/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  // Worker configuration
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  // Optimize dependencies
  optimizeDeps: {
    exclude: ['@anthropic-ai/claude-code'], // Exclude any native modules
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Server configuration for development
  server: {
    headers: {
      // Required for SharedArrayBuffer (used by some WASM modules)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**'],
    // Support for WASM in tests
    deps: {
      inline: [/\.wasm$/],
    },
  },
})
