import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MenuItem, NavbarSelection } from '../../models/menu-item.model';
import { SearchService } from '../../services/search.service';
import { SearchRequest, SearchResponse, SearchResultItem } from '../../models/search.model';
import { take } from 'rxjs/operators';
import { SearchHistoryModalComponent } from '../search-history-modal/search-history-modal.component';
import groupConfigData from '../../../../../assets/data/search-result-groups.json';
import { AppStateStore } from '@core/services/app-state.store';
import menuItemsData from '../../../../../assets/data/menu-items.json';

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

interface MenuItemConfig {
  route?: string;
  inputType?: 'text' | 'number' | 'email' | 'bank' | 'ip' | 'imei';
  validations?: string[];
}

const buildMenuConfigMap = (items: MenuItem[]): Record<string, MenuItemConfig> => {
  const map: Record<string, MenuItemConfig> = {};
  const walk = (nodes: MenuItem[]) => {
    nodes.forEach(node => {
      if (node.id) {
        map[node.id] = {
          route: node.route,
          inputType: node.inputType,
          validations: node.validations,
        };
      }
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };
  walk(items);
  return map;
};

@Component({
  selector: 'app-search-panel',
  standalone: false,
  templateUrl: './search-panel.component.html',
  styleUrls: ['./search-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPanelComponent implements OnInit, OnChanges {
  @Input() selectedOption: NavbarSelection | null = null;
  @ViewChild('pdfContent') pdfContent?: ElementRef<HTMLDivElement>;

  searchQuery: string = '';
  searchCountryCode: string = '+91';
  searchPlaceholder: string = 'Enter search query...';
  isLoading: boolean = false;
  isPdfLoading = false;
  isShareLoading = false;
  isShareSupported = false;
  searchResults: SearchResultItem[] = [];
  searchResponse: SearchResponse | null = null;
  errorMessage: string = '';
  groupedResults: GroupedResults[] = [];
  historyQueryLabel: string | null = null;
  historyQueryType: string | null = null;
  private groupConfigs: GroupConfig[] = (groupConfigData as GroupConfig[]) || [];
  private menuItemConfigs: Record<string, MenuItemConfig> = buildMenuConfigMap(
    menuItemsData as MenuItem[]
  );
  currentInputType: 'text' | 'number' | 'email' | 'bank' | 'ip' | 'imei' = 'text';
  bankAccountNumber = '';
  bankIfscCode = '';
  showBankErrors = false;
  idDobValue = '';
  showDobError = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private searchService: SearchService,
    private dialog: MatDialog,
    private appState: AppStateStore,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.updatePlaceholder();
    this.isShareSupported =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';
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
      this.currentInputType = this.getConfigInputType();
      this.bankAccountNumber = '';
      this.bankIfscCode = '';
      this.showBankErrors = false;
      this.idDobValue = '';
      this.showDobError = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    const isBankSearch = this.currentInputType === 'bank';
    if (!this.selectedOption || (!isBankSearch && !this.searchQuery.trim())) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.searchResults = [];
    this.searchResponse = null;
    this.historyQueryLabel = null;
    this.historyQueryType = null;
    this.showBankErrors = false;
    this.showDobError = false;
    this.cdr.markForCheck();

    if (isBankSearch) {
      if (!this.isValidBankInput()) {
        this.errorMessage = this.getBankValidationMessage();
        this.showBankErrors = true;
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }
    } else if (this.requiresDob()) {
      if (!this.idDobValue.trim()) {
        this.errorMessage = 'Date of birth is required.';
        this.showDobError = true;
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }
    } else {
      const normalizedQuery = this.getSearchQuery();
      if (!this.isValidInput(normalizedQuery)) {
        this.errorMessage = this.getValidationMessage();
        this.isLoading = false;
        this.cdr.markForCheck();
        return;
      }
    }

    const normalizedQuery = this.getSearchQuery();
    const overrideBody = isBankSearch
      ? {
          account_no: this.bankAccountNumber.trim(),
          ifsc_code: this.bankIfscCode.trim(),
        }
      : this.requiresDob()
        ? { id_type: 'dl', value: normalizedQuery, dob: this.idDobValue.trim() }
        : this.getLeakedDataBody();

    this.searchService
      .search(this.selectedOption.parent, this.selectedOption.child, normalizedQuery, overrideBody)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.historyQueryLabel = null;
          this.historyQueryType = null;
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
    if (!this.isMobileSearch && this.currentInputType !== 'number') {
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
    if (!this.isMobileSearch && this.currentInputType !== 'number') {
      return;
    }

    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!/^\d+$/.test(pasted.replace(/\s+/g, ''))) {
      event.preventDefault();
    }
  }

  openHistory(): void {
    const selectedType = this.getHistorySearchType();
    const dialogRef = this.dialog.open(SearchHistoryModalComponent, {
      panelClass: 'search-history-dialog',
      backdropClass: 'search-history-backdrop',
      autoFocus: false,
      width: '45%',
      minWidth: '40vw',
      height: '85%',
      data: { type: selectedType },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (!result) {
          return;
        }
        this.applyHistoryResult(result);
      });
  }

  private getHistorySearchType(): string | undefined {
    const parentValue = this.selectedOption?.parent?.value;
    const childValue = this.selectedOption?.child?.value;
    if (!parentValue && !childValue) {
      return undefined;
    }
    if (parentValue === 'leaked-data') {
      return 'dark-web-leak';
    }
    const value = childValue || parentValue;
    if (!value) {
      return undefined;
    }
    const typeMap: Record<string, string> = {
      mobile: 'phone-lookup',
      'mobile-verify-search': 'phone-lookup',
      email: 'email-lookup',
      'ip-search': 'ip-lookup',
      'imei-search': 'imei-lookup',
      'bank-account': 'bank-account',
      'bank-account-search': 'bank-account',
      'virtual-no-email-mobile': 'virtual-number',
      'virtual-no-email-email': 'virtual-email',
      'vehicle-search': 'vehicle-all',
      'rc-search': 'vehicle-rc',
      'fasttag-history': 'vehicle-fast-tag',
      'chassis-rc': 'vehicle-chasis',
      pan: 'verify-id',
      'driving-license': 'verify-id',
      'voter-id': 'verify-id',
      passport: 'verify-id',
      'leaked-data-username': 'dark-web-leak',
      'leaked-data-email': 'dark-web-leak',
      'leaked-data-mobile': 'dark-web-leak',
      'leaked-data-keyword': 'dark-web-leak',
      'leaked-data': 'dark-web-leak',
      'osint-search-mobile': 'phone-lookup',
      'osint-search-email': 'email-lookup',
      'virtual-no-email': 'virtual-number',
      'verify-government-id': 'verify-id',
      'vehicle-search-rc-search': 'vehicle-rc',
      'vehicle-search-fasttag-history': 'vehicle-fast-tag',
      'vehicle-search-chassis-rc': 'vehicle-chasis',
    };
    return typeMap[value] || value;
  }

  async downloadPdf(): Promise<void> {
    if (!this.searchResponse || !this.searchResults.length || !this.pdfContent) {
      return;
    }

    this.isPdfLoading = true;
    this.cdr.markForCheck();

    try {
      const { pdf, fileName } = await this.buildPdfDocument();
      pdf.save(fileName);
    } catch {
      this.snackBar.open('Unable to generate PDF. Please try again.', 'Dismiss', {
        duration: 3500,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    } finally {
      this.isPdfLoading = false;
      this.cdr.markForCheck();
    }
  }

  async shareReportText(): Promise<void> {
    if (!this.searchResponse || !this.searchResults.length) {
      return;
    }

    if (!this.isShareSupported) {
      this.snackBar.open('Sharing is not supported on this device.', 'Dismiss', {
        duration: 3500,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }

    this.isShareLoading = true;
    this.cdr.markForCheck();

    try {
      const shareText = this.buildShareText();
      const shareData: ShareData = {
        title: this.reportTypeLabel,
        text: shareText,
      };

      await navigator.share(shareData);
    } catch (error) {
      this.snackBar.open('Unable to share the report text.', 'Dismiss', {
        duration: 3500,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    } finally {
      this.isShareLoading = false;
      this.cdr.markForCheck();
    }
  }

  private async buildPdfDocument(): Promise<{ pdf: jsPDF; fileName: string }> {
    const element = this.pdfContent?.nativeElement;
    if (!element || !this.searchResponse) {
      throw new Error('PDF content unavailable');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imageData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `grosint-report-${this.searchResponse.data.search_id}.pdf`;
    return { pdf, fileName };
  }

  private buildShareText(): string {
    const lines: string[] = [];
    const reportTitle = this.reportTypeLabel || 'Search Report';
    lines.push(reportTitle);
    lines.push('-------------------------------------------------------------------');

    this.groupedResults.forEach(group => {
      lines.push(`${group.label}:`);
      const values = group.items
        .map(item => item.value)
        .filter((value): value is string => Boolean(value && value.trim()));

      if (!values.length || group.items.every(item => item.found === false)) {
        lines.push(' Message: Data Not Found');
      } else {
        lines.push(` ${values.join(', ')}`);
      }
      lines.push('');
    });

    lines.push('--------------------------------------------------------------------');
    lines.push(`Report Generated By Govt Official Using Mobile Number: ${this.requestedByLabel}`);
    return lines.join('\n');
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

  get isVehicleSearch(): boolean {
    const vehicleKeys = new Set(['vehicle-search', 'rc-search', 'chassis-rc', 'fasttag-history']);
    return [this.selectedOption?.child?.value, this.selectedOption?.parent?.value]
      .filter((v): v is string => Boolean(v))
      .some(v => vehicleKeys.has(v));
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
      let key = item.groupBy || item.type || 'default';
      if (key === 'default' && this.isVehicleSearch) {
        key = 'vehicle_info';
      }
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

  private applyHistoryResult(response: SearchResponse): void {
    this.isLoading = false;
    this.errorMessage = '';
    this.searchResponse = response;
    this.historyQueryLabel = this.buildHistoryQueryLabel(response);
    this.historyQueryType =
      (response as SearchResponse & { historyQueryType?: string }).historyQueryType || null;
    this.searchResults = response.data?.results || [];
    this.groupedResults = this.buildGroupedResults(this.searchResults);

    if (response.data?.country_code) {
      this.searchCountryCode = response.data.country_code;
    }

    if (response.data?.phone) {
      const phone = response.data.phone;
      if (response.data.country_code && phone.startsWith(response.data.country_code)) {
        this.searchQuery = phone.slice(response.data.country_code.length);
      } else {
        this.searchQuery = phone;
      }
    } else if (response.data?.email) {
      this.searchQuery = response.data.email;
    }

    this.cdr.markForCheck();
  }

  private buildHistoryQueryLabel(response: SearchResponse): string | null {
    const countryCode = response.data?.country_code;
    const phone = response.data?.phone;
    const email = response.data?.email;

    if (email) {
      return email;
    }

    if (phone) {
      if (countryCode && phone.startsWith(countryCode)) {
        return `${countryCode} ${phone.slice(countryCode.length)}`.trim();
      }
      if (countryCode) {
        return `${countryCode} ${phone}`.trim();
      }
      return phone;
    }

    return null;
  }

  private getConfigInputType(): 'text' | 'number' | 'email' | 'bank' | 'ip' | 'imei' {
    const configId = this.selectedOption?.child?.id || this.selectedOption?.parent?.id;
    const config = configId ? this.menuItemConfigs[configId] : null;
    if (config?.inputType === 'email') {
      return 'email';
    }
    if (config?.inputType === 'number') {
      return 'number';
    }
    if (config?.inputType === 'bank') {
      return 'bank';
    }
    if (config?.inputType === 'ip') {
      return 'ip';
    }
    if (config?.inputType === 'imei') {
      return 'imei';
    }
    return 'text';
  }

  private isValidInput(value: string): boolean {
    if (!value) {
      return false;
    }
    if (this.currentInputType === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    if (this.currentInputType === 'number') {
      return /^\+?\d+$/.test(value);
    }
    if (this.currentInputType === 'bank') {
      return true;
    }
    if (this.currentInputType === 'ip') {
      return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(value);
    }
    if (this.currentInputType === 'imei') {
      return /^\d{15}$/.test(value);
    }
    return true;
  }

  private getValidationMessage(): string {
    if (this.currentInputType === 'email') {
      return 'Please enter a valid email address.';
    }
    if (this.currentInputType === 'number') {
      return 'Please enter a valid number.';
    }
    if (this.currentInputType === 'bank') {
      return 'Please enter bank account details.';
    }
    if (this.currentInputType === 'ip') {
      return 'Please enter a valid IP address.';
    }
    if (this.currentInputType === 'imei') {
      return 'Please enter a valid 15-digit IMEI.';
    }
    return 'Please enter a valid value.';
  }

  private getLeakedDataBody(): SearchRequest | undefined {
    const parentValue = this.selectedOption?.parent?.value;
    const childValue = this.selectedOption?.child?.value;
    if (parentValue !== 'leaked-data' || !childValue) {
      return undefined;
    }

    const rawQuery = this.searchQuery.trim();
    if (childValue === 'email') {
      return { query_type: 'email', query_data: rawQuery };
    }
    if (childValue === 'mobile') {
      return {
        query_type: 'mobile',
        query_data: rawQuery,
        country_code: this.searchCountryCode,
      };
    }
    if (childValue === 'username') {
      return { query_type: 'username', query_data: rawQuery };
    }
    if (childValue === 'keyword') {
      return { query_type: 'keyword', query_data: rawQuery };
    }
    return undefined;
  }

  requiresDob(): boolean {
    return this.selectedOption?.child?.value === 'driving-license';
  }

  private isValidBankInput(): boolean {
    const account = this.bankAccountNumber.trim();
    const ifsc = this.bankIfscCode.trim();
    if (!/^\d{9,18}$/.test(account)) {
      return false;
    }
    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(ifsc)) {
      return false;
    }
    return true;
  }

  private getBankValidationMessage(): string {
    const account = this.bankAccountNumber.trim();
    if (!/^\d{9,18}$/.test(account)) {
      return 'Bank Account Number must be 9 to 18 digits.';
    }
    return 'Please enter a valid IFSC code.';
  }

  get showAccountNumberError(): boolean {
    if (!this.showBankErrors) {
      return false;
    }
    return !/^\d{9,18}$/.test(this.bankAccountNumber.trim());
  }

  get showIfscError(): boolean {
    if (!this.showBankErrors) {
      return false;
    }
    return !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(this.bankIfscCode.trim());
  }

  get reportForLabel(): string {
    const data = this.searchResponse?.data;
    if (!data) {
      return '';
    }
    if (data.phone) {
      if (data.country_code && data.phone.startsWith(data.country_code)) {
        return `${data.country_code} ${data.phone.slice(data.country_code.length)}`.trim();
      }
      if (data.country_code) {
        return `${data.country_code} ${data.phone}`.trim();
      }
      return data.phone;
    }
    return data.email || '';
  }

  get reportTypeLabel(): string {
    if (this.historyQueryType) {
      return this.historyQueryType;
    }
    if (this.selectedOption?.child?.label) {
      return this.selectedOption.child.label;
    }
    return this.selectedOption?.parent?.label || 'OSINT Investigation Report';
  }

  get requestedByLabel(): string {
    const user = this.appState.user();
    if (user?.phone) {
      return user.phone;
    }
    if (user?.email) {
      return user.email;
    }
    return 'Unknown';
  }

  formatReportDate(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }
}
