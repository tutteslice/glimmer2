import { existsSync } from 'fs';
import { resolve } from 'path';

// Configuration validation
const validateConfig = () => {
  const errors = [];
  
  // Check if content paths exist
  const contentPaths = [
    "./index.html",
    "./src",
    "./components",
    "./services",
  ];
  
  for (const path of contentPaths) {
    const fullPath = resolve(process.cwd(), path);
    if (!existsSync(fullPath)) {
      console.warn(`⚠️  Tailwind content path not found: ${path}`);
    }
  }
  
  // Validate custom colors
  const customColors = {
    navy: { 900: '#141827', 800: '#1F2642', 700: '#2A3356' },
    coral: { 500: '#F65058', 600: '#D93E46' }
  };
  
  for (const [colorName, shades] of Object.entries(customColors)) {
    for (const [shade, hex] of Object.entries(shades)) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        errors.push(`Invalid hex color for ${colorName}-${shade}: ${hex}`);
      }
    }
  }
  
  // Validate font families
  const fonts = {
    serif: ['"Plus Jakarta Sans"', 'sans-serif'],
    sans: ['Inter', 'sans-serif']
  };
  
  for (const [fontType, fontStack] of Object.entries(fonts)) {
    if (!Array.isArray(fontStack) || fontStack.length === 0) {
      errors.push(`Invalid font stack for ${fontType}: must be a non-empty array`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(
      `❌ Tailwind configuration validation failed:\n${errors.map(e => `  • ${e}`).join('\n')}`
    );
  }
  
  console.log('✅ Tailwind configuration validated successfully');
};

// Run validation
validateConfig();

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#141827',
          800: '#1F2642',
          700: '#2A3356',
        },
        coral: {
          500: '#F65058',
          600: '#D93E46',
        }
      },
      fontFamily: {
        serif: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      }
    }
  },
  plugins: [],
}