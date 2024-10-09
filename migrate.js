const { getUserInput } = require("./migrate/userInput");
const { checkProjects } = require("./migrate/projectChecker");

async function main() {
  const { nextjsProjectPath, catalystProjectPath } = await getUserInput();
  await checkProjects(nextjsProjectPath, catalystProjectPath);
}

main().catch(console.error);
