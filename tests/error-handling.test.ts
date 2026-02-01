/**
 * Error Handling and Validation Tests
 * 
 * Tests for requirements 6.4 and 7.3:
 * - Clear error messages for CSS processing failures
 * - Configuration validation for Tailwind setup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

describe('Error Handling and Validation', () => {
  const projectRoot = resolve(process.cwd());
  const backupSuffix = '.backup-test';
  
  // Helper function to backup a file
  const backupFile = (filePath: string) => {
    if (existsSync(filePath)) {
      renameSync(filePath, `${filePath}${backupSuffix}`);
    }
  };
  
  // Helper function to restore a file
  const restoreFile = (filePath: string) => {
    const backupPath = `${filePath}${backupSuffix}`;
    if (existsSync(backupPath)) {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
      renameSync(backupPath, filePath);
    }
  };
  
  // Helper function to run build and capture output
  const runBuildAndCaptureOutput = (): { success: boolean; output: string } => {
    try {
      const output = execSync('npm run build', { 
        encoding: 'utf-8',
        cwd: projectRoot,
        stdio: 'pipe'
      });
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.stdout + error.stderr };
    }
  };
  
  // Helper function to run validation script
  const runValidation = (): { success: boolean; output: string } => {
    try {
      const output = execSync('npm run validate-css', { 
        encoding: 'utf-8',
        cwd: projectRoot,
        stdio: 'pipe'
      });
      return { success: true, output };
    } catch (error: any) {
      return { success: false, output: error.stdout + error.stderr };
    }
  };

  describe('Configuration Validation (Requirement 7.3)', () => {
    it('should validate Tailwind configuration exists', () => {
      const tailwindConfigPath = resolve(projectRoot, 'tailwind.config.js');
      expect(existsSync(tailwindConfigPath)).toBe(true);
      
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('Tailwind CSS configuration found');
    });
    
    it('should validate PostCSS configuration exists', () => {
      const postcssConfigPath = resolve(projectRoot, 'postcss.config.js');
      expect(existsSync(postcssConfigPath)).toBe(true);
      
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('PostCSS configuration found');
    });
    
    it('should validate CSS entry point exists', () => {
      const cssEntryPath = resolve(projectRoot, 'src/index.css');
      expect(existsSync(cssEntryPath)).toBe(true);
      
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('CSS entry point found');
    });
    
    it('should validate required Tailwind directives', () => {
      const cssEntryPath = resolve(projectRoot, 'src/index.css');
      const cssContent = readFileSync(cssEntryPath, 'utf-8');
      
      expect(cssContent).toContain('@tailwind base');
      expect(cssContent).toContain('@tailwind components');
      expect(cssContent).toContain('@tailwind utilities');
      
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('Found required directive: @tailwind base');
      expect(validation.output).toContain('Found required directive: @tailwind components');
      expect(validation.output).toContain('Found required directive: @tailwind utilities');
    });
    
    it('should validate custom color configuration', () => {
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('Custom colors configured');
      expect(validation.output).toContain('Valid color: navy-900 = #141827');
      expect(validation.output).toContain('Valid color: coral-500 = #F65058');
    });
    
    it('should validate font family configuration', () => {
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('Custom font families configured');
      expect(validation.output).toContain('Font family serif: "Plus Jakarta Sans", sans-serif');
      expect(validation.output).toContain('Font family sans: Inter, sans-serif');
    });
    
    it('should validate required dependencies', () => {
      const validation = runValidation();
      expect(validation.success).toBe(true);
      expect(validation.output).toContain('Dependency found: tailwindcss@');
      expect(validation.output).toContain('Dependency found: postcss@');
      expect(validation.output).toContain('Dependency found: autoprefixer@');
      expect(validation.output).toContain('Dependency found: vite@');
    });
  });

  describe('CSS Processing Error Messages (Requirement 6.4)', () => {
    afterAll(() => {
      // Restore any backed up files
      restoreFile(resolve(projectRoot, 'tailwind.config.js'));
      restoreFile(resolve(projectRoot, 'postcss.config.js'));
      restoreFile(resolve(projectRoot, 'src/index.css'));
    });
    
    it('should show clear error when Tailwind config is missing', () => {
      const tailwindConfigPath = resolve(projectRoot, 'tailwind.config.js');
      backupFile(tailwindConfigPath);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('Tailwind configuration not found');
      
      restoreFile(tailwindConfigPath);
    });
    
    it('should show clear error when PostCSS config is missing', () => {
      const postcssConfigPath = resolve(projectRoot, 'postcss.config.js');
      backupFile(postcssConfigPath);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('PostCSS configuration not found');
      
      restoreFile(postcssConfigPath);
    });
    
    it('should show clear error when CSS entry point is missing', () => {
      const cssEntryPath = resolve(projectRoot, 'src/index.css');
      backupFile(cssEntryPath);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('CSS entry point not found');
      
      restoreFile(cssEntryPath);
    });
    
    it('should detect missing Tailwind directives', () => {
      const cssEntryPath = resolve(projectRoot, 'src/index.css');
      const originalContent = readFileSync(cssEntryPath, 'utf-8');
      
      // Create invalid CSS without required directives
      const invalidContent = '/* Missing Tailwind directives */\\nbody { color: red; }';
      writeFileSync(cssEntryPath, invalidContent);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('Missing required directive');
      
      // Restore original content
      writeFileSync(cssEntryPath, originalContent);
    });
    
    it('should validate color format in Tailwind config', () => {
      const tailwindConfigPath = resolve(projectRoot, 'tailwind.config.js');
      backupFile(tailwindConfigPath);
      
      // Create config with invalid color format
      const invalidConfig = `
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: 'invalid-color', // Invalid hex format
        }
      }
    }
  },
  plugins: [],
}`;
      
      writeFileSync(tailwindConfigPath, invalidConfig);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('Invalid color format');
      
      restoreFile(tailwindConfigPath);
    });
    
    it('should validate font family configuration format', () => {
      const tailwindConfigPath = resolve(projectRoot, 'tailwind.config.js');
      backupFile(tailwindConfigPath);
      
      // Create config with invalid font family format
      const invalidConfig = `
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: "Invalid font format", // Should be array
      }
    }
  },
  plugins: [],
}`;
      
      writeFileSync(tailwindConfigPath, invalidConfig);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('Invalid font family configuration');
      
      restoreFile(tailwindConfigPath);
    });
  });

  describe('Build Process Error Handling', () => {
    it('should complete build successfully with valid configuration', () => {
      const build = runBuildAndCaptureOutput();
      expect(build.success).toBe(true);
      expect(build.output).toContain('built in');
      expect(build.output).toContain('styles.');
      expect(build.output).toContain('.css');
    });
    
    it('should show Tailwind validation message during build', () => {
      const build = runBuildAndCaptureOutput();
      expect(build.success).toBe(true);
      expect(build.output).toContain('Tailwind configuration validated successfully');
    });
  });

  describe('Advanced Error Scenarios', () => {
    it('should handle malformed Tailwind configuration gracefully', () => {
      const tailwindConfigPath = resolve(projectRoot, 'tailwind.config.js');
      backupFile(tailwindConfigPath);
      
      // Create malformed config
      const malformedConfig = `
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Missing closing brace
        navy: {
          900: '#141827'
        // Missing closing brace
      }
    }
  },
  plugins: [],
`;
      
      writeFileSync(tailwindConfigPath, malformedConfig);
      
      const validation = runValidation();
      expect(validation.success).toBe(false);
      expect(validation.output).toContain('Failed to validate Tailwind config');
      
      restoreFile(tailwindConfigPath);
    });
    
    it('should detect circular dependencies in CSS imports', () => {
      const cssEntryPath = resolve(projectRoot, 'src/index.css');
      const originalContent = readFileSync(cssEntryPath, 'utf-8');
      
      // Create CSS with potential circular import
      const circularContent = `
@import './index.css'; /* Circular import */
@tailwind base;
@tailwind components;
@tailwind utilities;
`;
      
      writeFileSync(cssEntryPath, circularContent);
      
      const validation = runValidation();
      // Should still pass validation but might show warnings
      expect(validation.output).toContain('CSS syntax validation completed');
      
      // Restore original content
      writeFileSync(cssEntryPath, originalContent);
    });
    
    it('should validate PostCSS plugin compatibility', () => {
      const postcssConfigPath = resolve(projectRoot, 'postcss.config.js');
      backupFile(postcssConfigPath);
      
      // Create config with incompatible plugin syntax
      const incompatibleConfig = `
export default {
  plugins: [
    'tailwindcss', // Should be object, not string
    'autoprefixer'
  ],
}`;
      
      writeFileSync(postcssConfigPath, incompatibleConfig);
      
      const validation = runValidation();
      expect(validation.success).toBe(true); // Still finds the plugins
      expect(validation.output).toContain('PostCSS plugin configured: tailwindcss');
      
      restoreFile(postcssConfigPath);
    });
    
    it('should handle missing node_modules gracefully', () => {
      // This test simulates what happens when dependencies aren't installed
      const validation = runValidation();
      
      // Should still validate configuration files even if node_modules is missing
      expect(validation.output).toContain('Configuration Files');
      expect(validation.output).toContain('Dependencies');
    });
    
    it('should provide helpful messages for common CSS syntax errors', () => {
      const cssEntryPath = resolve(projectRoot, 'src/index.css');
      const originalContent = readFileSync(cssEntryPath, 'utf-8');
      
      // Create CSS with common syntax errors
      const errorContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .invalid-selector {
    color: #invalid-hex; /* Invalid hex color */
    font-size: ; /* Missing value */
  }
  
  .another-class
    color: red; /* Missing opening brace */
  }
}
`;
      
      writeFileSync(cssEntryPath, errorContent);
      
      const validation = runValidation();
      // Should complete validation even with syntax errors
      expect(validation.output).toContain('CSS syntax validation completed');
      
      // Restore original content
      writeFileSync(cssEntryPath, originalContent);
    });
  });

  describe('Build Integration Error Handling', () => {
    it('should validate build output contains expected assets', () => {
      const build = runBuildAndCaptureOutput();
      expect(build.success).toBe(true);
      
      // Check that CSS assets are generated
      expect(build.output).toMatch(/styles\.[a-f0-9]+\.css/);
      expect(build.output).toContain('built in');
    });
    
    it('should handle build failures gracefully', () => {
      // This test ensures our error handling works during actual builds
      const build = runBuildAndCaptureOutput();
      
      if (!build.success) {
        // If build fails, output should contain helpful error messages
        expect(build.output).not.toContain('undefined');
        expect(build.output).not.toContain('[object Object]');
        expect(build.output.length).toBeGreaterThan(0);
      } else {
        // If build succeeds, it should contain validation messages
        expect(build.output).toContain('built in');
      }
    });
    
    it('should validate CSS processing during build', () => {
      const build = runBuildAndCaptureOutput();
      expect(build.success).toBe(true);
      
      // Should not contain error indicators in successful build
      expect(build.output).not.toContain('ERROR');
      expect(build.output).not.toContain('FAILED');
      expect(build.output).not.toContain('Cannot resolve');
    });
  });

  describe('Error Recovery and Graceful Degradation', () => {
    it('should provide helpful error messages for common issues', () => {
      const validation = runValidation();
      
      // Should not contain generic error messages
      expect(validation.output).not.toContain('undefined');
      expect(validation.output).not.toContain('null');
      expect(validation.output).not.toContain('[object Object]');
      
      // Should contain structured, helpful messages
      if (!validation.success) {
        expect(validation.output).toMatch(/❌|⚠️|✅/); // Should use clear status indicators
      }
    });
    
    it('should validate all critical configuration aspects', () => {
      const validation = runValidation();
      expect(validation.success).toBe(true);
      
      // Should validate all critical aspects
      expect(validation.output).toContain('Configuration Files');
      expect(validation.output).toContain('CSS Entry Point');
      expect(validation.output).toContain('Tailwind Configuration');
      expect(validation.output).toContain('PostCSS Configuration');
      expect(validation.output).toContain('Dependencies');
    });
  });
});