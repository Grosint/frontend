# Quick Start Deployment Guide

This is a condensed guide for quickly setting up Azure Static Web Apps deployment. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites Checklist

- [ ] Azure account with active subscription
- [ ] GitHub repository with frontend code
- [ ] Backend API deployed to Azure (optional)

## 5-Minute Setup

### Step 1: Create Azure Static Web App (2 minutes)

1. Go to [Azure Portal](https://portal.azure.com)
2. Create new resource → Search "Static Web App" → Create
3. Fill in:
   - **Name:** `grosint-frontend`
   - **Plan:** Free
   - **Source:** GitHub
   - **Repository:** Your repo
   - **Branch:** `main`
   - **Build Presets:** Custom
   - **App location:** `/`
   - **Output location:** `dist/grosint-frontend`
4. Click **Create**

### Step 2: Configure GitHub Secrets (1 minute)

1. In Azure Portal → Your Static Web App → **Deployment tokens** → Copy token
2. In GitHub → **Settings** → **Secrets and variables** → **Actions**
3. Add secret:
   - **Name:** `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value:** Paste token from step 1

### Step 3: Update Environment Variables (1 minute)

1. Edit `src/environments/environment.prod.ts`
2. Update `apiUrl` with your backend API URL:
   ```typescript
   apiUrl: 'https://your-backend-app.azurewebsites.net/api';
   ```

### Step 4: Push to Main Branch (1 minute)

```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

### Step 5: Verify Deployment

1. Go to GitHub → **Actions** tab
2. Watch the workflow run
3. Once complete, visit your Static Web App URL from Azure Portal

## Custom Domain Setup (Optional)

1. Azure Portal → Static Web App → **Custom domains** → **Add**
2. Enter your domain (e.g., `example.com`)
3. Verify domain (DNS TXT record or HTML file)
4. Configure DNS:
   - **Subdomain:** CNAME to your Static Web App URL
   - **Apex:** A record to Azure-provided IPs
5. Wait 5-10 minutes for SSL certificate

## Troubleshooting

**Workflow fails?**

- Check GitHub Actions logs
- Verify secrets are set correctly
- Ensure Node.js version is 18.x

**404 errors?**

- Verify `azure-staticwebapp.config.json` exists
- Check output location is `dist/grosint-frontend`

**Custom domain not working?**

- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- Set up staging environment (push to `develop` branch)
- Configure monitoring and alerts
- Set up custom domain

## Support

- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
