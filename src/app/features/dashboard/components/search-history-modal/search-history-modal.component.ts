import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HistoryService, SearchHistoryItem } from '../../services/history.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-search-history-modal',
  standalone: false,
  templateUrl: './search-history-modal.component.html',
  styleUrls: ['./search-history-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchHistoryModalComponent implements OnInit {
  items: SearchHistoryItem[] = [];
  filteredItems: SearchHistoryItem[] = [];
  searchTerm = '';
  isLoading = false;
  isLoadingMore = false;
  errorMessage = '';
  totalRecords = 0;
  private page = 1;
  private readonly pageSize = 10;
  private hasMore = true;

  constructor(
    private historyService: HistoryService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SearchHistoryModalComponent>
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  close(): void {
    this.dialogRef.close();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilter();
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target || this.isLoading || this.isLoadingMore || !this.hasMore) {
      return;
    }

    const threshold = 80;
    const isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - threshold;
    if (isNearBottom) {
      this.loadHistory(true);
    }
  }

  trackById(index: number, item: SearchHistoryItem): string {
    return item.id;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }

  private loadHistory(append = false): void {
    if (append) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
      this.errorMessage = '';
      this.page = 1;
      this.hasMore = true;
    }
    this.cdr.markForCheck();

    this.historyService
      .getHistory(this.page, this.pageSize)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.isLoadingMore = false;
          if (!response?.success) {
            this.errorMessage = response?.message || 'Failed to load history.';
            this.items = [];
            this.filteredItems = [];
            this.totalRecords = 0;
          } else {
            const newItems = response.data || [];
            this.items = append ? [...this.items, ...newItems] : newItems;
            this.hasMore = newItems.length >= this.pageSize;
            if (this.hasMore) {
              this.page += 1;
            }
            this.totalRecords = response.pagination?.total ?? this.totalRecords;
            this.applyFilter();
          }
          this.cdr.markForCheck();
        },
        error: error => {
          this.isLoading = false;
          this.isLoadingMore = false;
          this.errorMessage = error?.error?.message || error?.message || 'Failed to load history.';
          this.cdr.markForCheck();
        },
      });
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredItems = [...this.items];
      return;
    }
    this.filteredItems = this.items.filter(item => item.queryInput.toLowerCase().includes(term));
  }
}
