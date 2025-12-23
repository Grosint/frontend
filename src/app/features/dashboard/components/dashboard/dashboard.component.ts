import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { AppStateStore } from '@core/services/app-state.store';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  // Use signal directly instead of Observable
  get user() {
    return this.appState.user();
  }

  constructor(
    private auth: AuthService,
    public appState: AppStateStore
  ) {}

  logout(): void {
    this.auth.logout();
  }
}
