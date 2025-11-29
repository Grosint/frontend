# GitHub Actions Workflows

This directory contains CI/CD workflows for automated testing and deployment.

## Workflows

### 1. `ci-cd-production.yml`

**Triggers:** Push to `main` or `master` branch

**Stages:**

- Code quality checks (linting, formatting)
- Unit tests with coverage
- E2E tests
- Production build
- Deployment to Azure Static Web Apps (Production)

**Required Secrets:**

- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_STATIC_WEB_APPS_API_URL`

### 2. `ci-cd-staging.yml`

**Triggers:** Push to `develop` or `staging` branch

**Stages:**

- Code quality checks
- Unit tests
- Production build
- Deployment to Azure Static Web Apps (Staging)

**Required Secrets:**

- `AZURE_STATIC_WEB_APPS_STAGING_TOKEN`
- `AZURE_STATIC_WEB_APPS_STAGING_URL`

### 3. `pr-checks.yml`

**Triggers:** Pull requests to `main`, `master`, or `develop`

**Stages:**

- Code quality checks
- Unit tests
- Build verification
- PR summary comment

**Purpose:** Validates code quality before merge (no deployment)

### 4. `codeql-analysis.yml`

**Triggers:** Push, PR, weekly schedule, or manual

**Purpose:** Security vulnerability scanning using GitHub CodeQL

## Setup Instructions

1. **Add GitHub Secrets:**
   - Go to Repository Settings → Secrets and variables → Actions
   - Add required secrets (see workflow files for details)

2. **Verify Workflow Files:**
   - Ensure all workflow files are in `.github/workflows/`
   - Check that branch names match your repository

3. **Test the Pipeline:**
   - Make a small change and push to `main`
   - Check Actions tab to verify workflow runs

## Troubleshooting

- **Workflow not triggering:** Check branch names match your repository
- **Deployment fails:** Verify secrets are correctly set
- **Tests fail:** Run tests locally first: `npm run test:ci`
- **Build fails:** Check Node.js version matches (18.x)

For more details, see [DEPLOYMENT.md](../DEPLOYMENT.md)
