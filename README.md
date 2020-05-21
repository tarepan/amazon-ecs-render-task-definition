## Amazon ECS "Render Env in Task Definition" Action for GitHub Actions

Inserts a environment variable into an Amazon ECS task definition JSON file, creating a new task definition file.

**Table of Contents**

<!-- toc -->

- [Amazon ECS "Render Env in Task Definition" Action for GitHub Actions](#amazon-ecs-%22render-env-in-task-definition%22-action-for-github-actions)
- [Usage](#usage)
- [License Summary](#license-summary)

<!-- tocstop -->

## Usage

To insert the value `production` as an environment variable `NODE_ENV` in the task definition file, and then deploy the edited task definition file to ECS:

```yaml
- name: Render env in Amazon ECS task definition
  id: render-env
  uses: tarepan/amazon-ecs-render-task-definition-env@v2
  with:
    task-definition: task-definition.json
    env-name: NODE_ENV
    env-value: production

- name: Deploy to Amazon ECS service
  uses: tarepan/amazon-ecs-render-task-definition-env@v2
  with:
    task-definition: ${{ steps.render-env.outputs.task-definition }}
    service: my-service
    cluster: my-cluster
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## License Summary

This code is made available under the MIT license.
