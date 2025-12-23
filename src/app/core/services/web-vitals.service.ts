import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import { environment } from '@environments/environment';

interface WindowWithAnalytics extends Window {
  newrelic?: {
    addPageAction: (name: string, data: Record<string, unknown>) => void;
  };
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
}

@Injectable({
  providedIn: 'root',
})
export class WebVitalsService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  init(): void {
    if (isPlatformBrowser(this.platformId) && environment.enableAnalytics) {
      this.trackWebVitals();
    }
  }

  private trackWebVitals(): void {
    getCLS(this.sendToAnalytics);
    getFID(this.sendToAnalytics);
    getFCP(this.sendToAnalytics);
    getLCP(this.sendToAnalytics);
    getTTFB(this.sendToAnalytics);
  }

  private sendToAnalytics = (metric: Metric): void => {
    const windowWithAnalytics = window as WindowWithAnalytics;

    // Send to New Relic if available
    if (windowWithAnalytics.newrelic) {
      windowWithAnalytics.newrelic.addPageAction('web-vitals', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        delta: metric.delta,
      });
    }

    // Send to Google Analytics 4 if available
    if (windowWithAnalytics.gtag) {
      windowWithAnalytics.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        metric_id: metric.id,
        metric_delta: metric.delta,
        non_interaction: true,
      });
    }

    // Log in development
    if (!environment.production) {
      console.log('Web Vital:', metric.name, metric.value, metric.rating);
    }
  };
}
