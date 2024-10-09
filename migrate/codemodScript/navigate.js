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

  // Replace import statements
  stringReplace(
    /import\s+.*\s+from\s+['"]next\/router['"]/g,
    "import { useNavigate } from '@tata1mg/router'"
  );
  stringReplace(
    /import\s+.*\s+from\s+['"]next\/navigation['"]/g,
    "import { useNavigate } from '@tata1mg/router'"
  );
  stringReplace(
    /import\s+.*\s+from\s+['"]next\/link['"]/g,
    "import { Link } from '@tata1mg/catalyst'"
  );

  // Replace useRouter() calls with useNavigate()
  stringReplace(
    /const\s+(\w+)\s*=\s*useRouter\(\)/g,
    "const navigate = useNavigate()"
  );

  // Replace router.push() calls with navigate()
  stringReplace(/(\w+)\.push\(/g, "navigate(");

  // Replace href prop with to prop in Link component
  stringReplace(/<Link\s+href=/g, "<Link to=");

  // Return the modified source if changes were made, otherwise return null
  return hasChanges ? source : null;
};
