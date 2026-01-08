import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NavbarSelection } from '../../models/menu-item.model';
import { SearchService } from '../../services/search.service';
import { SearchResponse, SearchResultItem } from '../../models/search.model';
import { take } from 'rxjs/operators';

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
  searchPlaceholder: string = 'Enter search query...';
  isLoading: boolean = false;
  searchResults: SearchResultItem[] = [];
  searchResponse: SearchResponse | null = null;
  errorMessage: string = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private searchService: SearchService
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

    this.searchService
      .search(this.selectedOption.parent, this.selectedOption.child, this.searchQuery.trim())
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.searchResponse = response;
          this.searchResults = response.data?.results || [];
          this.cdr.markForCheck();

          // Emit search event for parent component
        },
        error: error => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'Search failed. Please try again.';
          this.searchResults = [];
          this.cdr.markForCheck();
        },
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
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
      if (childLabel === 'mobile') {
        this.searchPlaceholder = 'Enter phone number (e.g., 9997260627 or +91 9997260627)';
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
}
