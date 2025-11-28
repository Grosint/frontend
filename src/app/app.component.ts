import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { environment } from '@environments/environment';
import { AppStateStore } from './core/services/app-state.store';
import { WebVitalsService } from './core/services/web-vitals.service';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'GrosInt';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appState: AppStateStore,
    private webVitals: WebVitalsService,
    private pwa: PwaService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Enforce HTTPS in production
      if (location.protocol !== 'https:' && environment.production) {
        location.replace('https:' + window.location.href.substring(window.location.protocol.length));
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
}
