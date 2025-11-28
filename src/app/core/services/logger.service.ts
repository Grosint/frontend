import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  private logBuffer: any[] = [];
  private maxBufferSize = 100;

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args, error);
  }

  private log(level: LogLevel, message: string, args: any[], error?: Error): void {
    if (level < this.logLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LogLevel[level],
      message,
      args,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };

    // Console output
    if (!environment.production) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' :
                           level === LogLevel.WARN ? 'warn' :
                           level === LogLevel.INFO ? 'info' : 'log';
      console[consoleMethod](`[${timestamp}] ${LogLevel[level]}: ${message}`, ...args);
      if (error) console.error(error);
    }

    // Buffer logs
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Send to remote logging service in production
    if (level >= LogLevel.WARN && environment.production) {
      this.sendToRemote(logEntry);
    }
  }

  private sendToRemote(logEntry: any): void {
    // Send to LogRocket, Loggly, or custom endpoint
    if ((window as any)['LogRocket']) {
      (window as any)['LogRocket'].captureMessage(logEntry.message, {
        level: logEntry.level.toLowerCase(),
        extra: logEntry
      });
    }
  }

  getLogBuffer(): any[] {
    return [...this.logBuffer];
  }
}
