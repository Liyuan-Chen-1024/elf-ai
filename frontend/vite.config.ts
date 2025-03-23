/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': __dirname + '/src',
    },
  },
  server: {
    port: parseInt(process.env['PORT'] || '3000'),
    host: true, // Better than '0.0.0.0' for network access
    proxy: {
      '/api': {
        target: process.env['VITE_API_URL'] || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true,
    },
    strictPort: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    target: ['esnext'],
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'build/**',
        'dist/**',
        'html/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    reporters: ['default', 'html'],
    pool: 'vmThreads',
    poolOptions: {
      vmThreads: {
        useAtomics: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
  appType: 'spa',
  clearScreen: false,
  logLevel: 'info',
});
