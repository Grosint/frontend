import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

// Utility function for takeUntilDestroyed pattern
// Use this in components to automatically unsubscribe
export function takeUntilDestroyed() {
  const destroy$ = new Subject<void>();

  return destroy$.asObservable();
}

// Injectable that provides destroy$ subject
@Injectable()
export class DestroyService extends Subject<void> implements OnDestroy {
  ngOnDestroy(): void {
    this.next();
    this.complete();
  }
}
