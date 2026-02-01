import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
    ],
    css: {
      postcss: './postcss.config.js',
      // Generate source maps only in development
      devSourcemap: isDev,
      // CSS minification and optimization for production
      ...(isProd && {
        preprocessorOptions: {
          css: {
            charset: false, // Remove charset declaration for smaller files
          },
        },
      }),
    },
    build: {
      // Single CSS file for better caching and performance
      cssCodeSplit: false,
      // Generate source maps only in development
      sourcemap: isDev,
      // CSS minification
      cssMinify: isProd,
      // Asset optimization
      assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      rollupOptions: {
        output: {
          // Enhanced asset naming with hash suffixes for cache busting
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || '';
            const extType = info.split('.').pop() || '';
            
            // CSS files get special naming
            if (extType === 'css') {
              return 'assets/styles.[hash].css';
            }
            
            // Font files
            if (['woff', 'woff2', 'eot', 'ttf', 'otf'].includes(extType)) {
              return 'assets/fonts/[name].[hash].[ext]';
            }
            
            // Image files
            if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif'].includes(extType)) {
              return 'assets/images/[name].[hash].[ext]';
            }
            
            // Other assets
            return 'assets/[name].[hash].[ext]';
          },
          // Chunk naming for JS files
          chunkFileNames: 'assets/js/[name].[hash].js',
          entryFileNames: 'assets/js/[name].[hash].js',
        },
      },
      // Optimize dependencies
      ...(isProd && {
        minify: 'esbuild',
        target: 'es2020',
        // Enable compression hints
        reportCompressedSize: true,
      }),
    },
    // Optimize dev server with enhanced error handling
    ...(isDev && {
      server: {
        hmr: {
          overlay: true, // Show errors in overlay
          clientErrorOverlay: true, // Show client-side errors
        },
      },
    }),
  };
});
