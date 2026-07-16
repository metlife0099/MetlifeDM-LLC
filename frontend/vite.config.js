import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL_PROXY || 'http://localhost:5000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@api': path.resolve(__dirname, './src/api'),
        '@store': path.resolve(__dirname, './src/store'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    server: {
      port: 3000,
      host: true,
      open: false,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Function form (not the object-literal shorthand) so every module —
          // including ones only reachable through a lazy `import()` in App.jsx —
          // gets consistently bucketed. The object form doesn't catch transitive
          // deps like `scheduler` / `use-sync-external-store`, which could get
          // duplicated into a different chunk than react-dom itself, yielding two
          // live React instances and "useContext(...) is null" errors in prod.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/') ||
              id.includes('/use-sync-external-store/')
            ) {
              return 'react-vendor';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('/react-redux/')) return 'redux-vendor';
            if (id.includes('@tanstack/react-query') || id.includes('/axios/')) return 'query-vendor';
            if (id.includes('framer-motion') || id.includes('/gsap/')) return 'motion-vendor';
            if (id.includes('lucide-react') || id.includes('/swiper/') || id.includes('@studio-freight/lenis')) {
              return 'ui-vendor';
            }
            return undefined;
          },
        },
      },
    },
    preview: { port: 3000, host: true },
  };
});
