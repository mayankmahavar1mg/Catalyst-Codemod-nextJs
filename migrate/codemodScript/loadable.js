module.exports = function (file, api, options) {
  let source = file.source;
  let hasChanges = false;

  // Function to perform string-based replacements
  function stringReplace(regex, replacement) {
    const newSource = source.replace(regex, replacement);
    if (newSource !== source) {
      hasChanges = true;
      source = newSource;
    }
  }

  // Replace import statement for dynamic
  stringReplace(
    /import\s+(\w+)\s+from\s+['"]next\/dynamic['"]/g,
    "import loadable from '@loadable/component'"
  );

  // Replace dynamic() calls with loadable(), handling the loading prop
  stringReplace(
    /(\w+)\s*\(\s*\(\s*\)\s*=>\s*import\s*\(([\s\S]*?)\)(?:\s*,\s*\{\s*loading:\s*([^}]+)\s*\})?\s*\)/g,
    (match, funcName, importPath, loadingComponent) => {
      // If funcName is 'dynamic', replace it with 'loadable'
      const newFuncName = funcName === "dynamic" ? "loadable" : funcName;

      if (loadingComponent) {
        // If there's a loading prop, convert it to fallback
        return `${newFuncName}(() => import(${importPath}), { fallback: ${loadingComponent} })`;
      } else {
        // If there's no loading prop, keep it simple
        return `${newFuncName}(() => import(${importPath}))`;
      }
    }
  );

  // Replace any remaining instances of 'dynamic(' with 'loadable('
  stringReplace(/\bdynamic\s*\(/g, "loadable(");

  // Return the modified source if changes were made, otherwise return null
  return hasChanges ? source : null;
};
