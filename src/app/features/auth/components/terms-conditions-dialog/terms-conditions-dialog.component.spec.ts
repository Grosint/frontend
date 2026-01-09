import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UiModule } from '@ui/ui.module';
import { TermsConditionsDialogComponent } from './terms-conditions-dialog.component';

describe('TermsConditionsDialogComponent', () => {
  let component: TermsConditionsDialogComponent;
  let fixture: ComponentFixture<TermsConditionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TermsConditionsDialogComponent],
      imports: [NoopAnimationsModule, MatIconModule, MatButtonModule, UiModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsConditionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
