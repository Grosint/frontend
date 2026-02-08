import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '@environments/environment';
import { AppStateStore } from './core/services/app-state.store';
import { WebVitalsService } from './core/services/web-vitals.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'GrosInt';
  showVersionNotice = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private appState: AppStateStore,
    private webVitals: WebVitalsService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.showVersionNotice = true;
      // Enforce HTTPS in production
      if (location.protocol !== 'https:' && environment.production) {
        location.replace(
          'https:' + window.location.href.substring(window.location.protocol.length)
        );
      }

      // Initialize services
      this.webVitals.init();

      // Set initial theme
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        this.appState.setTheme(savedTheme);
      }

      // Set initial language
      const savedLang = localStorage.getItem('language');
      if (savedLang) {
        this.appState.setLanguage(savedLang);
      }
    }
  }

  goBack(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.history.back();
  }

  goToOldVersion(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.location.href = 'https://grosint.com/signin';
  }
}
