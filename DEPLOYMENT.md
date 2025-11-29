# Azure Static Web Apps Deployment Guide

This guide provides comprehensive instructions for deploying the GrosInt Angular frontend application to Azure Static Web Apps with automated CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure Static Web Apps Setup](#azure-static-web-apps-setup)
3. [GitHub Configuration](#github-configuration)
4. [Custom Domain Configuration](#custom-domain-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## Prerequisites

- Azure account with active subscription
- GitHub repository with the frontend code
- Azure CLI installed (optional, for command-line setup)
- Domain name (optional, for custom domain)

## Azure Static Web Apps Setup

### Step 1: Create Static Web App Resource

1. **Via Azure Portal:**
   - Navigate to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource"
   - Search for "Static Web App"
   - Click "Create"

2. **Fill in the details:**
   - **Subscription:** Select your Azure subscription
   - **Resource Group:** Create new or select existing
   - **Name:** `grosint-frontend` (or your preferred name)
   - **Plan type:** Free (or Standard for production)
   - **Region:** Select closest region to your users
   - **Source:** GitHub
   - **GitHub account:** Sign in and authorize
   - **Organization:** Select your GitHub organization
   - **Repository:** Select `grosint/frontend` (or your repo)
   - **Branch:** `main` or `master`
   - **Build Presets:** Custom
   - **App location:** `/` (root)
   - **Api location:** Leave empty (if no API)
   - **Output location:** `dist/grosint-frontend`

3. **Review and Create:**
   - Review all settings
   - Click "Create"
   - Wait for deployment (2-3 minutes)

### Step 2: Get Deployment Token

1. Navigate to your Static Web App in Azure Portal
2. Go to **Settings** → **Deployment tokens**
3. Copy the **Deployment token** (you'll need this for GitHub Secrets)

### Step 3: Configure Build Settings

1. In Azure Portal, go to **Configuration** → **Application settings**
2. Add any environment variables needed (see [Environment Variables](#environment-variables))

## GitHub Configuration

### Step 1: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:
   - **Name:** `AZURE_STATIC_WEB_APPS_API_TOKEN`
     - **Value:** Paste the deployment token from Azure Portal

   - **Name:** `AZURE_STATIC_WEB_APPS_API_URL`
     - **Value:** Your Static Web App deployment URL (found in Azure Portal → Overview)

   - **Name:** `AZURE_STATIC_WEB_APPS_STAGING_TOKEN` (optional, for staging)
     - **Value:** Staging environment deployment token

   - **Name:** `AZURE_STATIC_WEB_APPS_STAGING_URL` (optional, for staging)
     - **Value:** Staging environment deployment URL

### Step 2: Verify Workflow Files

Ensure the following workflow files exist in `.github/workflows/`:

- `ci-cd-production.yml` - Production deployment
- `ci-cd-staging.yml` - Staging deployment (optional)
- `pr-checks.yml` - Pull request validation

### Step 3: Test the Pipeline

1. Make a small change to your code
2. Commit and push to `main` branch
3. Go to **Actions** tab in GitHub
4. Watch the workflow execute
5. Verify deployment succeeds

## Custom Domain Configuration

Azure Static Web Apps fully supports custom domains with automatic SSL certificates.

### Step 1: Add Custom Domain in Azure Portal

1. Navigate to your Static Web App in Azure Portal
2. Go to **Custom domains** section
3. Click **Add** button
4. Enter your domain name (e.g., `example.com` or `www.example.com`)
5. Click **Next**

### Step 2: Verify Domain Ownership

Choose one of the verification methods:

**Option A: DNS TXT Record (Recommended)**

1. Azure will provide a TXT record value
2. Add this TXT record to your domain's DNS settings
3. Wait for DNS propagation (5-10 minutes)
4. Click **Verify** in Azure Portal

**Option B: HTML File**

1. Download the verification HTML file
2. Upload it to your domain's root directory
3. Click **Verify** in Azure Portal

### Step 3: Configure DNS

**For Subdomain (www.example.com):**

- Add a **CNAME** record:
  - **Name:** `www`
  - **Value:** Your Static Web App URL (e.g., `grosint-frontend.azurestaticapps.net`)

**For Apex Domain (example.com):**

- Azure will provide IP addresses
- Add **A** records pointing to those IPs
- Or use **ALIAS** record if your DNS provider supports it

### Step 4: SSL Certificate

1. After domain verification, Azure automatically provisions an SSL certificate
2. Certificate is from Let's Encrypt (free)
3. Certificate auto-renews
4. Wait 5-10 minutes for SSL provisioning
5. Domain status will change to "Ready"

### Step 5: Verify Custom Domain

1. Check domain status in Azure Portal (should show "Ready")
2. Visit your custom domain in browser
3. Verify HTTPS is working (green lock icon)
4. Test all routes to ensure SPA routing works

## Environment Variables

### Azure Portal Configuration

1. Navigate to **Configuration** → **Application settings**
2. Add environment variables:

   | Name             | Value                            | Description               |
   | ---------------- | -------------------------------- | ------------------------- |
   | `API_URL`        | `https://api.yourdomain.com/api` | Backend API URL           |
   | `ENVIRONMENT`    | `production`                     | Environment identifier    |
   | `SENTRY_DSN`     | Your Sentry DSN                  | Error tracking (optional) |
   | `GA_TRACKING_ID` | Your GA ID                       | Analytics (optional)      |

### Build-Time Environment Variables

Update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: process.env['API_URL'] || 'https://api.yourdomain.com/api',
  // ... other config
};
```

## Deployment Process

### Automatic Deployment

The CI/CD pipeline automatically deploys when:

1. **Production:** Push to `main` or `master` branch
2. **Staging:** Push to `develop` or `staging` branch
3. **Manual:** Trigger workflow manually from GitHub Actions

### Deployment Pipeline Stages

1. **Code Checkout** - Checks out repository code
2. **Setup Node.js** - Installs Node.js 18+ with caching
3. **Install Dependencies** - Runs `npm ci`
4. **Linting** - Runs ESLint (`npm run lint`)
5. **Format Check** - Verifies Prettier formatting
6. **Unit Tests** - Runs Karma tests with coverage
7. **E2E Tests** - Runs end-to-end tests
8. **Build** - Creates production build
9. **Deploy** - Deploys to Azure Static Web Apps

### Monitoring Deployment

1. **GitHub Actions:**
   - Go to **Actions** tab in GitHub
   - Click on the workflow run
   - Monitor each step's progress

2. **Azure Portal:**
   - Navigate to your Static Web App
   - Go to **Deployment history**
   - View deployment status and logs

## Troubleshooting

### Build Failures

**Issue:** Build fails in GitHub Actions

- **Solution:** Check build logs in Actions tab
- Verify Node.js version matches local (18.x)
- Ensure all dependencies are in `package.json`
- Check for TypeScript compilation errors

**Issue:** Bundle size exceeds limits

- **Solution:** Review bundle analysis output
- Remove unused dependencies
- Enable tree-shaking
- Consider code splitting

### Deployment Failures

**Issue:** Deployment token invalid

- **Solution:** Regenerate token in Azure Portal
- Update GitHub secret with new token

**Issue:** 404 errors on routes

- **Solution:** Verify `azure-staticwebapp.config.json` has correct routing
- Ensure `navigationFallback` is configured
- Check that `index.html` is in output directory

### Custom Domain Issues

**Issue:** Domain verification fails

- **Solution:** Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check domain registrar settings

**Issue:** SSL certificate not provisioning

- **Solution:** Wait 10-15 minutes after verification
- Check domain status in Azure Portal
- Contact Azure support if issue persists

### Test Failures

**Issue:** Unit tests fail in CI

- **Solution:** Run tests locally: `npm run test:ci`
- Check for environment-specific issues
- Verify test coverage thresholds

**Issue:** E2E tests timeout

- **Solution:** Increase timeout in test configuration
- Check for flaky tests
- Consider running E2E tests separately

## Rollback Procedures

### Quick Rollback via Azure Portal

1. Navigate to your Static Web App
2. Go to **Deployment history**
3. Find the previous successful deployment
4. Click **Redeploy** on that deployment
5. Confirm redeployment

### Rollback via GitHub

1. Revert the problematic commit:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
2. This triggers a new deployment with the previous code

### Manual Rollback

1. Checkout previous working commit
2. Build locally: `npm run build:prod`
3. Use Azure CLI to deploy:
   ```bash
   az staticwebapp deploy \
     --name grosint-frontend \
     --resource-group your-resource-group \
     --source dist/grosint-frontend
   ```

## Best Practices

1. **Always test locally before pushing:**

   ```bash
   npm run lint
   npm run format:check
   npm run test:ci
   npm run build:prod
   ```

2. **Use feature branches:**
   - Create PRs for code review
   - PR checks will validate code quality
   - Merge only after all checks pass

3. **Monitor deployments:**
   - Check GitHub Actions after each push
   - Monitor Azure Portal for deployment status
   - Set up alerts for failed deployments

4. **Keep dependencies updated:**
   - Regularly update npm packages
   - Use Dependabot for automated updates
   - Test updates in staging first

5. **Environment separation:**
   - Use staging environment for testing
   - Only deploy to production after staging validation
   - Keep environment variables separate

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Angular Deployment Guide](https://angular.io/guide/deployment)

## Support

For issues or questions:

1. Check this guide's troubleshooting section
2. Review Azure Static Web Apps logs
3. Check GitHub Actions workflow logs
4. Contact Azure support if needed
