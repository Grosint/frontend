import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebVitalsService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
    // Send to New Relic if available
    if ((window as any)['newrelic']) {
      (window as any)['newrelic'].addPageAction('web-vitals', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        delta: metric.delta
      });
    }

    // Send to Google Analytics 4 if available
    if ((window as any)['gtag']) {
      (window as any)['gtag']('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        metric_id: metric.id,
        metric_delta: metric.delta,
        non_interaction: true
      });
    }

    // Log in development
    if (!environment.production) {
      console.log('Web Vital:', metric.name, metric.value, metric.rating);
    }
  };
}
