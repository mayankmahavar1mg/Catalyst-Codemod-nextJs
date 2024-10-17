const fs = require("fs-extra");
const path = require("path");
const { runAllJscodeshiftScripts } = require("./jsCodeShiftRunner");

async function findAndCopyComponents(sourcePath, destBasePath, targetFolders) {
  const items = await fs.readdir(sourcePath, { withFileTypes: true });

  for (const item of items) {
    const fullSourcePath = path.join(sourcePath, item.name);

    if (item.isDirectory()) {
      if (targetFolders.includes(item.name.toLowerCase())) {
        const relativePath = path.relative(
          path.join(sourcePath, "src", ".."),
          fullSourcePath
        );
        const destPath = path.join(destBasePath, relativePath);

        await fs.copy(fullSourcePath, destPath, { recursive: true });
      } else {
        // Recurse into other directories
        await findAndCopyComponents(
          fullSourcePath,
          destBasePath,
          targetFolders
        );
      }
    }
  }
}

async function findPageFile(dirPath) {
  const files = await fs.readdir(dirPath);
  const pageFile = files.find(
    (file) => file === "page.js" || file === "page.tsx"
  );
  return pageFile ? path.join(dirPath, pageFile) : null;
}

async function extractFunctionName(filePath) {
  const content = await fs.readFile(filePath, "utf8");

  // Updated patterns to match different export syntaxes
  const patterns = [
    /export\s+default\s+(?:async\s+)?function\s+(\w+)(?:\s*\([^)]*\))?/,
    /export\s+default\s+(?:async\s+)?(\w+)\s*=/,
    /const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|function)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If no match found, use the file name as a fallback
  console.warn(
    `Could not extract function name from ${filePath}. Using file name as fallback.`
  );
  return path.basename(filePath, path.extname(filePath));
}

async function moveAppComponents(nextjsProjectPath, catalystProjectPath) {
  const appDir = path.join(nextjsProjectPath, "app");
  const containerDir = path.join(
    catalystProjectPath,
    "src",
    "js",
    "containers"
  );

  try {
    await processDirectory(appDir, containerDir);
    console.log("App components moved successfully!");
  } catch (err) {
    console.error("An error occurred while moving app components:", err);
  }
}

async function processDirectory(currentDir, containerDir) {
  const files = await fs.readdir(currentDir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(currentDir, file.name);
    if (file.isDirectory()) {
      await processDirectory(fullPath, containerDir);
    } else if (file.name === "page.js" || file.name === "page.tsx") {
      await processPageFile(currentDir, containerDir);
      break; // We've found the page file, so we can stop processing this directory
    }
  }
}

async function processPageFile(sourceDir, containerDir) {
  const pageFile = await findPageFile(sourceDir);
  if (!pageFile) {
    console.warn(`No page file found in ${sourceDir}`);
    return;
  }

  const functionName = await extractFunctionName(pageFile);
  const destFolder = path.join(containerDir, functionName);
  await fs.ensureDir(destFolder);

  // Copy only files, not folders
  const files = await fs.readdir(sourceDir);
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destFolder, file);

    if ((await fs.stat(sourcePath)).isFile()) {
      await fs.copy(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    }
  }

  // Rename the page file to match the function name
  const oldPagePath = path.join(destFolder, path.basename(pageFile));
  const newPagePath = path.join(destFolder, `${functionName}.js`);
  await fs.rename(oldPagePath, newPagePath);

  console.log(`Renamed ${oldPagePath} to ${newPagePath}`);
}

async function moveComponents(nextjsProjectPath, catalystProjectPath) {
  try {
    const targetFolders = [
      "components",
      "constants",
      "enums",
      "assets",
      "helpers",
    ];
    const destBasePath = path.join(catalystProjectPath, "src", "js");

    await findAndCopyComponents(nextjsProjectPath, destBasePath, targetFolders);
    await moveAppComponents(nextjsProjectPath, catalystProjectPath);
    const jscodeshiftScriptsPath = path.join(
      process.cwd(),
      "migrate",
      "codemodScript"
    );
    const jscodeshiftTargetPath = path.join(catalystProjectPath, "src", "js");
    await runAllJscodeshiftScripts(
      jscodeshiftScriptsPath,
      jscodeshiftTargetPath
    );

    console.log(
      "Components moved and all jscodeshift transformations completed successfully!"
    );
  } catch (err) {
    console.error("An error occurred while moving components:", err);
  }
}

module.exports = { moveComponents };
