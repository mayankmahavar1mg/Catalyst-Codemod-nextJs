const readline = require("readline");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function getUserInput() {
  const nextjsPath = await question(
    "Enter the full path of your Next.js project: "
  );
  const catalystPath = await question(
    "Enter the full path for your Catalyst project: "
  );

  return {
    nextjsProjectPath: path.resolve(nextjsPath),
    catalystProjectPath: path.resolve(catalystPath),
  };
}

module.exports = { getUserInput };
