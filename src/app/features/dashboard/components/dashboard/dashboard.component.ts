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

  constructor(
    public appState: AppStateStore,
    private cdr: ChangeDetectorRef
  ) {}

  onSelectionChange(selection: NavbarSelection): void {
    this.selectedOption = selection;
    this.cdr.markForCheck();
  }

  onSearch(event: any): void {
    console.log('Search triggered:', event);
    // Handle search logic here
    // You can call a service method or navigate to results page
  }
}
