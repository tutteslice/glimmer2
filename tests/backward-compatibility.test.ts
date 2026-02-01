/**
 * Backward Compatibility Tests for Production Styling Fix
 * 
 * These tests verify that the migration from CDN to build-time processing
 * maintains identical visual output and functionality.
 * 
 * Requirements: 8.1, 8.2, 8.4
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Backward Compatibility Tests', () => {
  let generatedCSS: string;

  beforeAll(() => {
    // Read the generated CSS file
    const cssFiles = fs.readdirSync('dist/assets').filter(file => file.startsWith('styles.') && file.endsWith('.css'));
    expect(cssFiles.length).toBe(1);
    
    const cssPath = path.join('dist/assets', cssFiles[0]);
    generatedCSS = fs.readFileSync(cssPath, 'utf-8');
  });

  describe('Custom Colors', () => {
    it('should include navy color definitions', () => {
      // Navy colors should be defined and used
      expect(generatedCSS).toMatch(/--tw-bg-opacity: 1;background-color:rgb\(20 24 39/); // navy-900
      expect(generatedCSS).toMatch(/--tw-bg-opacity: 1;background-color:rgb\(31 38 66/); // navy-800
      expect(generatedCSS).toMatch(/--tw-bg-opacity: 1;background-color:rgb\(42 51 86/); // navy-700
    });

    it('should include coral color definitions', () => {
      // Coral colors should be defined and used
      expect(generatedCSS).toMatch(/--tw-bg-opacity: 1;background-color:rgb\(246 80 88/); // coral-500
      expect(generatedCSS).toMatch(/--tw-bg-opacity: 1;background-color:rgb\(217 62 70/); // coral-600
    });

    it('should generate custom color utility classes', () => {
      expect(generatedCSS).toContain('.bg-navy-900');
      expect(generatedCSS).toContain('.bg-navy-800');
      expect(generatedCSS).toContain('.bg-navy-700');
      expect(generatedCSS).toContain('.bg-coral-500');
      // coral-600 is only used in hover states, so check hover variant
      expect(generatedCSS).toContain('.hover\\:bg-coral-600:hover');
      expect(generatedCSS).toContain('.text-coral-500');
      expect(generatedCSS).toContain('.border-coral-500');
    });
  });

  describe('Font Families', () => {
    it('should include custom font family definitions', () => {
      // Check that Plus Jakarta Sans is defined for serif
      expect(generatedCSS).toMatch(/font-family:Plus Jakarta Sans,sans-serif/);
      // Check that Inter is defined for sans
      expect(generatedCSS).toMatch(/font-family:Inter,sans-serif/);
    });

    it('should generate font family utility classes', () => {
      expect(generatedCSS).toContain('.font-serif');
      // font-sans is not used explicitly in components, but font-mono is
      expect(generatedCSS).toContain('.font-mono');
    });

    it('should apply correct fonts to base elements', () => {
      // Body should use Inter
      expect(generatedCSS).toMatch(/body\{[^}]*font-family:Inter,sans-serif/);
      // Headings should use Plus Jakarta Sans
      expect(generatedCSS).toMatch(/h1,h2,h3,h4,h5,h6\{[^}]*font-family:Plus Jakarta Sans,sans-serif/);
    });
  });

  describe('Custom Scrollbar Styles', () => {
    it('should include global scrollbar styles', () => {
      expect(generatedCSS).toMatch(/::-webkit-scrollbar\{[^}]*width:8px/);
      expect(generatedCSS).toMatch(/::-webkit-scrollbar\{[^}]*background:#141827/);
      expect(generatedCSS).toMatch(/::-webkit-scrollbar-thumb\{[^}]*background:#2A3356/);
      expect(generatedCSS).toMatch(/::-webkit-scrollbar-thumb\{[^}]*border-radius:4px/);
    });

    it('should include custom scrollbar component class', () => {
      expect(generatedCSS).toContain('.scrollbar-custom');
      expect(generatedCSS).toMatch(/\.scrollbar-custom\{[^}]*scrollbar-width:thin/);
      expect(generatedCSS).toMatch(/\.scrollbar-custom\{[^}]*scrollbar-color:#2A3356 #141827/);
    });

    it('should include hover effects for scrollbar', () => {
      expect(generatedCSS).toMatch(/::-webkit-scrollbar-thumb:hover\{[^}]*background:#F65058/);
    });
  });

  describe('Essential Tailwind Utilities', () => {
    it('should include layout utilities', () => {
      expect(generatedCSS).toContain('.flex');
      expect(generatedCSS).toContain('.flex-col');
      expect(generatedCSS).toContain('.items-center');
      expect(generatedCSS).toContain('.justify-center');
      expect(generatedCSS).toContain('.justify-between');
      expect(generatedCSS).toContain('.h-full');
      expect(generatedCSS).toContain('.h-screen');
      expect(generatedCSS).toContain('.w-full');
    });

    it('should include spacing utilities', () => {
      expect(generatedCSS).toContain('.p-4');
      expect(generatedCSS).toContain('.p-6');
      expect(generatedCSS).toContain('.p-8');
      expect(generatedCSS).toContain('.px-4');
      expect(generatedCSS).toContain('.py-3');
      expect(generatedCSS).toContain('.mb-4');
      expect(generatedCSS).toContain('.mt-8');
      expect(generatedCSS).toContain('.gap-2');
      expect(generatedCSS).toContain('.gap-4');
    });

    it('should include border and rounded utilities', () => {
      expect(generatedCSS).toContain('.border');
      expect(generatedCSS).toContain('.border-white\\/10');
      expect(generatedCSS).toContain('.rounded-lg');
      expect(generatedCSS).toContain('.rounded-xl');
      expect(generatedCSS).toContain('.rounded-2xl');
      expect(generatedCSS).toContain('.rounded-full');
    });

    it('should include text utilities', () => {
      expect(generatedCSS).toContain('.text-white');
      expect(generatedCSS).toContain('.text-gray-400');
      expect(generatedCSS).toContain('.text-xl');
      expect(generatedCSS).toContain('.text-2xl');
      expect(generatedCSS).toContain('.font-bold');
      expect(generatedCSS).toContain('.font-semibold');
    });

    it('should include animation utilities', () => {
      expect(generatedCSS).toContain('.animate-pulse');
      expect(generatedCSS).toContain('.animate-spin');
      expect(generatedCSS).toContain('.transition-colors');
      expect(generatedCSS).toContain('.transition-all');
    });

    it('should include hover and focus states', () => {
      expect(generatedCSS).toMatch(/\.hover\\:bg-coral-500:hover/);
      expect(generatedCSS).toMatch(/\.hover\\:text-white:hover/);
      expect(generatedCSS).toMatch(/\.focus\\:border-coral-500:focus/);
      expect(generatedCSS).toMatch(/\.focus\\:outline-none:focus/);
    });
  });

  describe('CSS Optimization', () => {
    it('should be minified for production', () => {
      // CSS should be minified (no unnecessary whitespace)
      expect(generatedCSS).not.toMatch(/\n\s+/);
      expect(generatedCSS).not.toMatch(/\{\s+/);
      expect(generatedCSS).not.toMatch(/;\s+/);
    });

    it('should include only used utilities (tree-shaken)', () => {
      // Should not include utilities that aren't used in the app
      expect(generatedCSS).not.toContain('.bg-pink-500');
      expect(generatedCSS).not.toContain('.text-orange-500');
      expect(generatedCSS).not.toContain('.border-yellow-500');
    });

    it('should have reasonable file size', () => {
      // CSS file should be reasonably sized (not bloated)
      const fileSizeKB = Buffer.byteLength(generatedCSS, 'utf8') / 1024;
      expect(fileSizeKB).toBeLessThan(50); // Should be under 50KB
      expect(fileSizeKB).toBeGreaterThan(10); // Should have substantial content
    });
  });

  describe('Selection Styles', () => {
    it('should include custom selection colors', () => {
      expect(generatedCSS).toMatch(/\.selection\\:bg-coral-500/);
      expect(generatedCSS).toMatch(/\.selection\\:text-white/);
    });
  });

  describe('Backdrop and Effects', () => {
    it('should include backdrop blur utilities', () => {
      expect(generatedCSS).toContain('.backdrop-blur-md');
      expect(generatedCSS).toContain('.backdrop-blur-sm');
    });

    it('should include shadow utilities', () => {
      expect(generatedCSS).toContain('.shadow-lg');
      expect(generatedCSS).toContain('.shadow-xl');
      expect(generatedCSS).toContain('.shadow-2xl');
    });
  });
});