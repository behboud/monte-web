#!/usr/bin/env node
/**
 * Validates theme.json structure and font definitions
 * Ensures theme.json remains valid and follows WordPress standards
 */

const fs = require('fs');
const path = require('path');

const themeJsonPath = path.join(__dirname, '../theme.json');

try {
  const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf8'));
  
  // Validate required root fields
  if (!themeData.version || !themeData.$schema) {
    throw new Error('Missing required root fields: $schema, version');
  }
  
  // Validate fontFamilies
  const fonts = themeData.settings?.typography?.fontFamilies || [];
  const errors = [];
  
  fonts.forEach((font, idx) => {
    // Check required font family fields
    if (!font.name || !font.slug || !font.fontFamily) {
      errors.push(`Font[${idx}] missing required fields: name, slug, or fontFamily`);
    }
    
    // Check fontFace definitions
    if (!Array.isArray(font.fontFace) || font.fontFace.length === 0) {
      errors.push(`Font[${idx}] "${font.name}" has no fontFace definitions`);
    }
    
    // Validate each fontFace entry
    font.fontFace?.forEach((face, fIdx) => {
      if (!face.fontFamily || face.fontWeight === undefined || !face.fontStyle || !face.src) {
        errors.push(`Font[${idx}].fontFace[${fIdx}] missing required fields: fontFamily, fontWeight, fontStyle, or src`);
      }
      if (!Array.isArray(face.src) || face.src.length === 0) {
        errors.push(`Font[${idx}].fontFace[${fIdx}].src must be a non-empty array`);
      }
      // Verify font files exist
      face.src?.forEach((srcPath, srcIdx) => {
        const relativePath = srcPath.replace('file:', '');
        const absolutePath = path.resolve(__dirname, '..', relativePath);
        if (!fs.existsSync(absolutePath)) {
          errors.push(`Font[${idx}].fontFace[${fIdx}].src[${srcIdx}]: File not found: ${absolutePath}`);
        }
      });
    });
  });
  
  if (errors.length > 0) {
    console.error('❌ theme.json validation failed:\n' + errors.join('\n'));
    process.exit(1);
  }
  
  console.log('✅ theme.json is valid');
  console.log(`   - ${fonts.length} font families registered`);
  fonts.forEach(font => {
    console.log(`     • ${font.name} (${font.fontFace?.length || 0} weight variants)`);
  });
  
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('❌ Invalid JSON syntax in theme.json:');
    console.error(`   ${error.message}`);
  } else {
    console.error('❌ Failed to validate theme.json:', error.message);
  }
  process.exit(1);
}
