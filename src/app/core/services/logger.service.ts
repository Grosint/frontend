import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logLevel: LogLevel;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private batchSize = 10;
  private pendingBatch: LogEntry[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private sessionId: string;
  private currentContext: LogContext = {};

  constructor() {
    const env = environment as Record<string, unknown>;
    this.logLevel =
      (env['logLevel'] as LogLevel | undefined) ??
      (environment.production ? LogLevel.WARN : LogLevel.DEBUG);
    this.sessionId = this.generateSessionId();
    this.initializeContext();
  }

  private initializeContext(): void {
    if (typeof window !== 'undefined') {
      this.currentContext = {
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setContext(context: Partial<LogContext>): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  clearContext(): void {
    this.currentContext = {};
    this.initializeContext();
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error, metadata);
  }

  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    metadata?: Record<string, unknown>
  ): void {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level: LogLevel[level],
      message,
      context: { ...this.currentContext },
      metadata,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    };

    // Console output (development only)
    if (!environment.production) {
      this.logToConsole(logEntry, error);
    }

    // Buffer logs
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Send to remote logging service
    if (this.shouldSendToRemote(level)) {
      this.sendToRemote(logEntry);
    }
  }

  private logToConsole(logEntry: LogEntry, error?: Error): void {
    const level = logEntry.level.toLowerCase();
    const style = this.getConsoleStyle(level);
    const prefix = `%c[${logEntry.timestamp}] ${logEntry.level}:`;

    console.groupCollapsed(`${prefix} ${logEntry.message}`, style);
    if (logEntry.context && Object.keys(logEntry.context).length > 0) {
      console.log('Context:', logEntry.context);
    }
    if (logEntry.metadata && Object.keys(logEntry.metadata).length > 0) {
      console.log('Metadata:', logEntry.metadata);
    }
    if (error) {
      console.error('Error:', error);
    }
    console.groupEnd();
  }

  private getConsoleStyle(level: string): string {
    const styles: Record<string, string> = {
      debug: 'color: #6c757d; font-weight: normal',
      info: 'color: #0d6efd; font-weight: normal',
      warn: 'color: #ffc107; font-weight: bold',
      error: 'color: #dc3545; font-weight: bold',
    };
    return styles[level] || styles['info'];
  }

  private shouldSendToRemote(level: LogLevel): boolean {
    if (!environment.production) return false;

    const env = environment as Record<string, unknown>;
    const minRemoteLevel = (env['remoteLogLevel'] as LogLevel | undefined) ?? LogLevel.WARN;
    return level >= minRemoteLevel;
  }

  private sendToRemote(logEntry: LogEntry): void {
    // Add to pending batch
    this.pendingBatch.push(logEntry);

    // Send immediately for errors
    if (logEntry.level === 'ERROR') {
      this.flushBatch();
      return;
    }

    // Batch other logs
    if (this.pendingBatch.length >= this.batchSize) {
      this.flushBatch();
    } else {
      // Set timeout to flush batch after delay
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      this.batchTimeout = setTimeout(() => this.flushBatch(), 5000);
    }
  }

  private flushBatch(): void {
    if (this.pendingBatch.length === 0) return;

    const batch = [...this.pendingBatch];
    this.pendingBatch = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Send to configured logging services
    this.sendToSentry(batch);
    this.sendToCustomEndpoint(batch);
    this.sendToLogRocket(batch);
  }

  private sendToSentry(logs: LogEntry[]): void {
    const env = environment as Record<string, unknown>;
    if (!env['sentryDsn']) return;

    try {
      const windowWithSentry = window as Window & {
        Sentry?: {
          captureException: (error: Error, options?: Record<string, unknown>) => void;
          captureMessage: (message: string, options?: Record<string, unknown>) => void;
        };
      };
      const Sentry = windowWithSentry.Sentry;
      if (Sentry) {
        logs.forEach(log => {
          if (log.level === 'ERROR' && log.error) {
            Sentry.captureException(new Error(log.error.message), {
              level: log.level.toLowerCase() as string,
              tags: log.context,
              extra: log.metadata,
              contexts: {
                error: {
                  message: log.error.message,
                  stack: log.error.stack,
                },
              },
            });
          } else {
            Sentry.captureMessage(log.message, {
              level: log.level.toLowerCase() as string,
              tags: log.context,
              extra: log.metadata,
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to send logs to Sentry:', error);
    }
  }

  private sendToCustomEndpoint(logs: LogEntry[]): void {
    const env = environment as Record<string, unknown>;
    const endpoint = env['loggingEndpoint'] as string | undefined;
    if (!endpoint) return;

    try {
      // Use sendBeacon for better reliability (doesn't block page unload)
      const data = JSON.stringify({
        logs,
        appVersion: environment.version,
        environment: environment.production ? 'production' : 'development',
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([data], { type: 'application/json' }));
      } else {
        // Fallback to fetch
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(error => {
          console.error('Failed to send logs to custom endpoint:', error);
        });
      }
    } catch (error) {
      console.error('Failed to send logs to custom endpoint:', error);
    }
  }

  private sendToLogRocket(logs: LogEntry[]): void {
    const windowWithLogRocket = window as Window & {
      LogRocket?: { captureMessage: (message: string, options?: Record<string, unknown>) => void };
    };
    if (!windowWithLogRocket.LogRocket) return;

    try {
      logs.forEach(log => {
        windowWithLogRocket.LogRocket?.captureMessage(log.message, {
          level: log.level.toLowerCase(),
          extra: {
            ...log.context,
            ...log.metadata,
            error: log.error,
          },
        });
      });
    } catch (error) {
      console.error('Failed to send logs to LogRocket:', error);
    }
  }

  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  // Performance logging
  time(label: string): void {
    if (console.time && !environment.production) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (console.timeEnd && !environment.production) {
      console.timeEnd(label);
    }
  }
}
