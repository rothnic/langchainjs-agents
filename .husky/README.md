# Pre-commit Hooks

This directory contains Git pre-commit hooks managed by Husky.

## Setup

Pre-commit hooks are automatically installed when running `npm install` due to the `prepare` script in package.json.

## What the hooks do

- **pre-commit**: Runs `lint-staged` which automatically:
  - Lints and fixes TypeScript/JavaScript files with ESLint
  - Formats all files with Prettier
  - Only processes staged files for efficiency

This ensures that all committed code follows consistent formatting and quality standards, preventing CI failures due to linting or formatting issues.
