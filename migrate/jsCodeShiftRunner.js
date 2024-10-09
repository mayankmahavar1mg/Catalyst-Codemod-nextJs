const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

async function runJscodeshift(scriptPath, targetPath) {
  return new Promise((resolve, reject) => {
    const command = `jscodeshift -t ${scriptPath} ${targetPath}`;
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`jscodeshift execution error: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`jscodeshift stderr: ${stderr}`);
      }
      console.log(`jscodeshift stdout: ${stdout}`);
      resolve();
    });
  });
}

async function findJscodeshiftScripts(scriptsFolderPath) {
  try {
    const files = await fs.readdir(scriptsFolderPath);
    return files.filter((file) => file.endsWith(".js"));
  } catch (error) {
    console.error(`Error reading jscodeshift scripts directory: ${error}`);
    return [];
  }
}

async function runAllJscodeshiftScripts(scriptsFolderPath, targetPath) {
  const scripts = await findJscodeshiftScripts(scriptsFolderPath);
  for (const script of scripts) {
    const scriptPath = path.join(scriptsFolderPath, script);
    console.log(`Running jscodeshift script: ${script}`);
    await runJscodeshift(scriptPath, targetPath);
  }
}

module.exports = { runAllJscodeshiftScripts };
