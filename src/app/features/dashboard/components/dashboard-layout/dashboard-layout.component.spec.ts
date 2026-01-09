import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterModule } from '@angular/router';
import { DashboardLayoutComponent } from './dashboard-layout.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';
import { AppStateStore } from '@core/services/app-state.store';
import { UiModule } from '@ui/ui.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DashboardLayoutComponent', () => {
  let component: DashboardLayoutComponent;
  let fixture: ComponentFixture<DashboardLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardLayoutComponent, DashboardHeaderComponent],
      imports: [RouterModule, UiModule, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AppStateStore, useValue: { user: () => null } }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
