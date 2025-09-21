# Development Workflow & CI Requirements

## Pre-Commit Validation Requirements

**CRITICAL**: Before committing any changes, you MUST run all CI commands locally to ensure they pass. This prevents CI failures and reduces development friction.

### Required Pre-Commit Commands

Run these commands in order and ensure ALL pass before committing:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Type checking - MUST pass with no errors
npm run typecheck

# 3. Linting - MUST pass (warnings acceptable for 'any' types in utility code)
npm run lint

# 4. Unit tests - MUST pass all tests
npm run test:unit

# 5. Build - MUST complete successfully
npm run build

# 6. Format check - MUST pass (run prettier --write . if needed)
npm run format:check
```

### Quick Validation Script

You can run all validations at once:

```bash
npm run typecheck && npm run lint && npm run test:unit && npm run build && npm run format:check
```

### If Formatting Fails

If `npm run format:check` fails, fix it by running:

```bash
npx prettier --write .
```

Then run `npm run format:check` again to verify.

## Integration Tests

Integration tests require real API calls and should be run separately:

```bash
# Only run when testing real API integration
npm run test:integration
```

⚠️ **Note**: Integration tests require:
- `USE_REAL_APIS=true` environment variable
- Valid API keys (GitHub token or OpenAI key)
- Are typically run only with approval in CI/CD

## CI/CD Pipeline

Our GitHub Actions workflow runs:

1. **Type Check**: Validates TypeScript compilation
2. **Lint**: Code quality and style enforcement  
3. **Unit Tests**: Fast mocked tests
4. **Build**: Compilation and artifact generation
5. **Format Check**: Prettier code formatting
6. **Integration Tests**: (conditional) Real API testing

## Development Best Practices

### Before Each Commit:
1. ✅ Run all pre-commit validation commands
2. ✅ Ensure no TypeScript errors
3. ✅ Address any linting errors (warnings for `any` types acceptable in utility code)
4. ✅ Verify all unit tests pass
5. ✅ Confirm build completes successfully
6. ✅ Check code formatting is consistent

### Acceptable Warnings:
- `@typescript-eslint/no-explicit-any` warnings in:
  - Test utilities and mocks
  - External library type definitions
  - Complex type intersections where `any` is necessary

### Required Fixes:
- All TypeScript compilation errors
- ESLint errors (not warnings)
- Failed unit tests
- Build failures
- Prettier formatting issues

## Troubleshooting

### Common Issues:

**TypeScript Errors**: 
- Check for missing dependencies: `npm install`
- Verify imports are correct
- Ensure types are properly defined

**Linting Errors**:
- Run `npx eslint . --ext .ts,.js --fix` for auto-fixes
- Address unused variables (prefix with `_` if intentionally unused)

**Test Failures**:
- Check mock configurations
- Verify test environment setup
- Ensure test isolation

**Build Failures**:
- Clean `dist/` directory: `rm -rf dist/`
- Check TypeScript configuration
- Verify entry points in `package.json`

**Format Issues**:
- Run `npx prettier --write .`
- Check `.prettierrc.json` configuration

## Environment Setup

Ensure you have:
- Node.js 18 or higher
- npm dependencies installed
- Proper environment variables (see `.env.example`)

This workflow ensures consistent code quality and prevents CI failures.