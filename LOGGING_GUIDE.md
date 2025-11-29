# Frontend Logging Guide

## Overview

This guide explains how to manage logs in the frontend application, similar to how you manage logs in your backend with Grafana/Prometheus.

## Architecture

### Current Setup

The application uses a centralized `LoggerService` that provides:

- **Structured logging** with context and metadata
- **Multiple logging backends** (Sentry, custom API, LogRocket)
- **Batch processing** for performance
- **Log buffering** for debugging
- **Environment-based configuration**

## Logging Levels

```typescript
enum LogLevel {
  DEBUG = 0, // Detailed information for debugging
  INFO = 1, // General informational messages
  WARN = 2, // Warning messages
  ERROR = 3, // Error messages
}
```

## Usage

### Basic Logging

```typescript
import { LoggerService } from '@core/services/logger.service';

constructor(private logger: LoggerService) {}

// Debug logs (development only)
this.logger.debug('User clicked button', { buttonId: 'submit' });

// Info logs
this.logger.info('User logged in', { userId: '123' });

// Warning logs
this.logger.warn('API response slow', { responseTime: 2000 });

// Error logs
this.logger.error('Failed to load data', error, { endpoint: '/api/data' });
```

### Setting Context

```typescript
// Set user context (call after login)
this.logger.setContext({
  userId: 'user123',
  email: 'user@example.com',
  role: 'admin',
});

// Clear context (call after logout)
this.logger.clearContext();
```

## Industry-Standard Frontend Log Management

### Recommended Stack

For frontend applications, the industry-standard approach is:

#### 1. **Client-Side Logging Service** (What we have)

- Structured logging with context
- Log buffering and batching
- Multiple backend support

#### 2. **Error Tracking Service** (Recommended: Sentry)

- Real-time error tracking
- Source maps for stack traces
- User context and breadcrumbs
- Performance monitoring

**Setup:**

```bash
npm install @sentry/angular
```

**Configuration:**

```typescript
// main.ts
import * as Sentry from '@sentry/angular';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  tracesSampleRate: 1.0, // Adjust based on traffic
  integrations: [new Sentry.BrowserTracing()],
});
```

#### 3. **Log Aggregation Service** (Recommended Options)

**Option A: Custom API Endpoint → Backend → Grafana/Prometheus**

- Send logs to your backend API
- Backend forwards to Prometheus/Grafana
- Unified logging with backend

**Backend Endpoint Example:**

```typescript
// POST /api/logs
{
  logs: LogEntry[],
  appVersion: string,
  environment: string
}
```

**Option B: Third-Party Services**

- **LogRocket**: Session replay + logging
- **Datadog**: Full observability platform
- **New Relic**: APM + logging
- **Loggly**: Log aggregation
- **Elastic Stack (ELK)**: Self-hosted solution

#### 4. **Analytics Integration** (Optional)

- Google Analytics for user behavior
- Mixpanel/Amplitude for product analytics
- Custom analytics endpoints

### Recommended Architecture

```
┌─────────────────┐
│  Frontend App   │
│  LoggerService  │
└────────┬────────┘
         │
         ├───► Sentry (Errors + Performance)
         │
         ├───► Custom API Endpoint
         │     │
         │     └───► Backend Service
         │           │
         │           └───► Prometheus
         │                 │
         │                 └───► Grafana (Dashboards)
         │
         └───► LogRocket (Session Replay)
```

## Implementation Recommendations

### 1. Custom API Endpoint → Prometheus/Grafana

**Frontend:**

```typescript
// Already configured in logger.service.ts
loggingEndpoint: 'https://api.yourdomain.com/api/logs';
```

**Backend Endpoint:**

```typescript
// Express/Node.js example
app.post('/api/logs', async (req, res) => {
  const { logs, appVersion, environment } = req.body;

  // Forward to Prometheus
  logs.forEach(log => {
    prometheusClient.recordLog({
      level: log.level,
      message: log.message,
      context: log.context,
      timestamp: log.timestamp,
      labels: {
        app: 'frontend',
        version: appVersion,
        environment,
        userId: log.context?.userId || 'anonymous',
      },
    });
  });

  res.status(200).send({ success: true });
});
```

**Prometheus Metrics:**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'frontend-logs'
    static_configs:
      - targets: ['localhost:9090']
```

**Grafana Dashboard:**

- Create dashboards for:
  - Error rates by level
  - Log volume over time
  - User-specific errors
  - Performance metrics
  - Geographic distribution

### 2. Sentry Integration

**Install:**

```bash
npm install @sentry/angular @sentry/tracing
```

**Configure:**

```typescript
// main.ts
import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: environment.sentryDsn,
  integrations: [
    new BrowserTracing({
      tracingOrigins: ['localhost', 'https://api.yourdomain.com'],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],
  tracesSampleRate: environment.production ? 0.1 : 1.0,
  environment: environment.production ? 'production' : 'development',
});
```

### 3. Log Levels by Environment

**Development:**

- Log Level: DEBUG (all logs)
- Remote Logging: Disabled (console only)
- Sentry: Disabled or low sample rate

**Production:**

- Log Level: WARN (warnings and errors only)
- Remote Logging: Enabled
- Sentry: Enabled with appropriate sample rate

## Best Practices

### 1. Structured Logging

Always include context:

```typescript
// Good
this.logger.error('Payment failed', error, {
  orderId: order.id,
  amount: order.amount,
  paymentMethod: order.paymentMethod,
});

// Bad
this.logger.error('Payment failed', error);
```

### 2. Don't Log Sensitive Data

```typescript
// Bad
this.logger.info('User logged in', { password: user.password });

// Good
this.logger.info('User logged in', { userId: user.id, email: user.email });
```

### 3. Use Appropriate Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General flow information
- **WARN**: Potentially harmful situations
- **ERROR**: Error events that might still allow the app to continue

### 4. Performance Considerations

- Batch logs before sending (already implemented)
- Use `sendBeacon` API for reliability
- Don't block the main thread
- Set appropriate batch sizes and timeouts

### 5. Error Context

Always include error objects:

```typescript
try {
  // some operation
} catch (error) {
  this.logger.error('Operation failed', error, {
    operation: 'fetchUserData',
    userId: this.userId,
  });
}
```

## Monitoring and Alerting

### Grafana Dashboards

Create dashboards for:

1. **Error Rate**: Errors per minute/hour
2. **Error Types**: Most common errors
3. **User Impact**: Errors by user segment
4. **Performance**: API call durations
5. **Geographic Distribution**: Errors by region

### Alerting Rules

Set up alerts for:

- Error rate spikes (> 10 errors/min)
- Critical errors (payment failures, auth errors)
- Performance degradation
- Unusual patterns

## Testing

```typescript
// In tests
const logger = TestBed.inject(LoggerService);
const logs = logger.getLogBuffer();
expect(logs).toContain(
  jasmine.objectContaining({
    level: 'ERROR',
    message: 'Expected error message',
  })
);
```

## Migration from Console.log

Replace all `console.log` statements:

```typescript
// Before
console.log('User action', data);
console.error('Error occurred', error);

// After
this.logger.debug('User action', data);
this.logger.error('Error occurred', error);
```

## Next Steps

1. **Install Sentry** (recommended for production)
2. **Set up backend logging endpoint** to forward to Prometheus
3. **Create Grafana dashboards** for frontend logs
4. **Configure alerting** for critical errors
5. **Set up log retention policies** (30-90 days recommended)
6. **Implement log sampling** for high-traffic applications

## Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/angular/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)
- [Web Vitals](https://web.dev/vitals/) - Already integrated via web-vitals service
