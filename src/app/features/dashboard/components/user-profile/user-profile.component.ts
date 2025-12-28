import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { AppStateStore } from '@core/services/app-state.store';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  get user() {
    return this.appState.user();
  }

  searchHistoryEnabled = true;
  isEditMode = false;
  isChangePasswordMode = false;

  constructor(
    public appState: AppStateStore,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  editProfile(): void {
    this.isEditMode = true;
    this.cdr.markForCheck();
  }

  onCloseEditProfile(): void {
    this.isEditMode = false;
    this.cdr.markForCheck();
  }

  changePassword(): void {
    this.isChangePasswordMode = true;
    this.cdr.markForCheck();
  }

  onCloseChangePassword(): void {
    this.isChangePasswordMode = false;
    this.cdr.markForCheck();
  }

  toggleSearchHistory(): void {
    this.searchHistoryEnabled = !this.searchHistoryEnabled;
    this.cdr.markForCheck();
    // TODO: Save preference to backend
  }

  deleteAllData(): void {
    // TODO: Implement delete all data functionality with confirmation
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      console.log('Delete All Data clicked');
    }
  }

  logout(): void {
    this.auth.logout();
  }

  goToDashboardClick(): void {
    this.router.navigate(['/dashboard/profile']);
  }
}
