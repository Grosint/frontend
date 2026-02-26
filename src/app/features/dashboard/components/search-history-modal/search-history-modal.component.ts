import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  HistoryService,
  SearchHistoryItem,
  SearchHistoryDetailResponse,
} from '../../services/history.service';
import { take } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SearchResponse, SearchResultItem } from '../../models/search.model';

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
  isSelecting = false;
  errorMessage = '';
  totalRecords = 0;
  private page = 1;
  private readonly pageSize = 10;
  private hasMore = true;

  constructor(
    private historyService: HistoryService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SearchHistoryModalComponent>,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  close(): void {
    this.dialogRef.close();
  }

  onSelectHistory(item: SearchHistoryItem): void {
    if (this.isSelecting) {
      return;
    }

    this.isSelecting = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.historyService
      .getHistoryById(item.id)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isSelecting = false;
          this.cdr.markForCheck();

          if (!response?.success) {
            const message = response?.message || 'Failed to load history details.';
            this.snackBar.open(message, 'Dismiss', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
            return;
          }

          const mapped = this.mapHistoryResponse(response);
          this.dialogRef.close(mapped);
        },
        error: error => {
          this.isSelecting = false;
          const message =
            error?.error?.message || error?.message || 'Failed to load history details.';
          this.snackBar.open(message, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.cdr.markForCheck();
        },
      });
  }

  private mapHistoryResponse(response: SearchHistoryDetailResponse): SearchResponse {
    const data = response.data;
    const parsed = this.parseHistoryQuery(data.queryInput);
    const results = (data.flattenedResults || []).map(item => this.normalizeResultItem(item));

    const mapped: SearchResponse = {
      success: true,
      message: response.message || 'History retrieved',
      timestamp: response.timestamp || new Date().toISOString(),
      data: {
        search_id: data.id,
        phone: parsed.phone,
        country_code: parsed.countryCode,
        email: parsed.email,
        status: data.status,
        results_count: results.length,
        failed_count: 0,
        results,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      },
    };

    (mapped as SearchResponse & { historyQueryType?: string }).historyQueryType = data.queryType;
    return mapped;
  }

  private parseHistoryQuery(value: string): {
    phone?: string;
    countryCode?: string;
    email?: string;
  } {
    const trimmed = value?.trim() || '';
    const normalized = trimmed.replace(/^ADV\|/i, '');

    if (normalized.includes('@')) {
      return { email: normalized };
    }

    const plusMatches = normalized.match(/\+\d+/g) || [];
    if (plusMatches.length >= 2) {
      const countryCode = plusMatches[0];
      const phone = plusMatches[1];
      return { phone, countryCode };
    }

    if (plusMatches.length === 1) {
      const digits = normalized.replace(/[^\d]/g, '');
      const ccDigits = plusMatches[0].replace(/[^\d]/g, '');
      if (digits.length > ccDigits.length) {
        const phone = `+${digits.slice(ccDigits.length)}`;
        const countryCode = plusMatches[0];
        return { phone, countryCode };
      }
      return { phone: plusMatches[0] };
    }

    const digitsOnly = normalized.replace(/[^\d]/g, '');
    return digitsOnly ? { phone: digitsOnly } : {};
  }

  private normalizeResultItem(item: SearchResultItem): SearchResultItem {
    return {
      source: item.source,
      type: item.type,
      value: item.value,
      showSource: item.showSource,
      category: item.category,
      found: item.found,
      data: item.data,
      confidence: item.confidence,
      breach_source: item.breach_source,
      groupBy: item.groupBy,
      metadata: item.metadata,
    };
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
            // Keep existing list visible on error
          } else {
            const newItems = response.data || [];
            this.items = append ? [...this.items, ...newItems] : newItems;
            this.hasMore = response.pagination?.has_next ?? false;
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
          // Keep existing list visible on error
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
    this.filteredItems = this.items.filter(item =>
      this.formatQueryInput(item).toLowerCase().includes(term)
    );
  }

  formatQueryInput(item: SearchHistoryItem): string {
    if (typeof item.queryInput === 'string') {
      return item.queryInput;
    }
    try {
      return JSON.stringify(item.queryInput);
    } catch {
      return '[object]';
    }
  }

  formatQueryInputDisplay(item: SearchHistoryItem): string {
    if (typeof item.queryInput === 'string') {
      const cleaned = item.queryInput.replace(/^ADV\|/i, '').trim();
      return cleaned.replace(/\+(\d+)\+/g, '+$1 ');
    }

    const queryObj = item.queryInput as Record<string, unknown>;
    const template = queryObj['template'];
    const linkId = queryObj['link_id'];

    if (template && linkId) {
      return `${String(template)} • link_id: ${String(linkId)}`;
    }

    if (template) {
      return `template: ${String(template)}`;
    }

    if (linkId) {
      return `link_id: ${String(linkId)}`;
    }

    return this.formatQueryInput(item);
  }
}
