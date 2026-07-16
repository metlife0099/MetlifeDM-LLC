import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 3100,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL_PROXY || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL_PROXY || 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Function form (not the object-literal shorthand): the object form only
        // catches the exact packages listed and misses transitive deps like
        // `scheduler` / `use-sync-external-store`, which can then get duplicated
        // into a different chunk than react-dom itself — two live React
        // instances, and "useContext(...) is null" errors in production.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/') ||
            id.includes('/use-sync-external-store/')
          ) {
            return 'react';
          }
          if (
            id.includes('/axios/') ||
            id.includes('@tanstack/react-query') ||
            id.includes('/redux/') ||
            id.includes('/react-redux/') ||
            id.includes('@reduxjs/toolkit')
          ) {
            return 'vendor';
          }
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('/recharts/')) return 'charts';
          if (id.includes('@tiptap/')) return 'editor';
          return undefined;
        },
      },
    },
  },
});
