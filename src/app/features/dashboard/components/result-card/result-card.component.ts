import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SearchResultItem } from '../../models/search.model';

@Component({
  selector: 'app-result-card',
  standalone: false,
  templateUrl: './result-card.component.html',
  styleUrls: ['./result-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCardComponent {
  @Input() result!: SearchResultItem;
  @Input() index: number = 0;
  @Input() groupKey?: string;

  get displayValue(): string {
    if (this.result.found === false) {
      return 'Not Found';
    }
    if (this.result.value === null || this.result.value === undefined) {
      return '-';
    }
    if (this.result.value === '') {
      return '-';
    }
    return this.result.value;
  }

  get showCompactValueOnly(): boolean {
    return this.groupKey === 'name' || this.groupKey === 'email';
  }

  get isImageResult(): boolean {
    return this.result.category?.toLowerCase() === 'image';
  }

  get imageSrc(): string | null {
    if (!this.isImageResult) {
      return null;
    }
    const value = this.result.value;
    if (!value || value.toLowerCase() === 'not available') {
      return null;
    }
    return value ?? '-';
  }

  get showSource(): boolean {
    return this.result.showSource !== false && !!this.result.source;
  }

  get categoryClass(): string {
    return this.result.category?.toLowerCase() || 'default';
  }
}
