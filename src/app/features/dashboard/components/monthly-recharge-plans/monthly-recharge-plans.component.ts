import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MonthlyPlan } from '../buy-credits/buy-credits.component';

@Component({
  selector: 'app-monthly-recharge-plans',
  standalone: false,
  templateUrl: './monthly-recharge-plans.component.html',
  styleUrls: ['./monthly-recharge-plans.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyRechargePlansComponent {
  @Input() plans: MonthlyPlan[] = [];
  @Input() selectedPlan: MonthlyPlan | null = null;
  @Output() planSelected = new EventEmitter<MonthlyPlan>();
  @Output() subscribeClicked = new EventEmitter<MonthlyPlan>();

  selectPlan(plan: MonthlyPlan): void {
    this.planSelected.emit(plan);
  }

  onSubscribe(plan: MonthlyPlan, event: Event): void {
    event.stopPropagation();
    this.subscribeClicked.emit(plan);
  }
}
