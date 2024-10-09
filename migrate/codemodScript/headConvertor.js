module.exports = function (file, api, options) {
  let source = file.source;
  let hasChanges = false;
  let needsCatalystImport = false;

  // Function to perform string-based replacements
  function stringReplace(regex, replacement) {
    const newSource = source.replace(regex, replacement);
    if (newSource !== source) {
      hasChanges = true;
      source = newSource;
    }
  }

  // Replace Next.js Head import with Catalyst import
  stringReplace(
    /import\s+(?:Head|{\s*Head\s*})\s+from\s+['"]next\/head['"]\s*;?/g,
    (match) => {
      needsCatalystImport = true;
      return 'import { Head } from "catalyst";';
    }
  );

  // Replace Next.js Head component usage (no changes to the content)
  stringReplace(/<Head>([\s\S]*?)<\/Head>/g, (match, content) => {
    needsCatalystImport = true;
    return `<Head>${content}</Head>`;
  });

  // Add Catalyst import at the top of the file if needed and not already present
  if (
    needsCatalystImport &&
    !source.includes('import { Head } from "catalyst"')
  ) {
    source = 'import { Head } from "catalyst";\n' + source;
    hasChanges = true;
  }

  // Return the modified source if changes were made, otherwise return null
  return hasChanges ? source : null;
};
