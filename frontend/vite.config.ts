import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',  // Allow external connections
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err instanceof Error ? err.message : 'Unknown error');
          });

          proxy.on('proxyReq', (_proxyReq, req) => {
            console.debug('Sending request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req) => {
            console.debug('Received response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: parseInt(process.env.PORT || '3000'),
    },
    watch: {
      usePolling: true,
    },
    strictPort: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/App.tsx'),
    },
  },
  logLevel: 'info',
});
