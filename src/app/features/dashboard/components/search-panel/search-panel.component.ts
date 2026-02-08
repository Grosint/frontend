import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavbarSelection } from '../../models/menu-item.model';
import { SearchService } from '../../services/search.service';
import { SearchResponse, SearchResultItem } from '../../models/search.model';
import { take } from 'rxjs/operators';
import { SearchHistoryModalComponent } from '../search-history-modal/search-history-modal.component';
import groupConfigData from '../../../../../assets/data/search-result-groups.json';

interface GroupConfig {
  key: string;
  label: string;
  order: number;
}

interface GroupedResults {
  key: string;
  label: string;
  items: SearchResultItem[];
}

@Component({
  selector: 'app-search-panel',
  standalone: false,
  templateUrl: './search-panel.component.html',
  styleUrls: ['./search-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPanelComponent implements OnInit, OnChanges {
  @Input() selectedOption: NavbarSelection | null = null;

  searchQuery: string = '';
  searchCountryCode: string = '+91';
  searchPlaceholder: string = 'Enter search query...';
  isLoading: boolean = false;
  searchResults: SearchResultItem[] = [];
  searchResponse: SearchResponse | null = null;
  errorMessage: string = '';
  groupedResults: GroupedResults[] = [];
  private groupConfigs: GroupConfig[] = (groupConfigData as GroupConfig[]) || [];

  constructor(
    private cdr: ChangeDetectorRef,
    private searchService: SearchService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.updatePlaceholder();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption']) {
      this.updatePlaceholder();
      // Clear results when option changes
      this.searchQuery = '';
      this.searchResults = [];
      this.groupedResults = [];
      this.searchResponse = null;
      this.errorMessage = '';
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    if (!this.selectedOption || !this.searchQuery.trim()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.searchResults = [];
    this.searchResponse = null;
    this.cdr.markForCheck();

    const normalizedQuery = this.getSearchQuery();

    this.searchService
      .search(this.selectedOption.parent, this.selectedOption.child, normalizedQuery)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.searchResponse = response;
          this.searchResults = response.data?.results || [];
          this.groupedResults = this.buildGroupedResults(this.searchResults);
          this.cdr.markForCheck();

          // Emit search event for parent component
        },
        error: error => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'Search failed. Please try again.';
          this.searchResults = [];
          this.groupedResults = [];
          this.cdr.markForCheck();
        },
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    if (!this.isMobileSearch) {
      return;
    }

    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPhonePaste(event: ClipboardEvent): void {
    if (!this.isMobileSearch) {
      return;
    }

    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!/^\d+$/.test(pasted.replace(/\s+/g, ''))) {
      event.preventDefault();
    }
  }

  openHistory(): void {
    this.dialog.open(SearchHistoryModalComponent, {
      panelClass: 'search-history-dialog',
      backdropClass: 'search-history-backdrop',
      autoFocus: false,
      width: '45%',
      minWidth: '40vw',
      height: '85%',
    });
  }

  getDisplayText(): string {
    if (!this.selectedOption) {
      return 'Please select an option from the menu';
    }

    if (this.selectedOption.child) {
      return `${this.selectedOption.parent?.label} > ${this.selectedOption.child.label}`;
    }

    return this.selectedOption.parent?.label || '';
  }

  private updatePlaceholder(): void {
    if (this.selectedOption?.child) {
      const childLabel = this.selectedOption.child.label.toLowerCase();
      if (childLabel === 'mobile' || childLabel === 'phone') {
        this.searchPlaceholder = 'Enter phone number (e.g., 9997260627)';
      } else {
        this.searchPlaceholder = `Enter ${childLabel} to search...`;
      }
    } else if (this.selectedOption?.parent) {
      this.searchPlaceholder = `Enter ${this.selectedOption.parent.label.toLowerCase()} query...`;
    } else {
      this.searchPlaceholder = 'Select an option to search...';
    }
    this.cdr.markForCheck();
  }

  get isMobileSearch(): boolean {
    const parts = [
      this.selectedOption?.child?.value,
      this.selectedOption?.child?.label,
      this.selectedOption?.parent?.value,
      this.selectedOption?.parent?.label,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return parts.includes('mobile') || parts.includes('phone');
  }

  private getSearchQuery(): string {
    const rawQuery = this.searchQuery.trim();
    if (!this.isMobileSearch) {
      return rawQuery;
    }

    const normalized = rawQuery.replace(/\s+/g, '');
    if (normalized.startsWith('+')) {
      return normalized;
    }

    return `${this.searchCountryCode}${normalized}`;
  }

  private buildGroupedResults(results: SearchResultItem[]): GroupedResults[] {
    const groups = new Map<string, SearchResultItem[]>();
    results.forEach(item => {
      const key = item.groupBy || item.type || 'default';
      const existing = groups.get(key) || [];
      existing.push(item);
      groups.set(key, existing);
    });

    const configByKey = new Map(this.groupConfigs.map(config => [config.key, config]));

    const grouped = Array.from(groups.entries()).map(([key, items]) => {
      const config = configByKey.get(key) || configByKey.get('default');
      return {
        key,
        label: config?.label || key.replace(/_/g, ' '),
        items,
      };
    });

    return grouped.sort((a, b) => {
      const orderA = configByKey.get(a.key)?.order ?? configByKey.get('default')?.order ?? 999;
      const orderB = configByKey.get(b.key)?.order ?? configByKey.get('default')?.order ?? 999;
      return orderA - orderB;
    });
  }
}
