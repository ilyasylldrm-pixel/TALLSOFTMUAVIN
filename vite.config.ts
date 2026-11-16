import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function resolveBuildVersion(): string {
  try {
    const versionFile = path.resolve(__dirname, 'public/version.json');
    if (fs.existsSync(versionFile)) {
      const parsed = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
      if (parsed && typeof parsed.version === 'string' && parsed.version.trim()) {
        return parsed.version.trim();
      }
    }
  } catch {
    // fallback below
  }
  try {
    const pkgFile = path.resolve(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
    return `${pkg.version || '1.0.0'}-${Date.now()}`;
  } catch {
    return `1.0.0-${Date.now()}`;
  }
}

export default defineConfig(() => {
  const buildVersion = resolveBuildVersion();

  return {
    base: './',
    define: {
      __APP_BUILD_VERSION__: JSON.stringify(buildVersion),
    },
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
                const fsMod = await import('fs');
                let contents = await fsMod.promises.readFile(args.path, 'utf8');
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
      ],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
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
