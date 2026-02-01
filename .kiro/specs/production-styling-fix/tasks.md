# Implementation Plan: Production Styling Fix

## Overview

This implementation plan transforms the Glimmer application from using Tailwind CSS via CDN to a proper build-time CSS processing pipeline. The approach focuses on incremental migration with validation at each step to ensure no visual regressions occur.

## Tasks

- [x] 1. Set up CSS processing infrastructure
  - Create main CSS entry point with Tailwind directives
  - Configure PostCSS with Tailwind CSS and Autoprefixer plugins
  - Update Vite configuration for CSS processing
  - _Requirements: 2.1, 2.2_

- [ ]* 1.1 Write property test for PostCSS configuration
  - **Property 2: PostCSS Processing Pipeline**
  - **Validates: Requirements 1.2, 2.3**

- [x] 2. Create Tailwind configuration file
  - Extract custom theme configuration from inline script
  - Create tailwind.config.js with custom colors and fonts
  - Configure content paths for proper tree-shaking
  - _Requirements: 7.1, 7.2, 3.2_

- [ ]* 2.1 Write property test for custom theme generation
  - **Property 7: Custom Theme Generation**
  - **Validates: Requirements 3.2, 7.2**

- [x] 3. Migrate custom styles to CSS layers
  - Convert inline styles to Tailwind CSS layers
  - Implement custom scrollbar styles using @layer components
  - Preserve body and heading font configurations
  - _Requirements: 3.3, 2.2_

- [ ]* 3.1 Write property test for custom CSS preservation
  - **Property 4: Custom CSS Preservation**
  - **Validates: Requirements 2.2, 3.3**

- [x] 4. Update HTML template
  - Remove Tailwind CDN script tags
  - Remove inline Tailwind configuration
  - Import CSS entry point in main TypeScript file
  - Preserve font loading links and meta tags
  - _Requirements: 1.3, 1.4, 3.1_

- [ ]* 4.1 Write property test for CDN reference removal
  - **Property 3: CDN Reference Removal**
  - **Validates: Requirements 1.3, 1.4**

- [x] 5. Configure build optimization
  - Update Vite configuration for CSS bundling
  - Configure asset naming with hash suffixes
  - Set up source map generation for development only
  - _Requirements: 5.2, 5.4, 2.4_

- [ ]* 5.1 Write property test for build output optimization
  - **Property 1: Build Output Optimization**
  - **Validates: Requirements 1.1, 5.1**

- [ ]* 5.2 Write property test for production optimization
  - **Property 5: Production Optimization**
  - **Validates: Requirements 2.4, 5.3**

- [x] 6. Checkpoint - Verify build system functionality
  - Run development build and verify CSS processing
  - Run production build and verify optimization
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Test backward compatibility
  - Verify all existing Tailwind classes work correctly
  - Compare visual output with CDN version
  - Test custom color and font utilities
  - _Requirements: 8.1, 8.2, 8.4_

- [ ]* 7.1 Write property test for backward compatibility
  - **Property 11: Backward Compatibility**
  - **Validates: Requirements 8.1, 8.2, 8.4**

- [x] 8. Validate asset management
  - Test font loading and asset references
  - Verify asset path generation for static hosting
  - Test asset hashing for cache busting
  - _Requirements: 3.1, 3.4, 4.3, 5.4_

- [ ]* 8.1 Write property test for font asset management
  - **Property 6: Font Asset Management**
  - **Validates: Requirements 3.1, 3.4**

- [ ]* 8.2 Write property test for asset path generation
  - **Property 8: Asset Path Generation**
  - **Validates: Requirements 4.3**

- [x] 9. Configure error handling and validation
  - Set up clear error messages for CSS processing failures
  - Add configuration validation for Tailwind setup
  - Test error scenarios and recovery
  - _Requirements: 6.4, 7.3_

- [ ]* 9.1 Write unit tests for error handling
  - Test invalid CSS and configuration error messages
  - _Requirements: 6.4, 7.3_

- [x] 10. Final integration and cleanup
  - Remove all CDN-related code and comments
  - Update any remaining inline styles
  - Verify complete migration from CDN to build-time processing
  - _Requirements: 1.4, 8.3_

- [ ]* 10.1 Write property test for custom CSS functionality
  - **Property 12: Custom CSS Functionality**
  - **Validates: Requirements 8.3**

- [x] 11. Final checkpoint - Complete system validation
  - Run full build pipeline and verify all outputs
  - Test development and production modes
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the migration
- Property tests validate universal correctness properties
- Unit tests validate specific examples and error conditions
- The migration maintains visual consistency while improving performance and reliability