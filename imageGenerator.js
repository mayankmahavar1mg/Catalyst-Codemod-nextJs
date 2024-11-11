// const fs = require("fs");
// const path = require("path");

// // Configuration
// const CONFIG = {
//   imageDir: "/Users/mayank.mahavar/1mg_web/mweb",
//   outputFile:
//     "/Users/mayank.mahavar/migrateNextToCatalyst/fullstack-nextjs-app-template/src/imageIndex.js",
//   validExtensions: [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
//   // Directories and files to ignore
//   ignore: [
//     "node_modules",
//     ".git",
//     "dist",
//     "build",
//     ".next",
//     ".DS_Store",
//     "thumbs.db",
//     "*.test.*",
//     "*.spec.*",
//   ],
// };

const fs = require("fs");
const path = require("path");

// Get command line arguments
const args = process.argv.slice(2);

// Help text
const helpText = `
Usage: node script.js <imageDir> <outputFile>

Arguments:
  imageDir     Directory containing images
  outputFile   Output file path for the index

Example: 
  node script.js ./images ./src/utils/imageIndex.js
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

    // Add imports
    imageFiles.forEach(({ relativePath, identifier }) => {
      const importPath = relativePath.split(path.sep).join("/");
      fileContent += `import ${identifier} from '${path.relative(
        outputDir,
        CONFIG.imageDir
      )}/${importPath}';\n`;
      processedImages.set(identifier, relativePath);
    });

    // Create the image paths utility
    fileContent += `\n// Utility function to get image path with optional CDN URL\n`;
    fileContent += `const getImagePath = (path, cdnUrl) => cdnUrl ? \`\${cdnUrl}/\${path}\` : path;\n\n`;

    // Export the image paths function
    fileContent += `export const imported_image_path = (cdnUrl) => ({\n`;
    processedImages.forEach((relativePath, identifier) => {
      fileContent += `  ${identifier}: getImagePath(${identifier}, cdnUrl),\n`;
    });
    fileContent += `});\n`;

    fs.writeFileSync(CONFIG.outputFile, fileContent);
    console.log(`\n✅ Successfully generated index at: ${CONFIG.outputFile}`);
    console.log(`📊 Total images found: ${processedImages.size}`);
  } catch (error) {
    console.error("❌ Error generating image index:", error);
    process.exit(1);
  }
}

generateImageIndex();
