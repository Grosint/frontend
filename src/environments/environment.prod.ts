/**
 * Production environment configuration
 *
 * IMPORTANT: Update the apiUrl below with your actual backend API URL
 * This should match your Azure backend deployment URL
 *
 * Example: 'https://your-backend-app.azurewebsites.net/api'
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api', // TODO: Update with your actual backend API URL
  version: '1.0.0',
  enableServiceWorker: true,
  enableAnalytics: true,
  sentryDsn: 'YOUR_SENTRY_DSN',
  gaTrackingId: 'GA_MEASUREMENT_ID',
  newRelicAppId: 'YOUR_NEW_RELIC_APP_ID',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'],
  // Logging configuration
  logLevel: 2, // WARN level for production (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)
  remoteLogLevel: 2, // Send WARN and ERROR to remote services
  loggingEndpoint: 'https://api.yourdomain.com/api/logs', // Your logging API endpoint
  enableRemoteLogging: true, // Enable remote logging in production
};
