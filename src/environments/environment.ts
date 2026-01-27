export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  version: '1.0.0',
  enableServiceWorker: false,
  enableAnalytics: false,
  sentryDsn: '',
  gaTrackingId: '',
  newRelicAppId: '',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa'],
  // Logging configuration
  logLevel: 0, // DEBUG level for development (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)
  remoteLogLevel: 2, // Only send WARN and above to remote services
  loggingEndpoint: '', // Custom logging API endpoint (e.g., '/api/logs')
  enableRemoteLogging: false, // Enable remote logging in development
};
