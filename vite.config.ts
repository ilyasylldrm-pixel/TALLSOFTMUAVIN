import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      alias: {
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react-dom/client': path.resolve(__dirname, 'node_modules/react-dom/client.js'),
        '@': path.resolve(__dirname, '.'),
        '@assets': path.resolve(__dirname, 'assets'),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        plugins: [
          {
            name: 'react-shared-internals-singleton',
            setup(build) {
              build.onLoad({ filter: /node_modules\/react\/(cjs\/)?react\.(development|production)\.js$/ }, async (args) => {
                const fs = await import('fs');
                let contents = await fs.promises.readFile(args.path, 'utf8');
                contents = contents.replace(
                  'ReactSharedInternals = {',
                  'ReactSharedInternals = ((typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : global)).__REACT_SHARED_INTERNALS_SINGLETON__ ||= {'
                ).replace(
                  'recentlyCreatedOwnerStacks: 0\n      },',
                  'recentlyCreatedOwnerStacks: 0\n      }),'
                );
                return { contents, loader: 'js' };
              });
            },
          },
        ],
      },
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'lucide-react',
        'recharts',
        'html2canvas',
        'jspdf',
        'jspdf-autotable',
        'xlsx',
        'exceljs',
      ],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      reportCompressedSize: false,
      cssCodeSplit: true,
      rollupOptions: {
        maxParallelFileOps: 2,
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            // Keep a single React runtime. Splitting lucide-react away from
            // react/jsx-runtime makes React 19 throw "older version of React".
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/.test(id)) {
              return 'vendor-react';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) {
              return 'vendor-pdf-excel';
            }
            if (id.includes('exceljs')) {
              return 'vendor-exceljs';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (/[\\/]node_modules[\\/](recharts|d3|d3-[^\\/]+)([\\/]|$)/.test(id)) {
              return 'vendor-charts';
            }
            if (/[\\/]node_modules[\\/](motion)([\\/]|$)/.test(id)) {
              return 'vendor-motion';
            }
            if (id.includes('pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            if (id.includes('tesseract.js')) {
              return 'vendor-tesseract';
            }
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
