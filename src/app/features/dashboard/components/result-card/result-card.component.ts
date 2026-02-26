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

  get displayValue(): string {
    if (this.result.found === false) {
      return 'Not Found';
    }
    return this.result.value || 'N/A';
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
    return value;
  }

  get showSource(): boolean {
    return this.result.showSource !== false && !!this.result.source;
  }

  get categoryClass(): string {
    return this.result.category?.toLowerCase() || 'default';
  }
}
