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

  // Remove Next Image import
  stringReplace(
    /import\s+(?:Image|{\s*Image\s*})\s+from\s+['"]next\/image['"]\s*;?/g,
    ""
  );

  // Convert Next.js Image component to img tag
  stringReplace(
    /<Image\s+([^>]*)src=(['"]\S+['"])([^>]*)>/g,
    (match, beforeSrc, src, afterSrc) => {
      // Extract width and height if present
      const widthMatch = (beforeSrc + afterSrc).match(/width=["']?(\d+)["']?/);
      const heightMatch = (beforeSrc + afterSrc).match(
        /height=["']?(\d+)["']?/
      );

      let attributes = `src=${src}`;
      if (widthMatch) attributes += ` width="${widthMatch[1]}"`;
      if (heightMatch) attributes += ` height="${heightMatch[1]}"`;

      // Extract alt if present
      const altMatch = (beforeSrc + afterSrc).match(/alt=(['"]\S+['"])/);
      if (altMatch) attributes += ` alt=${altMatch[1]}`;

      return `<img ${attributes} />`;
    }
  );

  // Return the modified source if changes were made, otherwise return null
  return hasChanges ? source : null;
};
