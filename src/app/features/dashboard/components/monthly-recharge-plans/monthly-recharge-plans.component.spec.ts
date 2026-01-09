import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthlyRechargePlansComponent } from './monthly-recharge-plans.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MonthlyRechargePlansComponent', () => {
  let component: MonthlyRechargePlansComponent;
  let fixture: ComponentFixture<MonthlyRechargePlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonthlyRechargePlansComponent],
      imports: [NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyRechargePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
