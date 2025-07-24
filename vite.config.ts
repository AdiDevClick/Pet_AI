import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import svgr from 'vite-plugin-svgr';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
    base: '/',
    css: {
        devSourcemap: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
    },
    resolve: {
        alias: [
            {
                find: '@',
                replacement: resolve(__dirname, 'src'),
            },
            {
                find: '@assets',
                replacement: resolve(__dirname, 'src/assets'),
            },
            {
                find: '@css',
                replacement: resolve(__dirname, 'src/assets/css'),
            },
            {
                find: '@images',
                replacement: resolve(__dirname, 'src/assets/images'),
            },
            {
                find: '@icons',
                replacement: resolve(__dirname, 'src/assets/icons'),
            },
            {
                find: '@models',
                replacement: resolve(__dirname, 'src/assets/3DModels'),
            },
            {
                find: '@data',
                replacement: resolve(__dirname, 'src/data'),
            },
            {
                find: '@utils',
                replacement: resolve(__dirname, 'src/utils'),
            },
            {
                find: '@hooks',
                replacement: resolve(__dirname, 'src/hooks'),
            },
        ],
    },
    // optimizeDeps: {
    //     exclude: ['three'],
    // },
});
