import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
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
  @Output() search = new EventEmitter<{ option: NavbarSelection; query: string }>();

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

    // const res = {
    //   success: true,
    //   message: 'Phone lookup executed successfully with 3 successful results',
    //   timestamp: '2025-12-28T08:54:40.109601Z',
    //   data: {
    //     search_id: '6950f04d1abf0a40407e1289',
    //     phone: '+919997260627',
    //     country_code: '+91',
    //     status: 'completed',
    //     results_count: 3,
    //     failed_count: 6,
    //     error_message: '6 sources failed',
    //     results: [
    //       {
    //         source: 'callapp',
    //         type: 'name',
    //         value: 'anshul cto',
    //         showSource: false,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Instagram',
    //         type: 'platforms',
    //         value: 'Yes',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Snapchat',
    //         type: 'platforms',
    //         value: 'No',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Amazon',
    //         type: 'platforms',
    //         value: 'Yes',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         found: false,
    //         source: 'leakcheck',
    //         data: null,
    //         confidence: 0.0,
    //       },
    //       {
    //         source: 'Phone Number',
    //         type: 'msisdn',
    //         value: '+919997260627',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Connectivity Status',
    //         type: 'status',
    //         value: 'CONNECTED',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Processing Status',
    //         type: 'status',
    //         value: 'COMPLETED',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Original Network',
    //         type: 'network',
    //         value: 'Airtel - Uttar Pradesh West',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Original Country',
    //         type: 'country',
    //         value: 'India',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Original Country Code',
    //         type: 'country_code',
    //         value: 'IN',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Original Country Prefix',
    //         type: 'country_prefix',
    //         value: '+91',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Is Ported',
    //         type: 'ported',
    //         value: 'Yes',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Ported Network',
    //         type: 'network',
    //         value: 'Airtel - Karnataka',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Ported Country',
    //         type: 'country',
    //         value: 'India',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Ported Country Code',
    //         type: 'country_code',
    //         value: 'IN',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Ported Country Prefix',
    //         type: 'country_prefix',
    //         value: '+91',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Is Roaming',
    //         type: 'roaming',
    //         value: 'No',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'MCCMNC',
    //         type: 'network_code',
    //         value: '40445',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'MCC',
    //         type: 'network_code',
    //         value: '404',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'MNC',
    //         type: 'network_code',
    //         value: '45',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'MSC',
    //         type: 'network_code',
    //         value: 'MOBILE',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Cost',
    //         type: 'cost',
    //         value: '0.005',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Timestamp',
    //         type: 'timestamp',
    //         value: '2025-12-28 14:24:38.598+0530',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Data Source',
    //         type: 'data_source',
    //         value: 'MNP_DB',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Route',
    //         type: 'route',
    //         value: 'PTX',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Routing Instruction',
    //         type: 'routing',
    //         value: 'AUTO:PTX:MNP_FALLBACK',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Storage',
    //         type: 'storage',
    //         value: 'API-SYNC-2025-12',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //       {
    //         source: 'Lookup ID',
    //         type: 'id',
    //         value: '0ff05ae281e0',
    //         showSource: true,
    //         category: 'TEXT',
    //       },
    //     ],
    //     created_at: '2025-12-28T08:54:37.717579+00:00',
    //     updated_at: '2025-12-28T08:54:37.717640+00:00',
    //   },
    // };

    // this.isLoading = false;
    // this.searchResponse = res;
    // this.searchResults = res.data?.results || [];
    // this.cdr.markForCheck();

    // // Emit search event for parent component
    // this.search.emit({
    //   option: this.selectedOption!,
    //   query: this.searchQuery.trim(),
    // });

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
          this.search.emit({
            option: this.selectedOption!,
            query: this.searchQuery.trim(),
          });
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
