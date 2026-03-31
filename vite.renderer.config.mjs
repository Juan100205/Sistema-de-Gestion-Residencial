import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config
export default defineConfig({
    plugins: [
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            onwarn(warning, warn) {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return
                }
                warn(warning)
            }
        }
    }
});

