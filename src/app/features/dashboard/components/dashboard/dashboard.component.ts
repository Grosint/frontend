import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AppStateStore } from '@core/services/app-state.store';
import { NavbarSelection } from '@features/dashboard/models/menu-item.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  selectedOption: NavbarSelection | null = null;
  isNavbarCollapsed = false;

  constructor(
    public appState: AppStateStore,
    private cdr: ChangeDetectorRef
  ) {}

  onSelectionChange(selection: NavbarSelection): void {
    this.selectedOption = selection;
    this.cdr.markForCheck();
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    this.cdr.markForCheck();
  }
}
