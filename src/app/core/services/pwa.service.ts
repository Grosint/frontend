import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any;

  constructor(private swUpdate: SwUpdate) {
    this.setupInstallPrompt();
    this.setupUpdateCheck();
  }

  /**
   * Setup beforeinstallprompt event listener
   */
  private setupInstallPrompt(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (event: any) => {
        event.preventDefault();
        this.promptEvent = event;
      });
    }
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.promptEvent) {
      return false;
    }

    this.promptEvent.prompt();
    const result = await this.promptEvent.userChoice;
    this.promptEvent = null;

    return result.outcome === 'accepted';
  }

  /**
   * Check if PWA can be installed
   */
  canInstall(): boolean {
    return !!this.promptEvent;
  }

  /**
   * Check if app is installed (running as PWA)
   */
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Setup service worker update checking
   */
  private setupUpdateCheck(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Check for updates every hour
    setInterval(() => {
      this.swUpdate.checkForUpdate();
    }, 60 * 60 * 1000);

    // Listen for version ready
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        // Notify user about update
        if (confirm('New version available. Reload?')) {
          window.location.reload();
        }
      });
  }

  /**
   * Check for updates manually
   */
  async checkForUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    await this.swUpdate.checkForUpdate();
  }
}
