import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  root: '.',
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
});
