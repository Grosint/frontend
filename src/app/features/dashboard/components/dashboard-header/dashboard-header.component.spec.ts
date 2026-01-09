import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardHeaderComponent } from './dashboard-header.component';
import { AppStateStore } from '@core/services/app-state.store';
import { UiModule } from '@ui/ui.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DashboardHeaderComponent', () => {
  let component: DashboardHeaderComponent;
  let fixture: ComponentFixture<DashboardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardHeaderComponent],
      imports: [UiModule, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AppStateStore, useValue: { user: () => null } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
