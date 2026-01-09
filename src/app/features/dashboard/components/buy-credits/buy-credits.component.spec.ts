import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BuyCreditsComponent } from './buy-credits.component';
import { MonthlyRechargePlansComponent } from '../monthly-recharge-plans/monthly-recharge-plans.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BuyCreditsComponent', () => {
  let component: BuyCreditsComponent;
  let fixture: ComponentFixture<BuyCreditsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BuyCreditsComponent, MonthlyRechargePlansComponent],
      imports: [NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BuyCreditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
