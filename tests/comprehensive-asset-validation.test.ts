import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

describe('Comprehensive Asset Management Validation', () => {
  let buildStats: {
    distExists: boolean;
    cssFiles: string[];
    jsFiles: string[];
    totalSize: number;
    cssSize: number;
    jsSize: number;
  };

  beforeAll(() => {
    const distDir = join(process.cwd(), 'dist');
    const assetsDir = join(distDir, 'assets');
    
    buildStats = {
      distExists: existsSync(distDir),
      cssFiles: [],
      jsFiles: [],
      totalSize: 0,
      cssSize: 0,
      jsSize: 0
    };

    if (buildStats.distExists && existsSync(assetsDir)) {
      const fs = require('fs');
      const allFiles = fs.readdirSync(assetsDir, { recursive: true });
      
      buildStats.cssFiles = allFiles.filter((file: string) => file.endsWith('.css'));
      buildStats.jsFiles = allFiles.filter((file: string) => file.endsWith('.js'));
      
      // Calculate sizes
      buildStats.cssFiles.forEach((file: string) => {
        const filePath = join(assetsDir, file);
        const size = statSync(filePath).size;
        buildStats.cssSize += size;
        buildStats.totalSize += size;
      });
      
      buildStats.jsFiles.forEach((file: string) => {
        const filePath = join(assetsDir, file);
        const size = statSync(filePath).size;
        buildStats.jsSize += size;
        buildStats.totalSize += size;
      });
    }
  });

  describe('Build Output Validation', () => {
    it('should generate build output directory', () => {
      expect(buildStats.distExists).toBe(true);
    });

    it('should generate optimized CSS bundle', () => {
      expect(buildStats.cssFiles.length).toBe(1);
      expect(buildStats.cssSize).toBeGreaterThan(1000); // Should have substantial CSS
      expect(buildStats.cssSize).toBeLessThan(100000); // But not too large (tree-shaken)
    });

    it('should generate JavaScript bundle', () => {
      expect(buildStats.jsFiles.length).toBeGreaterThan(0);
      expect(buildStats.jsSize).toBeGreaterThan(10000); // Should have substantial JS
    });
  });

  describe('Asset Management Requirements Validation', () => {
    describe('Requirement 3.1: Font Loading', () => {
      it('should preserve font loading optimization', () => {
        const distIndexHtml = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf-8');
        
        // Font preconnect for performance
        expect(distIndexHtml).toContain('rel="preconnect" href="https://fonts.googleapis.com"');
        expect(distIndexHtml).toContain('rel="preconnect" href="https://fonts.gstatic.com" crossorigin');
        
        // Font stylesheet with display=swap
        expect(distIndexHtml).toContain('display=swap');
        expect(distIndexHtml).toContain('Plus+Jakarta+Sans');
        expect(distIndexHtml).toContain('Inter:wght');
      });

      it('should apply fonts correctly in CSS', () => {
        if (buildStats.cssFiles.length > 0) {
          const cssPath = join(process.cwd(), 'dist/assets', buildStats.cssFiles[0]);
          const cssContent = readFileSync(cssPath, 'utf-8');
          
          expect(cssContent).toContain('font-family:Inter,sans-serif');
          expect(cssContent).toContain('font-family:Plus Jakarta Sans,sans-serif');
        }
      });
    });

    describe('Requirement 3.4: Custom Font Utilities', () => {
      it('should generate custom font utility classes', () => {
        if (buildStats.cssFiles.length > 0) {
          const cssPath = join(process.cwd(), 'dist/assets', buildStats.cssFiles[0]);
          const cssContent = readFileSync(cssPath, 'utf-8');
          
          expect(cssContent).toContain('.font-serif');
          expect(cssContent).toContain('.font-mono');
        }
      });
    });

    describe('Requirement 4.3: Static Hosting Asset Paths', () => {
      it('should generate proper asset paths for static hosting', () => {
        const distIndexHtml = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf-8');
        
        // CSS path should be absolute from root
        const cssMatch = distIndexHtml.match(/href="([^"]*\.css)"/);
        expect(cssMatch).toBeTruthy();
        if (cssMatch) {
          expect(cssMatch[1]).toMatch(/^\/assets\/styles\.[a-f0-9]{8}\.css$/);
        }
        
        // JS path should be absolute from root
        const jsMatch = distIndexHtml.match(/src="([^"]*\.js)"/);
        expect(jsMatch).toBeTruthy();
        if (jsMatch) {
          expect(jsMatch[1]).toMatch(/^\/assets\/js\/[^.]+\.[a-f0-9]{8}\.js$/);
        }
      });

      it('should organize assets in proper directory structure', () => {
        // CSS files should be directly in assets/
        buildStats.cssFiles.forEach(file => {
          expect(file).toMatch(/^styles\.[a-f0-9]+\.css$/);
        });
        
        // JS files should be in assets/js/
        buildStats.jsFiles.forEach(file => {
          expect(file).toMatch(/^js\/.*\.[a-f0-9]+\.js$/);
        });
      });
    });

    describe('Requirement 5.4: Cache Busting', () => {
      it('should include hash suffixes in all asset filenames', () => {
        // CSS files should have hashes
        buildStats.cssFiles.forEach(file => {
          expect(file).toMatch(/\.[a-f0-9]{8}\.css$/);
        });
        
        // JS files should have hashes
        buildStats.jsFiles.forEach(file => {
          expect(file).toMatch(/\.[a-f0-9]{8}\.js$/);
        });
      });

      it('should use consistent hash format', () => {
        const allFiles = [...buildStats.cssFiles, ...buildStats.jsFiles];
        allFiles.forEach(file => {
          const hashMatch = file.match(/\.([a-f0-9]{8})\.(css|js)$/);
          expect(hashMatch).toBeTruthy();
          if (hashMatch) {
            expect(hashMatch[1]).toMatch(/^[a-f0-9]{8}$/);
          }
        });
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should generate reasonably sized CSS bundle', () => {
      // CSS should be optimized but not too small (should include necessary styles)
      expect(buildStats.cssSize).toBeGreaterThan(5000); // At least 5KB
      expect(buildStats.cssSize).toBeLessThan(50000); // But less than 50KB
    });

    it('should minify CSS for production', () => {
      if (buildStats.cssFiles.length > 0) {
        const cssPath = join(process.cwd(), 'dist/assets', buildStats.cssFiles[0]);
        const cssContent = readFileSync(cssPath, 'utf-8');
        
        // Should be minified (no unnecessary whitespace)
        expect(cssContent).not.toMatch(/\n\s+/); // No indented lines
        expect(cssContent.split('\n').length).toBeLessThan(10); // Should be mostly on one line
      }
    });

    it('should include only necessary Tailwind utilities', () => {
      if (buildStats.cssFiles.length > 0) {
        const cssPath = join(process.cwd(), 'dist/assets', buildStats.cssFiles[0]);
        const cssContent = readFileSync(cssPath, 'utf-8');
        
        // Should include utilities used in the app
        expect(cssContent).toContain('.bg-navy-900');
        expect(cssContent).toContain('.text-gray-100');
        expect(cssContent).toContain('.animate-spin');
        
        // Should NOT include utilities that aren't used (tree-shaking working)
        // This is harder to test definitively, but we can check the size is reasonable
        expect(cssContent.length).toBeLessThan(100000); // Less than 100KB indicates tree-shaking
      }
    });
  });

  describe('Configuration Integrity', () => {
    it('should have proper Vite configuration for asset management', () => {
      const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf-8');
      
      // Asset naming configuration
      expect(viteConfig).toContain('assetFileNames');
      expect(viteConfig).toContain('styles.[hash].css');
      expect(viteConfig).toContain('fonts/[name].[hash].[ext]');
      
      // Build optimization
      expect(viteConfig).toContain('cssCodeSplit: false');
      expect(viteConfig).toContain('cssMinify: isProd');
    });

    it('should have proper PostCSS configuration', () => {
      const postcssConfig = readFileSync(join(process.cwd(), 'postcss.config.js'), 'utf-8');
      
      expect(postcssConfig).toContain('tailwindcss: {');
      expect(postcssConfig).toContain('autoprefixer: {');
      expect(postcssConfig).toContain('config: tailwindConfigPath');
      expect(postcssConfig).toContain('overrideBrowserslist');
    });

    it('should have proper Tailwind configuration', () => {
      const tailwindConfig = readFileSync(join(process.cwd(), 'tailwind.config.js'), 'utf-8');
      
      // Content paths for tree-shaking
      expect(tailwindConfig).toContain('./index.html');
      expect(tailwindConfig).toContain('./src/**/*.{js,ts,jsx,tsx}');
      
      // Custom theme
      expect(tailwindConfig).toContain('navy:');
      expect(tailwindConfig).toContain('coral:');
      expect(tailwindConfig).toContain('Plus Jakarta Sans');
    });
  });

  describe('Development vs Production Differences', () => {
    it('should not include source maps in production build', () => {
      const distDir = join(process.cwd(), 'dist');
      const fs = require('fs');
      
      if (existsSync(distDir)) {
        const allFiles = fs.readdirSync(distDir, { recursive: true });
        const sourceMapFiles = allFiles.filter((file: string) => file.endsWith('.map'));
        expect(sourceMapFiles.length).toBe(0);
      }
    });

    it('should configure different behavior for dev/prod in Vite config', () => {
      const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf-8');
      
      expect(viteConfig).toContain('isDev = command === \'serve\'');
      expect(viteConfig).toContain('isProd = mode === \'production\'');
      expect(viteConfig).toContain('devSourcemap: isDev');
      expect(viteConfig).toContain('sourcemap: isDev');
    });
  });
});