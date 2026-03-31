import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        alias: {
            // This allows resolving imports like './assets/Logo.png' relative to src/
            // or absolute imports if needed.
        }
    },
    build: {
        rollupOptions: {
            external: ['better-sqlite3']
        }
    }
});
