import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateStore } from '@core/services/app-state.store';

export interface CreditPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  isPopular?: boolean;
}

export interface MonthlyPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  nextRenewal: string;
  features: string[];
}

@Component({
  selector: 'app-buy-credits',
  standalone: false,
  templateUrl: './buy-credits.component.html',
  styleUrls: ['./buy-credits.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyCreditsComponent {
  selectedPlan: CreditPlan | null = null;
  selectedMonthlyPlan: MonthlyPlan | null = null;
  currentBalance = 245; // TODO: Get from API or AppStateStore
  activeTab: 'buy' | 'payment' | 'transaction' = 'buy';

  plans: CreditPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      credits: 50,
      features: ['50 searches', 'Email support'],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 299,
      credits: 200,
      features: ['200 searches', 'Priority support', 'Export results'],
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 699,
      credits: 500,
      features: ['500 searches', '24/7 support', 'Export & Share'],
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      price: 999,
      credits: 1000,
      features: ['1000 searches', 'Dedicated support'],
    },
  ];

  monthlyPlans: MonthlyPlan[] = [
    {
      id: 'monthly-basic',
      name: 'Monthly Basic',
      price: 199,
      credits: 100,
      nextRenewal: '2025-01-15',
      features: ['100 credits/month', 'Auto renewal', 'Cancel anytime'],
    },
    {
      id: 'monthly-pro',
      name: 'Monthly Pro',
      price: 499,
      credits: 300,
      nextRenewal: '2025-01-15',
      features: ['300 credits/month', 'Auto renewal', 'Priority support'],
    },
  ];

  get user() {
    return this.appState.user();
  }

  constructor(
    public appState: AppStateStore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  selectPlan(plan: CreditPlan): void {
    this.selectedPlan = plan;
    this.cdr.markForCheck();
  }

  selectMonthlyPlan(plan: MonthlyPlan): void {
    this.selectedMonthlyPlan = plan;
    this.cdr.markForCheck();
  }

  buyNow(plan: CreditPlan): void {
    // TODO: Implement payment logic
    console.log('Buying plan:', plan);
    // Navigate to payment page or open payment modal
  }

  subscribeNow(plan: MonthlyPlan): void {
    // TODO: Implement subscription logic
    console.log('Subscribing to plan:', plan);
    // Navigate to payment page or open payment modal
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToCredits(): void {
    // Already on credits page
  }

  showUserInfo(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  setActiveTab(tab: 'buy' | 'payment' | 'transaction'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }
}
