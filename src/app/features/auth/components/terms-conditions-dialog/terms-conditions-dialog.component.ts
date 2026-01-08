import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import TermsDataJson from '../../../../../assets/data/terms-and-conditions.json';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface TermsContentItem {
  type: 'paragraph' | 'list' | 'encryption-option';
  text?: string;
  items?: string[];
  variant?: 'encrypted' | 'unencrypted';
  title?: string;
}

interface TermsSection {
  id: number;
  title: string;
  content: TermsContentItem[];
}

interface TermsData {
  title: string;
  sections: TermsSection[];
}

@Component({
  selector: 'app-terms-conditions-dialog',
  standalone: false,
  templateUrl: './terms-conditions-dialog.component.html',
  styleUrls: ['./terms-conditions-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsConditionsDialogComponent {
  termsData: TermsData = TermsDataJson as TermsData;

  constructor(
    private sanitizer: DomSanitizer,
    public dialogRef: MatDialogRef<TermsConditionsDialogComponent>
  ) {}

  onClose(): void {
    this.dialogRef.close(false);
  }

  onAccept(): void {
    this.dialogRef.close(true);
  }

  formatText(text: string): SafeHtml {
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
