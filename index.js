const path = require("path");
const core = require("@actions/core");
const tmp = require("tmp");
const fs = require("fs");

async function run() {
  try {
    // Get inputs
    const taskDefinitionFile = core.getInput("task-definition", {
      required: true,
    });
    const envName = core.getInput("env-name", { required: true });
    const envValue = core.getInput("env-value", { required: true });

    // Parse the task definition
    const taskDefPath = path.isAbsolute(taskDefinitionFile)
      ? taskDefinitionFile
      : path.join(process.env.GITHUB_WORKSPACE, taskDefinitionFile);
    if (!fs.existsSync(taskDefPath)) {
      throw new Error(
        `Task definition file does not exist: ${taskDefinitionFile}`
      );
    }
    //// node.js `require` read file as json
    const taskDefContents = require(taskDefPath);

    // Insert env
    if (
      taskDefContents.environment &&
      !Array.isArray(taskDefContents.environment)
    ) {
      throw new Error(
        "Invalid task definition format: environment section is present but is not an array"
      );
    }
    if (taskDefContents.environment) {
      const envIndex = taskDefContents.environment.findIndex(
        (pair) => pair.name === envName
      );
      // override
      if (envIndex !== -1) {
        taskDefContents.environment[envIndex].value = envValue;
      }
      // insertion
      else {
        taskDefContents.environment.push([{ name: envName, value: envValue }]);
      }
    } else {
      taskDefContents.environment = [{ name: envName, value: envValue }];
    }

    // Write out a new task definition file
    var updatedTaskDefFile = tmp.fileSync({
      tmpdir: process.env.RUNNER_TEMP,
      prefix: "task-definition-",
      postfix: ".json",
      keep: true,
      discardDescriptor: true,
    });
    const newTaskDefContents = JSON.stringify(taskDefContents, null, 2);
    fs.writeFileSync(updatedTaskDefFile.name, newTaskDefContents);
    core.setOutput("task-definition", updatedTaskDefFile.name);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
  run();
}
