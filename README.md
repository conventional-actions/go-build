# go-build

A GitHub Action for building Go binaries.

## Usage

To use the GitHub Action, add the following to your job:

```yaml
- uses: conventional-actions/go-build@v1
```

### Inputs

| Name          | Default | Description                             |
|---------------|---------|-----------------------------------------|
| `output_path` | `main`  | the output path to write the SARIF file |
| `package`     | `./...` | the package to scan                     |

### Outputs

| Name          | Type     | Description      |
|---------------|----------|------------------|
| `output_path` | `string` | output file path |

### Example

```yaml
on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: conventional-actions/go-build@v1
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

