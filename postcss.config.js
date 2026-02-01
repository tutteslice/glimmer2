import { existsSync } from 'fs';
import { resolve } from 'path';

// Validate Tailwind configuration exists
const tailwindConfigPath = resolve(process.cwd(), 'tailwind.config.js');
if (!existsSync(tailwindConfigPath)) {
  throw new Error(
    `❌ Tailwind CSS configuration not found at ${tailwindConfigPath}\n` +
    `Please ensure tailwind.config.js exists in your project root.`
  );
}

// Enhanced PostCSS configuration with error handling
export default {
  plugins: {
    tailwindcss: {
      config: tailwindConfigPath,
    },
    autoprefixer: {
      // Add browser support configuration
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11',
      ],
    },
  },
}