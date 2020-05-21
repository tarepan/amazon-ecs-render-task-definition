const run = require(".");
const core = require("@actions/core");
const tmp = require("tmp");
const fs = require("fs");

jest.mock("@actions/core");
jest.mock("tmp");
jest.mock("fs");

describe("Render task definition", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    core.getInput = jest
      .fn()
      .mockReturnValueOnce("task-definition.json") // task-definition
      .mockReturnValueOnce("envcon") // container-name
      .mockReturnValueOnce("NODE_ENV") // env name
      .mockReturnValueOnce("production"); // env value

    process.env = Object.assign(process.env, { GITHUB_WORKSPACE: __dirname });
    process.env = Object.assign(process.env, {
      RUNNER_TEMP: "/home/runner/work/_temp",
    });

    tmp.fileSync.mockReturnValue({
      name: "new-task-def-file-name",
    });

    fs.existsSync.mockReturnValue(true);
  });

  test("renders the task definition with `NODE_ENV` env override and creates a new task def file", async () => {
    // mock set up
    jest.mock(
      "./task-definition.json",
      () => ({
        family: "task-def-family",
        containerDefinitions: [
          {
            name: "envcon",
            image: "some-other-image",
            environment: [
              { name: "NODE_ENVV", value: "development" },
              { name: "NODE_ENV", value: "development" },
            ],
          },
          {
            name: "sidecar",
            image: "some-other-image",
            environment: [
              { name: "NODE_ENVV", value: "development" },
              { name: "NODE_ENV", value: "development" },
            ],
          },
        ],
      }),
      { virtual: true }
    );

    // test
    await run();
    expect(tmp.fileSync).toHaveBeenNthCalledWith(1, {
      tmpdir: "/home/runner/work/_temp",
      prefix: "task-definition-",
      postfix: ".json",
      keep: true,
      discardDescriptor: true,
    });
    expect(fs.writeFileSync).toHaveBeenNthCalledWith(
      1,
      "new-task-def-file-name",
      JSON.stringify(
        {
          family: "task-def-family",
          containerDefinitions: [
            {
              name: "envcon",
              image: "some-other-image",
              environment: [
                { name: "NODE_ENVV", value: "development" },
                { name: "NODE_ENV", value: "production" },
              ],
            },
            {
              name: "sidecar",
              image: "some-other-image",
              environment: [
                { name: "NODE_ENVV", value: "development" },
                { name: "NODE_ENV", value: "development" },
              ],
            },
          ],
        },
        null,
        2
      )
    );
    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      "task-definition",
      "new-task-def-file-name"
    );
  });
});
