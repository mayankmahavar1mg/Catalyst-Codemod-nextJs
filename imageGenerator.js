const fs = require("fs-extra");
const path = require("path");

// Get command line arguments
const args = process.argv.slice(2);

// Help text
const helpText = `
Usage: node imageGenerator.js <imageDir> <outputFile>

Arguments:
  imageDir     Directory containing images
  outputFile   Output file path for the index

Example: 
  node imageGenerator.js ./images ./src/utils/imageIndex.js
`;

// Show help if requested
if (args.includes("--help")) {
  console.log(helpText);
  process.exit(0);
}

// Check if required arguments are provided
if (args.length < 2) {
  console.error("\n❌ Error: Missing required arguments.");
  console.log(helpText);
  process.exit(1);
}

// Configuration
const CONFIG = {
  imageDir: args[0],
  outputFile: args[1],
  validExtensions: [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
  ignore: [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".DS_Store",
    "thumbs.db",
    "*.test.*",
    "*.spec.*",
  ],
};

// Validate input paths
if (!fs.existsSync(CONFIG.imageDir)) {
  console.error(
    `\n❌ Error: Image directory "${CONFIG.imageDir}" does not exist.`
  );
  process.exit(1);
}

function shouldIgnore(itemPath) {
  const baseName = path.basename(itemPath);

  if (itemPath.includes("node_modules")) {
    return true;
  }

  return CONFIG.ignore.some((pattern) => {
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
      return new RegExp(regexPattern).test(baseName);
    }
    return baseName === pattern;
  });
}

function findImagesRecursively(dir, ignoredPaths = new Set()) {
  let results = [];

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);

      if (shouldIgnore(fullPath)) {
        ignoredPaths.add(fullPath);
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        results = results.concat(findImagesRecursively(fullPath, ignoredPaths));
      } else {
        if (CONFIG.validExtensions.includes(path.extname(item).toLowerCase())) {
          const relativePath = path.relative(CONFIG.imageDir, fullPath);
          results.push({
            relativePath,
            identifier: relativePath
              .replace(/[^a-zA-Z0-9]/g, "_")
              .replace(/^[0-9]/, "_$&"),
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return results;
}

function generateImageIndex() {
  try {
    console.log(`\n🔍 Scanning for images in: ${CONFIG.imageDir}`);

    const outputDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const imageFiles = findImagesRecursively(CONFIG.imageDir);
    const processedImages = new Map();

    let fileContent = `// This file is auto-generated. Do not edit manually.\n`;
    fileContent += `// Generated on ${new Date().toISOString()}\n\n`;
    
    // Add loadable import
    fileContent += `import loadableComponent from "@loadable/component";\n\n`;

    // Create loadable components for each image
    imageFiles.forEach(({ relativePath, identifier }) => {
      const importPath = relativePath.split(path.sep).join("/");
      const fullImportPath = `${path.relative(
        outputDir,
        CONFIG.imageDir
      )}/${importPath}`;
      
      fileContent += `export const ${identifier} = loadableComponent(() =>
  import("${fullImportPath}")
);\n`;
      processedImages.set(identifier, relativePath);
    });

    // Create a mapping object for all image components
    fileContent += `\n// Export image components mapping\n`;
    fileContent += `export const imageComponents = {\n`;
    processedImages.forEach((_, identifier) => {
      fileContent += `  ${identifier},\n`;
    });
    fileContent += `};\n\n`;

    // Create a utility function to get component by path
    fileContent += `// Utility function to get image component by path\n`;
    fileContent += `export const getImageComponent = (path) => {\n`;
    fileContent += `  const normalizedPath = path.replace(/[^a-zA-Z0-9]/g, "_").replace(/^[0-9]/, "_$&");\n`;
    fileContent += `  return imageComponents[normalizedPath] || null;\n`;
    fileContent += `};\n`;

    fs.writeFileSync(CONFIG.outputFile, fileContent);
    console.log(`\n✅ Successfully generated index at: ${CONFIG.outputFile}`);
    console.log(`📊 Total images found: ${processedImages.size}`);
  } catch (error) {
    console.error("❌ Error generating image index:", error);
    process.exit(1);
  }
}

generateImageIndex();