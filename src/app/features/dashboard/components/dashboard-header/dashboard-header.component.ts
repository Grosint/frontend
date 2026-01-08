import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateStore } from '@core/services/app-state.store';

@Component({
  selector: 'app-dashboard-header',
  standalone: false,
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  get user() {
    return this.appState.user();
  }

  constructor(
    public appState: AppStateStore,
    private router: Router
  ) {}

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  buyCredits(): void {
    this.router.navigate(['dashboard/buy-credits']);
  }

  showUserInfo(): void {
    this.router.navigate(['/dashboard/profile']);
  }
}
