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
    const containerName = core.getInput("container-name", { required: true });
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

    // Insert the image URI
    if (!Array.isArray(taskDefContents.containerDefinitions)) {
      throw new Error(
        "Invalid task definition format: containerDefinitions section is not present or is not an array"
      );
    }
    taskDefContents.containerDefinitions = taskDefContents.containerDefinitions.map(
      (containerDef) => {
        if (containerDef.name !== containerName) {
          return containerDef;
        } else {
          // Insert env
          if (
            containerDef.environment &&
            !Array.isArray(containerDef.environment)
          ) {
            throw new Error(
              "Invalid task definition format: environment section is present but is not an array"
            );
          }
          if (containerDef.environment) {
            const envIndex = containerDef.environment.findIndex(
              (pair) => pair.name === envName
            );
            // override
            if (envIndex !== -1) {
              containerDef.environment[envIndex].value = envValue;
            }
            // insertion
            else {
              containerDef.environment.push([
                { name: envName, value: envValue },
              ]);
            }
          } else {
            containerDef.environment = [{ name: envName, value: envValue }];
          }
          return containerDef;
        }
      }
    );

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
