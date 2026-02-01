import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Asset Management Validation', () => {
  let distIndexHtml: string;
  let distCssContent: string;
  let sourceIndexHtml: string;
  let distAssets: string[];

  beforeAll(() => {
    // Read built files
    const distIndexPath = join(process.cwd(), 'dist/index.html');
    const sourceIndexPath = join(process.cwd(), 'index.html');
    
    if (!existsSync(distIndexPath)) {
      throw new Error('Build output not found. Run npm run build first.');
    }
    
    distIndexHtml = readFileSync(distIndexPath, 'utf-8');
    sourceIndexHtml = readFileSync(sourceIndexPath, 'utf-8');
    
    // Find CSS file in dist
    const cssMatch = distIndexHtml.match(/href="([^"]*\.css)"/);
    if (cssMatch) {
      const cssPath = join(process.cwd(), 'dist', cssMatch[1]);
      distCssContent = readFileSync(cssPath, 'utf-8');
    }
    
    // Get list of assets in dist directory
    const fs = require('fs');
    const assetsDir = join(process.cwd(), 'dist/assets');
    if (existsSync(assetsDir)) {
      distAssets = fs.readdirSync(assetsDir, { recursive: true });
    } else {
      distAssets = [];
    }
  });

  describe('Font Loading and Asset References (Requirements 3.1, 3.4)', () => {
    it('should preserve Google Fonts preconnect links in built HTML', () => {
      expect(distIndexHtml).toContain('rel="preconnect" href="https://fonts.googleapis.com"');
      expect(distIndexHtml).toContain('rel="preconnect" href="https://fonts.gstatic.com"');
    });

    it('should preserve Google Fonts stylesheet link in built HTML', () => {
      expect(distIndexHtml).toContain('href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans');
      expect(distIndexHtml).toContain('family=Inter:wght@300;400;500;600');
    });

    it('should include font-family declarations in generated CSS', () => {
      expect(distCssContent).toContain('font-family:Inter,sans-serif');
      expect(distCssContent).toContain('font-family:Plus Jakarta Sans,sans-serif');
    });

    it('should preserve custom font utility classes', () => {
      // Check for font-serif and font-sans utilities
      expect(distCssContent).toContain('.font-serif');
      expect(distCssContent).toContain('.font-mono');
    });

    it('should apply correct font families to base elements', () => {
      // Body should use Inter
      expect(distCssContent).toMatch(/body\s*{[^}]*font-family:\s*Inter,sans-serif/);
      // Headings should use Plus Jakarta Sans
      expect(distCssContent).toMatch(/h1,h2,h3,h4,h5,h6\s*{[^}]*font-family:\s*Plus Jakarta Sans,sans-serif/);
    });
  });

  describe('Asset Path Generation for Static Hosting (Requirement 4.3)', () => {
    it('should generate relative asset paths in built HTML', () => {
      const cssLinkMatch = distIndexHtml.match(/href="([^"]*\.css)"/);
      expect(cssLinkMatch).toBeTruthy();
      
      if (cssLinkMatch) {
        const cssPath = cssLinkMatch[1];
        // Should start with /assets/ for proper static hosting
        expect(cssPath).toMatch(/^\/assets\/.*\.css$/);
      }
    });

    it('should generate relative JS paths in built HTML', () => {
      const jsScriptMatch = distIndexHtml.match(/src="([^"]*\.js)"/);
      expect(jsScriptMatch).toBeTruthy();
      
      if (jsScriptMatch) {
        const jsPath = jsScriptMatch[1];
        // Should start with /assets/ for proper static hosting
        expect(jsPath).toMatch(/^\/assets\/.*\.js$/);
      }
    });

    it('should organize assets in proper directory structure', () => {
      // CSS files should be in assets/
      const cssFiles = distAssets.filter(file => file.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
      cssFiles.forEach(file => {
        expect(file).toMatch(/^styles\.[a-f0-9]+\.css$/);
      });

      // JS files should be in assets/js/
      const jsFiles = distAssets.filter(file => file.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
      jsFiles.forEach(file => {
        expect(file).toMatch(/^js\/.*\.[a-f0-9]+\.js$/);
      });
    });

    it('should not include absolute paths or localhost references', () => {
      // Check that built HTML doesn't contain localhost or absolute file paths
      expect(distIndexHtml).not.toContain('localhost');
      expect(distIndexHtml).not.toContain('file://');
      expect(distIndexHtml).not.toContain('C:\\');
      expect(distIndexHtml).not.toContain('/Users/');
    });
  });

  describe('Asset Hashing for Cache Busting (Requirement 5.4)', () => {
    it('should include hash suffixes in CSS filenames', () => {
      const cssLinkMatch = distIndexHtml.match(/href="[^"]*\/([^"\/]*\.css)"/);
      expect(cssLinkMatch).toBeTruthy();
      
      if (cssLinkMatch) {
        const cssFilename = cssLinkMatch[1];
        // Should match pattern: styles.[hash].css
        expect(cssFilename).toMatch(/^styles\.[a-f0-9]{8}\.css$/);
      }
    });

    it('should include hash suffixes in JS filenames', () => {
      const jsScriptMatch = distIndexHtml.match(/src="[^"]*\/([^"\/]*\.js)"/);
      expect(jsScriptMatch).toBeTruthy();
      
      if (jsScriptMatch) {
        const jsFilename = jsScriptMatch[1];
        // Should match pattern: [name].[hash].js
        expect(jsFilename).toMatch(/^[^.]+\.[a-f0-9]{8}\.js$/);
      }
    });

    it('should generate different hashes for different builds', () => {
      // This test verifies that hash generation is working
      // by checking that the hash is not a fixed value
      const cssLinkMatch = distIndexHtml.match(/href="[^"]*\/styles\.([a-f0-9]{8})\.css"/);
      expect(cssLinkMatch).toBeTruthy();
      
      if (cssLinkMatch) {
        const hash = cssLinkMatch[1];
        // Hash should not be all zeros or a predictable pattern
        expect(hash).not.toBe('00000000');
        expect(hash).not.toBe('12345678');
        expect(hash).toMatch(/^[a-f0-9]{8}$/);
      }
    });

    it('should maintain consistent hashing for same content', () => {
      // Verify that the same content produces the same hash
      // by checking that all references to the same file use the same hash
      const cssMatches = [...distIndexHtml.matchAll(/styles\.([a-f0-9]{8})\.css/g)];
      if (cssMatches.length > 1) {
        const hashes = cssMatches.map(match => match[1]);
        const uniqueHashes = [...new Set(hashes)];
        expect(uniqueHashes.length).toBe(1);
      }
    });
  });

  describe('CSS Processing and Optimization', () => {
    it('should generate minified CSS for production', () => {
      // CSS should be minified (no unnecessary whitespace)
      expect(distCssContent).not.toMatch(/\n\s+/); // No indented lines
      expect(distCssContent).not.toContain('  '); // No double spaces
    });

    it('should include only used Tailwind utilities', () => {
      // Should include utilities that are used in the app
      expect(distCssContent).toContain('.bg-navy-900');
      expect(distCssContent).toContain('.text-gray-100');
      expect(distCssContent).toContain('.animate-spin');
      expect(distCssContent).toContain('.border-coral-500');
    });

    it('should include custom CSS layers', () => {
      // Should include custom scrollbar styles
      expect(distCssContent).toContain('.scrollbar-custom');
      expect(distCssContent).toContain('::-webkit-scrollbar');
      expect(distCssContent).toContain('scrollbar-width:thin');
    });

    it('should include custom color definitions', () => {
      // Should include custom navy and coral colors
      expect(distCssContent).toContain('#141827'); // navy-900
      expect(distCssContent).toContain('#2A3356'); // navy-700
      expect(distCssContent).toContain('#F65058'); // coral-500
    });
  });

  describe('Build Configuration Validation', () => {
    it('should generate single CSS file (no code splitting)', () => {
      const cssFiles = distAssets.filter(file => file.endsWith('.css'));
      expect(cssFiles.length).toBe(1);
    });

    it('should not include source maps in production build', () => {
      const sourceMapFiles = distAssets.filter(file => file.endsWith('.map'));
      expect(sourceMapFiles.length).toBe(0);
    });

    it('should include proper asset organization', () => {
      // Verify Vite config asset naming is working
      const cssFiles = distAssets.filter(file => file.endsWith('.css'));
      const jsFiles = distAssets.filter(file => file.endsWith('.js'));
      
      // CSS should follow styles.[hash].css pattern
      cssFiles.forEach(file => {
        expect(file).toMatch(/^styles\.[a-f0-9]+\.css$/);
      });
      
      // JS should be in js/ subdirectory
      jsFiles.forEach(file => {
        expect(file).toMatch(/^js\/.*\.[a-f0-9]+\.js$/);
      });
    });
  });

  describe('HTML Template Processing', () => {
    it('should remove development-only script references', () => {
      // Built HTML should not contain development script references
      expect(distIndexHtml).not.toContain('/index.tsx');
      expect(distIndexHtml).not.toContain('type="module" src="/index.tsx"');
    });

    it('should inject built asset references', () => {
      // Should contain references to built assets
      expect(distIndexHtml).toContain('href="/assets/styles.');
      expect(distIndexHtml).toContain('src="/assets/js/');
    });

    it('should preserve meta tags and other head elements', () => {
      expect(distIndexHtml).toContain('meta name="viewport"');
      expect(distIndexHtml).toContain('meta name="theme-color"');
      expect(distIndexHtml).toContain('<title>Glimmer</title>');
    });

    it('should preserve body classes and structure', () => {
      expect(distIndexHtml).toContain('class="bg-navy-900 text-gray-100');
      expect(distIndexHtml).toContain('id="root"');
      expect(distIndexHtml).toContain('Loading Glimmer...');
    });
  });
});