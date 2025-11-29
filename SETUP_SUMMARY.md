# Pre-commit Hooks & Logging Setup Summary

## ✅ What Was Set Up

### 1. Pre-commit Hooks (Husky + lint-staged)

**Installed Packages:**

- `husky` - Git hooks manager
- `lint-staged` - Run linters on staged files
- `prettier` - Code formatter
- `eslint-config-prettier` - Disable ESLint rules that conflict with Prettier
- `eslint-plugin-prettier` - Run Prettier as an ESLint rule

**Configuration Files Created:**

- `.husky/pre-commit` - Runs lint-staged before each commit
- `.lintstagedrc.json` - Configures which files to lint/format
- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `.eslintrc.json` - ESLint configuration with Prettier integration

**NPM Scripts Added:**

- `npm run format` - Format all source files
- `npm run format:check` - Check if files are formatted
- `npm run lint:fix` - Fix ESLint errors automatically

### 2. Enhanced Logging Service

**Features Added:**

- ✅ Structured logging with context and metadata
- ✅ Multiple logging backends (Sentry, custom API, LogRocket)
- ✅ Batch processing for performance
- ✅ Log buffering for debugging
- ✅ Session tracking
- ✅ User context management
- ✅ Environment-based configuration

**Environment Configuration:**

- `logLevel` - Minimum log level to display
- `remoteLogLevel` - Minimum log level to send remotely
- `loggingEndpoint` - Custom API endpoint for logs
- `enableRemoteLogging` - Toggle remote logging

## 🚀 How to Use

### Pre-commit Hooks

The hooks run automatically when you commit. They will:

1. Format staged files with Prettier
2. Run ESLint and auto-fix issues
3. Prevent commit if there are unfixable errors

**Manual Commands:**

```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Fix linting issues
npm run lint:fix
```

### Logging

**Basic Usage:**

```typescript
import { LoggerService } from '@core/services/logger.service';

constructor(private logger: LoggerService) {}

// Set user context (after login)
this.logger.setContext({ userId: '123', email: 'user@example.com' });

// Log messages
this.logger.debug('Debug message', { metadata: 'value' });
this.logger.info('Info message', { metadata: 'value' });
this.logger.warn('Warning message', { metadata: 'value' });
this.logger.error('Error message', error, { metadata: 'value' });
```

## 📋 Next Steps

### 1. Format Existing Code

Run this to format all existing files:

```bash
npm run format
```

### 2. Set Up Remote Logging

**Option A: Custom API Endpoint (Recommended for Grafana/Prometheus)**

1. Create backend endpoint: `POST /api/logs`
2. Update `environment.prod.ts`:
   ```typescript
   loggingEndpoint: 'https://api.yourdomain.com/api/logs';
   ```
3. Backend forwards logs to Prometheus
4. Create Grafana dashboards

**Option B: Sentry (Recommended for Error Tracking)**

```bash
npm install @sentry/angular @sentry/tracing
```

Then configure in `main.ts` (see LOGGING_GUIDE.md)

### 3. Test Pre-commit Hook

```bash
# Make a small change
echo "// test" >> src/app/app.component.ts

# Stage the file
git add src/app/app.component.ts

# Try to commit (hook will run)
git commit -m "test commit"
```

## 📚 Documentation

- **LOGGING_GUIDE.md** - Comprehensive guide on frontend log management
- **.prettierrc** - Prettier configuration
- **.eslintrc.json** - ESLint configuration
- **.lintstagedrc.json** - lint-staged configuration

## 🔧 Configuration

### Prettier Settings

- Single quotes
- 2 spaces indentation
- 100 character line width
- Semicolons enabled
- Trailing commas (ES5)

### ESLint Rules

- Angular-specific rules
- TypeScript best practices
- Prettier integration
- Unused variables warning (not error)

### Logging Levels

- **Development**: DEBUG (all logs)
- **Production**: WARN (warnings and errors only)

## ⚠️ Important Notes

1. **First Commit**: After setup, you may need to format existing files:

   ```bash
   npm run format
   git add .
   git commit -m "Format codebase"
   ```

2. **Husky Setup**: The `prepare` script in package.json ensures Husky is set up when someone runs `npm install`

3. **Logging Endpoint**: Make sure your backend endpoint can handle batched logs and has proper authentication

4. **Sentry**: If using Sentry, install the package and configure it in `main.ts` (see LOGGING_GUIDE.md)

## 🐛 Troubleshooting

**Pre-commit hook not running?**

```bash
# Reinstall husky
rm -rf .husky
npm run prepare
```

**Formatting issues?**

```bash
# Format all files
npm run format

# Then commit
git add .
git commit -m "Format code"
```

**ESLint errors?**

```bash
# Auto-fix what can be fixed
npm run lint:fix

# Check remaining issues
npm run lint
```

## 📊 Logging Architecture

```
Frontend LoggerService
    ├── Console (Development)
    ├── Sentry (Errors + Performance)
    ├── Custom API → Backend → Prometheus → Grafana
    └── LogRocket (Session Replay)
```

See **LOGGING_GUIDE.md** for detailed architecture and setup instructions.
