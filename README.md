# go-build

A GitHub Action for building Go binaries.

## Usage

To use the GitHub Action, add the following to your job:

```yaml
- uses: conventional-actions/go-build@v1
```

### Inputs

| Name               | Default         | Description                                                   |
|--------------------|-----------------|---------------------------------------------------------------|
| `package`          | `./cmd/*`       | the package to build                                          |
| `platforms`        | native platform | comma-separated list of platforms to build                    |
| `tags`             | N/A             | comma-separated list of build tags to pass to go compiler     |
| `buildvcs`         | `auto`          | whether to stamp binaries with version control information    |
| `buildmode`        | `default`       | which kind of object file is to be built                      |
| `trimpath`         | `true`          | remove all file system paths from the resulting executable    |
| `version-package`  | `main`          | go package to write version to                                |
| `version-variable` | `Version`       | the variable name to write the version to                     |
| `version`          | N/A             | version to write to the specified package/variable (optional) |

### Outputs

| Name        | Description                              |
|-------------|------------------------------------------|
| `outputs`   | comma-separated list of output binaries  |
| `artifacts` | comma-separated list of output artifacts |

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
        with:
          platforms: |
            linux/amd64
            linux/arm64
            darwin/amd64
            darwin/arm64
          tags: production
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
