const fs = require("fs-extra");
const path = require("path");
const { moveComponents } = require("./projectMigrator");
const { convertRoutes } = require("./routeConverter");

async function checkProjects(nextjsProjectPath, catalystProjectPath) {
  if (!fs.existsSync(nextjsProjectPath)) {
    console.log(
      `Next.js project not found at '${nextjsProjectPath}'. Please make sure you've entered the correct path.`
    );
    process.exit(1);
  }

  if (!fs.existsSync(catalystProjectPath)) {
    console.log(`Catalyst project not found at '${catalystProjectPath}'.`);
    const answer = await question(
      "Do you want to create a new Catalyst project at this location? (y/n): "
    );
    if (answer.toLowerCase() === "y") {
      console.log(
        "To create a new Catalyst project, run the following command:"
      );
      console.log(
        `npx create-catalyst-app@latest ${path.basename(catalystProjectPath)}`
      );
      console.log(
        `Then move the created project to ${path.dirname(
          catalystProjectPath
        )} if it's not already there.`
      );
      console.log(
        "After setting up the Catalyst project, please run this script again."
      );
      process.exit(0);
    } else {
      console.log("Catalyst project creation skipped. Exiting script.");
      process.exit(0);
    }
  }

  console.log(`Next.js project found at '${nextjsProjectPath}'`);
  console.log(`Catalyst project found at '${catalystProjectPath}'`);
  console.log("Ready to proceed with migration.");
  await moveComponents(nextjsProjectPath, catalystProjectPath);
  await convertRoutes(nextjsProjectPath, catalystProjectPath);
}

module.exports = { checkProjects };
