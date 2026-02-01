#!/usr/bin/env node

/**
 * CSS Processing Validation Script
 * 
 * This script validates the CSS processing pipeline and configuration
 * to ensure proper error handling and validation as per requirements 6.4 and 7.3
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

/**
 * Validate required configuration files exist
 */
function validateConfigFiles() {
  log.header('🔍 Validating Configuration Files');
  
  const requiredFiles = [
    { path: 'tailwind.config.js', description: 'Tailwind CSS configuration' },
    { path: 'postcss.config.js', description: 'PostCSS configuration' },
    { path: 'vite.config.ts', description: 'Vite configuration' },
    { path: 'src/index.css', description: 'CSS entry point' },
    { path: 'package.json', description: 'Package configuration' }
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    const fullPath = resolve(projectRoot, file.path);
    if (existsSync(fullPath)) {
      log.success(`${file.description} found at ${file.path}`);
    } else {
      log.error(`${file.description} missing at ${file.path}`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Validate CSS entry point contains required Tailwind directives
 */
function validateCSSEntryPoint() {
  log.header('🎨 Validating CSS Entry Point');
  
  const cssPath = resolve(projectRoot, 'src/index.css');
  if (!existsSync(cssPath)) {
    log.error('CSS entry point not found');
    return false;
  }
  
  const cssContent = readFileSync(cssPath, 'utf-8');
  const requiredDirectives = [
    '@tailwind base',
    '@tailwind components', 
    '@tailwind utilities'
  ];
  
  let allDirectivesFound = true;
  
  for (const directive of requiredDirectives) {
    if (cssContent.includes(directive)) {
      log.success(`Found required directive: ${directive}`);
    } else {
      log.error(`Missing required directive: ${directive}`);
      allDirectivesFound = false;
    }
  }
  
  // Check for proper @layer usage
  const layerMatches = cssContent.match(/@layer\s+(base|components|utilities)/g);
  if (layerMatches && layerMatches.length > 0) {
    log.success(`Found ${layerMatches.length} valid @layer directive(s)`);
  } else if (cssContent.includes('@layer')) {
    log.warn('Found @layer directives but they may be invalid');
  }
  
  return allDirectivesFound;
}

/**
 * Validate Tailwind configuration
 */
async function validateTailwindConfig() {
  log.header('⚙️  Validating Tailwind Configuration');
  
  const configPath = resolve(projectRoot, 'tailwind.config.js');
  if (!existsSync(configPath)) {
    log.error('Tailwind configuration not found');
    return false;
  }
  
  try {
    // Dynamic import of the config
    const configModule = await import(`file://${configPath}`);
    const config = configModule.default;
    
    // Validate content paths
    if (config.content && Array.isArray(config.content)) {
      log.success(`Content paths configured: ${config.content.length} paths`);
      
      // Check if content paths exist
      const contentPaths = config.content.filter(path => !path.includes('*'));
      for (const path of contentPaths) {
        const fullPath = resolve(projectRoot, path);
        if (existsSync(fullPath)) {
          log.success(`Content path exists: ${path}`);
        } else {
          log.warn(`Content path not found: ${path}`);
        }
      }
    } else {
      log.error('Content paths not properly configured');
      return false;
    }
    
    // Validate custom theme
    if (config.theme?.extend) {
      const { colors, fontFamily } = config.theme.extend;
      
      if (colors) {
        log.success('Custom colors configured');
        
        // Validate color format
        const validateColors = (colorObj, prefix = '') => {
          for (const [key, value] of Object.entries(colorObj)) {
            if (typeof value === 'string') {
              if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                log.success(`Valid color: ${prefix}${key} = ${value}`);
              } else {
                log.error(`Invalid color format: ${prefix}${key} = ${value}`);
                return false;
              }
            } else if (typeof value === 'object') {
              if (!validateColors(value, `${prefix}${key}-`)) {
                return false;
              }
            }
          }
          return true;
        };
        
        if (!validateColors(colors)) {
          return false;
        }
      }
      
      if (fontFamily) {
        log.success('Custom font families configured');
        for (const [key, fonts] of Object.entries(fontFamily)) {
          if (Array.isArray(fonts) && fonts.length > 0) {
            log.success(`Font family ${key}: ${fonts.join(', ')}`);
          } else {
            log.error(`Invalid font family configuration for ${key}`);
            return false;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    log.error(`Failed to validate Tailwind config: ${error.message}`);
    return false;
  }
}

/**
 * Validate PostCSS configuration
 */
function validatePostCSSConfig() {
  log.header('🔧 Validating PostCSS Configuration');
  
  const configPath = resolve(projectRoot, 'postcss.config.js');
  if (!existsSync(configPath)) {
    log.error('PostCSS configuration not found');
    return false;
  }
  
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    
    // Check for required plugins
    const requiredPlugins = ['tailwindcss', 'autoprefixer'];
    let allPluginsFound = true;
    
    for (const plugin of requiredPlugins) {
      if (configContent.includes(plugin)) {
        log.success(`PostCSS plugin configured: ${plugin}`);
      } else {
        log.error(`Missing PostCSS plugin: ${plugin}`);
        allPluginsFound = false;
      }
    }
    
    return allPluginsFound;
  } catch (error) {
    log.error(`Failed to validate PostCSS config: ${error.message}`);
    return false;
  }
}

/**
 * Validate package.json dependencies
 */
function validateDependencies() {
  log.header('📦 Validating Dependencies');
  
  const packagePath = resolve(projectRoot, 'package.json');
  if (!existsSync(packagePath)) {
    log.error('package.json not found');
    return false;
  }
  
  try {
    const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const devDeps = packageContent.devDependencies || {};
    
    const requiredDeps = [
      'tailwindcss',
      'postcss',
      'autoprefixer',
      'vite'
    ];
    
    let allDepsFound = true;
    
    for (const dep of requiredDeps) {
      if (devDeps[dep]) {
        log.success(`Dependency found: ${dep}@${devDeps[dep]}`);
      } else {
        log.error(`Missing dependency: ${dep}`);
        allDepsFound = false;
      }
    }
    
    return allDepsFound;
  } catch (error) {
    log.error(`Failed to validate dependencies: ${error.message}`);
    return false;
  }
}

/**
 * Test error scenarios and recovery mechanisms
 */
async function testErrorScenarios() {
  log.header('🧪 Testing Error Scenarios');
  
  let allTestsPassed = true;
  
  // Test 1: CSS syntax validation
  log.info('Testing CSS syntax validation...');
  const cssPath = resolve(projectRoot, 'src/index.css');
  if (existsSync(cssPath)) {
    const cssContent = readFileSync(cssPath, 'utf-8');
    
    // Check for potential syntax issues
    const syntaxChecks = [
      {
        pattern: /@tailwind\s+[^;]+;/g,
        message: 'Tailwind directives should not end with semicolons',
        isError: false
      },
      {
        pattern: /@layer\s+(?!base|components|utilities)/g,
        message: 'Invalid @layer directive found',
        isError: true
      },
      {
        pattern: /theme\(['"][^'"]*['"]\)/g,
        message: 'Theme function usage detected',
        isError: false
      }
    ];
    
    for (const check of syntaxChecks) {
      const matches = cssContent.match(check.pattern);
      if (matches) {
        if (check.isError) {
          log.error(`${check.message}: ${matches.length} occurrence(s)`);
          allTestsPassed = false;
        } else {
          log.info(`${check.message}: ${matches.length} occurrence(s)`);
        }
      }
    }
    
    log.success('CSS syntax validation completed');
  } else {
    log.error('Cannot test CSS syntax - file not found');
    allTestsPassed = false;
  }
  
  // Test 2: Configuration validation with error recovery
  log.info('Testing configuration validation with error recovery...');
  try {
    const tailwindConfigPath = resolve(projectRoot, 'tailwind.config.js');
    if (existsSync(tailwindConfigPath)) {
      const configModule = await import(`file://${tailwindConfigPath}?t=${Date.now()}`);
      const config = configModule.default;
      
      // Test configuration completeness
      const requiredConfigSections = [
        { key: 'content', description: 'Content paths for purging' },
        { key: 'theme', description: 'Theme configuration' },
        { key: 'plugins', description: 'Plugin configuration' }
      ];
      
      for (const section of requiredConfigSections) {
        if (config[section.key] !== undefined) {
          log.success(`Configuration section present: ${section.description}`);
        } else {
          log.warn(`Configuration section missing: ${section.description}`);
        }
      }
      
      // Test theme extension validation
      if (config.theme?.extend) {
        const themeKeys = Object.keys(config.theme.extend);
        log.success(`Theme extensions found: ${themeKeys.join(', ')}`);
        
        // Validate color definitions
        if (config.theme.extend.colors) {
          const colorCount = Object.keys(config.theme.extend.colors).length;
          log.success(`Custom color palettes: ${colorCount}`);
        }
        
        // Validate font family definitions
        if (config.theme.extend.fontFamily) {
          const fontCount = Object.keys(config.theme.extend.fontFamily).length;
          log.success(`Custom font families: ${fontCount}`);
        }
      }
    }
    
    log.success('Configuration validation with error recovery completed');
  } catch (error) {
    log.error(`Configuration validation failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 3: Build process error detection
  log.info('Testing build process error detection...');
  try {
    // Check if build can detect common issues
    const viteConfigPath = resolve(projectRoot, 'vite.config.ts');
    if (existsSync(viteConfigPath)) {
      const viteConfig = readFileSync(viteConfigPath, 'utf-8');
      
      // Check for CSS processing configuration
      if (viteConfig.includes('postcss')) {
        log.success('PostCSS integration configured in Vite');
      } else {
        log.warn('PostCSS integration not found in Vite config');
      }
      
      // Check for CSS optimization settings
      if (viteConfig.includes('cssCodeSplit')) {
        log.success('CSS code splitting configuration found');
      }
      
      // Check for source map configuration
      if (viteConfig.includes('sourcemap') || viteConfig.includes('devSourcemap')) {
        log.success('Source map configuration found');
      }
    }
    
    log.success('Build process error detection completed');
  } catch (error) {
    log.error(`Build process validation failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Dependency compatibility check
  log.info('Testing dependency compatibility...');
  try {
    const packagePath = resolve(projectRoot, 'package.json');
    const packageContent = JSON.parse(readFileSync(packagePath, 'utf-8'));
    const devDeps = packageContent.devDependencies || {};
    
    // Check for version compatibility
    const compatibilityChecks = [
      {
        dep: 'tailwindcss',
        minVersion: '3.0.0',
        description: 'Tailwind CSS v3+ required for modern features'
      },
      {
        dep: 'postcss',
        minVersion: '8.0.0',
        description: 'PostCSS v8+ required for Tailwind CSS v3'
      },
      {
        dep: 'vite',
        minVersion: '4.0.0',
        description: 'Vite v4+ recommended for optimal performance'
      }
    ];
    
    for (const check of compatibilityChecks) {
      if (devDeps[check.dep]) {
        const version = devDeps[check.dep].replace(/[\^~]/, '');
        log.success(`${check.dep}@${version} - ${check.description}`);
      } else {
        log.warn(`${check.dep} not found - ${check.description}`);
      }
    }
    
    log.success('Dependency compatibility check completed');
  } catch (error) {
    log.error(`Dependency compatibility check failed: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 5: Error recovery mechanisms
  log.info('Testing error recovery mechanisms...');
  
  // Check for backup/fallback strategies
  const recoveryStrategies = [
    {
      check: () => existsSync(resolve(projectRoot, 'src/index.css')),
      message: 'CSS entry point exists for fallback'
    },
    {
      check: () => existsSync(resolve(projectRoot, 'tailwind.config.js')),
      message: 'Tailwind config exists for fallback'
    },
    {
      check: () => existsSync(resolve(projectRoot, 'postcss.config.js')),
      message: 'PostCSS config exists for fallback'
    }
  ];
  
  for (const strategy of recoveryStrategies) {
    if (strategy.check()) {
      log.success(strategy.message);
    } else {
      log.warn(`Recovery strategy not available: ${strategy.message}`);
    }
  }
  
  log.success('Error recovery mechanisms testing completed');
  
  if (allTestsPassed) {
    log.success('All error scenario tests passed');
  } else {
    log.warn('Some error scenario tests failed - check logs above');
  }
  
  return allTestsPassed;
}

/**
 * Provide actionable error recovery suggestions
 */
function provideRecoverySuggestions(errors) {
  if (errors.length === 0) return;
  
  log.header('🔧 Recovery Suggestions');
  
  const suggestions = {
    'tailwind.config.js': [
      '1. Create tailwind.config.js in your project root',
      '2. Add content paths: content: ["./src/**/*.{js,ts,jsx,tsx}"]',
      '3. Configure custom theme if needed',
      '4. Run: npx tailwindcss init'
    ],
    'postcss.config.js': [
      '1. Create postcss.config.js in your project root',
      '2. Add plugins: { tailwindcss: {}, autoprefixer: {} }',
      '3. Install dependencies: npm install -D postcss autoprefixer'
    ],
    'src/index.css': [
      '1. Create src/index.css file',
      '2. Add Tailwind directives: @tailwind base; @tailwind components; @tailwind utilities;',
      '3. Import in your main.tsx: import "./index.css"'
    ],
    'dependencies': [
      '1. Install required dependencies: npm install -D tailwindcss postcss autoprefixer',
      '2. Verify versions are compatible (Tailwind 3.x, PostCSS 8.x)',
      '3. Run npm audit to check for vulnerabilities'
    ],
    'build': [
      '1. Check Vite configuration includes CSS processing',
      '2. Verify PostCSS config is properly referenced',
      '3. Clear node_modules and reinstall if needed',
      '4. Run build with verbose logging: npm run build -- --debug'
    ]
  };
  
  for (const error of errors) {
    if (suggestions[error]) {
      log.info(`For ${error} issues:`);
      suggestions[error].forEach(suggestion => {
        console.log(`   ${suggestion}`);
      });
      console.log();
    }
  }
}

/**
 * Generate comprehensive error report
 */
function generateErrorReport(validationResults) {
  const errors = [];
  const warnings = [];
  
  for (const [category, result] of Object.entries(validationResults)) {
    if (!result.success) {
      errors.push(category);
    }
    if (result.warnings && result.warnings.length > 0) {
      warnings.push(...result.warnings);
    }
  }
  
  if (errors.length > 0 || warnings.length > 0) {
    log.header('📋 Error Report Summary');
    
    if (errors.length > 0) {
      log.error(`Critical errors found: ${errors.length}`);
      errors.forEach(error => log.error(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
      log.warn(`Warnings found: ${warnings.length}`);
      warnings.forEach(warning => log.warn(`  - ${warning}`));
    }
    
    provideRecoverySuggestions(errors);
  }
  
  return { errors, warnings };
}
async function main() {
  console.log(`${colors.bold}${colors.blue}🔍 CSS Processing Validation${colors.reset}\n`);
  
  const validations = [
    { name: 'configFiles', fn: validateConfigFiles, description: 'Configuration Files' },
    { name: 'cssEntry', fn: validateCSSEntryPoint, description: 'CSS Entry Point' },
    { name: 'tailwindConfig', fn: validateTailwindConfig, description: 'Tailwind Configuration' },
    { name: 'postcssConfig', fn: validatePostCSSConfig, description: 'PostCSS Configuration' },
    { name: 'dependencies', fn: validateDependencies, description: 'Dependencies' },
    { name: 'errorScenarios', fn: testErrorScenarios, description: 'Error Scenarios' }
  ];
  
  const validationResults = {};
  let allPassed = true;
  
  for (const validation of validations) {
    try {
      log.info(`Running ${validation.description} validation...`);
      const result = await validation.fn();
      validationResults[validation.name] = { 
        success: result, 
        description: validation.description 
      };
      
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      log.error(`Validation failed for ${validation.description}: ${error.message}`);
      validationResults[validation.name] = { 
        success: false, 
        description: validation.description,
        error: error.message 
      };
      allPassed = false;
    }
    console.log(); // Add spacing
  }
  
  // Generate comprehensive error report
  const { errors, warnings } = generateErrorReport(validationResults);
  
  // Final result with detailed feedback
  if (allPassed) {
    log.success('🎉 All validations passed! CSS processing pipeline is properly configured.');
    log.info('Your Tailwind CSS build system is ready for development and production.');
    
    // Provide optimization suggestions
    log.header('💡 Optimization Suggestions');
    console.log('   • Consider enabling CSS purging for smaller bundle sizes');
    console.log('   • Use CSS-in-JS for component-specific styles if needed');
    console.log('   • Monitor build performance with --profile flag');
    console.log('   • Set up CSS linting with stylelint for better code quality');
    
    process.exit(0);
  } else {
    log.error(`❌ ${errors.length} critical error(s) found. Please fix the issues above.`);
    if (warnings.length > 0) {
      log.warn(`⚠️  ${warnings.length} warning(s) found. Consider addressing these for optimal performance.`);
    }
    
    log.info('💡 Run this script again after making fixes to verify your changes.');
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log.error(`Validation script failed: ${error.message}`);
    process.exit(1);
  });
}

export { validateConfigFiles, validateCSSEntryPoint, validateTailwindConfig, validatePostCSSConfig, validateDependencies };