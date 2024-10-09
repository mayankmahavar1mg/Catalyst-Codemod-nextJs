const fs = require("fs-extra");
const path = require("path");

async function findPageFile(dirPath) {
  const files = await fs.readdir(dirPath);
  const pageFile = files.find(
    (file) => file === "page.js" || file === "page.tsx"
  );
  return pageFile ? path.join(dirPath, pageFile) : null;
}

async function extractFunctionName(filePath) {
  const content = await fs.readFile(filePath, "utf8");

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

  console.warn(
    `Could not extract function name from ${filePath}. Using file name as fallback.`
  );
  return path.basename(filePath, path.extname(filePath));
}

async function generateRoutes(appDir) {
  const routes = [];

  async function processDirectory(currentDir, currentPath = "") {
    const files = await fs.readdir(currentDir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);
      let routePath = path.join(
        currentPath,
        file.name === "page.js" || file.name === "page.tsx" ? "" : file.name
      );

      // Convert dynamic segments from [param] to :param
      routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

      if (file.isDirectory()) {
        await processDirectory(fullPath, routePath);
      } else if (file.name === "page.js" || file.name === "page.tsx") {
        const functionName = await extractFunctionName(fullPath);
        routes.push({
          path: routePath === "" ? "/" : `/${routePath}`,
          component: functionName,
        });
      }
    }
  }

  await processDirectory(appDir);
  return routes;
}

async function updateRoutesFile(routesFilePath, newRoutes) {
  let content = await fs.readFile(routesFilePath, "utf8");

  // Function to check if an import already exists
  function importExists(componentName) {
    const importRegex = new RegExp(
      `import\\s+${componentName}\\s+from\\s+["']@containers/${componentName}/${componentName}["']`
    );
    return importRegex.test(content);
  }

  // Add imports only if they don't already exist
  const newImports = newRoutes
    .filter((route) => !importExists(route.component))
    .map(
      (route) =>
        `import ${route.component} from "@containers/${route.component}/${route.component}"`
    );

  if (newImports.length > 0) {
    content = newImports.join("\n") + "\n\n" + content;
  }

  // Update routes array
  const routesArray = newRoutes
    .map(
      (route) => `
    {
        path: "${route.path}",
        component: ${route.component},
    }`
    )
    .join(",");

  const updatedRoutesArray = `const routes = [${routesArray}\n]`;

  // Replace the existing routes array
  const routesRegex = /const routes = \[[\s\S]*?\]/;
  if (routesRegex.test(content)) {
    content = content.replace(routesRegex, updatedRoutesArray);
  } else {
    // If the routes array doesn't exist, append it to the end of the file
    content += "\n\n" + updatedRoutesArray;
  }

  await fs.writeFile(routesFilePath, content, "utf8");
}

async function convertRoutes(nextjsProjectPath, catalystProjectPath) {
  try {
    const appDir = path.join(nextjsProjectPath, "app");
    const routesFilePath = path.join(
      catalystProjectPath,
      "src",
      "js",
      "routes",
      "index.js"
    );

    const newRoutes = await generateRoutes(appDir);
    await updateRoutesFile(routesFilePath, newRoutes);

    console.log("Routes converted and updated successfully!");
  } catch (err) {
    console.error("An error occurred while converting routes:", err);
  }
}

module.exports = { convertRoutes };
