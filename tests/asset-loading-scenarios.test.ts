import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Asset Loading Scenarios', () => {
  let viteConfig: string;
  let postcssConfig: string;
  let tailwindConfig: string;

  beforeAll(() => {
    // Read configuration files
    viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf-8');
    postcssConfig = readFileSync(join(process.cwd(), 'postcss.config.js'), 'utf-8');
    tailwindConfig = readFileSync(join(process.cwd(), 'tailwind.config.js'), 'utf-8');
  });

  describe('Development vs Production Asset Handling', () => {
    it('should configure different source map settings for dev/prod', () => {
      // Vite config should handle dev vs prod source maps
      expect(viteConfig).toContain('devSourcemap: isDev');
      expect(viteConfig).toContain('sourcemap: isDev');
    });

    it('should configure CSS minification for production only', () => {
      expect(viteConfig).toContain('cssMinify: isProd');
      expect(viteConfig).toContain('isProd && {');
    });

    it('should configure asset inlining threshold', () => {
      expect(viteConfig).toContain('assetsInlineLimit: 4096');
    });

    it('should configure proper build targets for production', () => {
      expect(viteConfig).toContain('target: \'es2020\'');
      expect(viteConfig).toContain('minify: \'esbuild\'');
    });
  });

  describe('PostCSS Pipeline Configuration', () => {
    it('should configure Tailwind CSS plugin', () => {
      expect(postcssConfig).toContain('tailwindcss: {');
      expect(postcssConfig).toContain('config: tailwindConfigPath');
    });

    it('should configure Autoprefixer plugin', () => {
      expect(postcssConfig).toContain('autoprefixer: {');
      expect(postcssConfig).toContain('overrideBrowserslist');
    });

    it('should export configuration as ES module', () => {
      expect(postcssConfig).toContain('export default');
    });
  });

  describe('Tailwind Configuration for Asset Management', () => {
    it('should configure content paths for tree-shaking', () => {
      expect(tailwindConfig).toContain('"./index.html"');
      expect(tailwindConfig).toContain('"./src/**/*.{js,ts,jsx,tsx}"');
      expect(tailwindConfig).toContain('"./components/**/*.{js,ts,jsx,tsx}"');
    });

    it('should define custom color palette', () => {
      expect(tailwindConfig).toContain('navy: {');
      expect(tailwindConfig).toContain('coral: {');
      expect(tailwindConfig).toContain('#141827'); // navy-900
      expect(tailwindConfig).toContain('#F65058'); // coral-500
    });

    it('should define custom font families', () => {
      expect(tailwindConfig).toContain('fontFamily: {');
      expect(tailwindConfig).toContain('Plus Jakarta Sans');
      expect(tailwindConfig).toContain('Inter');
    });
  });

  describe('Asset Naming and Organization', () => {
    it('should configure CSS asset naming pattern', () => {
      expect(viteConfig).toContain('assets/styles.[hash].css');
    });

    it('should configure font asset naming pattern', () => {
      expect(viteConfig).toContain('assets/fonts/[name].[hash].[ext]');
    });

    it('should configure image asset naming pattern', () => {
      expect(viteConfig).toContain('assets/images/[name].[hash].[ext]');
    });

    it('should configure JS chunk naming pattern', () => {
      expect(viteConfig).toContain('assets/js/[name].[hash].js');
    });
  });

  describe('Build Optimization Settings', () => {
    it('should disable CSS code splitting for better caching', () => {
      expect(viteConfig).toContain('cssCodeSplit: false');
    });

    it('should enable compression reporting', () => {
      expect(viteConfig).toContain('reportCompressedSize: true');
    });

    it('should configure HMR overlay for development', () => {
      expect(viteConfig).toContain('overlay: true');
    });
  });
});

describe('Asset Loading Edge Cases', () => {
  describe('Font Loading Optimization', () => {
    it('should use font-display swap for better performance', () => {
      const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
      expect(indexHtml).toContain('display=swap');
    });

    it('should preconnect to font domains', () => {
      const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
      expect(indexHtml).toContain('rel="preconnect" href="https://fonts.googleapis.com"');
      expect(indexHtml).toContain('rel="preconnect" href="https://fonts.gstatic.com" crossorigin');
    });
  });

  describe('CSS Asset Integrity', () => {
    it('should generate consistent CSS output', () => {
      const distCssPath = join(process.cwd(), 'dist/assets');
      if (existsSync(distCssPath)) {
        const fs = require('fs');
        const cssFiles = fs.readdirSync(distCssPath).filter((file: string) => file.endsWith('.css'));
        
        if (cssFiles.length > 0) {
          const cssContent = readFileSync(join(distCssPath, cssFiles[0]), 'utf-8');
          
          // Should contain Tailwind base styles
          expect(cssContent).toContain('box-sizing:border-box');
          
          // Should contain custom styles
          expect(cssContent).toContain('scrollbar-custom');
          
          // Should be minified
          expect(cssContent).not.toContain('\n  '); // No indented newlines
        }
      }
    });
  });

  describe('Asset Path Resolution', () => {
    it('should handle different hosting environments', () => {
      const distIndexHtml = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf-8');
      
      // Paths should be absolute from root for static hosting
      const cssMatch = distIndexHtml.match(/href="([^"]*\.css)"/);
      const jsMatch = distIndexHtml.match(/src="([^"]*\.js)"/);
      
      if (cssMatch) {
        expect(cssMatch[1]).toMatch(/^\/assets\//);
      }
      
      if (jsMatch) {
        expect(jsMatch[1]).toMatch(/^\/assets\//);
      }
    });

    it('should not include build-time paths', () => {
      const distIndexHtml = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf-8');
      
      // Should not contain any build-time specific paths
      expect(distIndexHtml).not.toContain('node_modules');
      expect(distIndexHtml).not.toContain('src/');
      expect(distIndexHtml).not.toContain('.ts');
      expect(distIndexHtml).not.toContain('.tsx');
    });
  });
});