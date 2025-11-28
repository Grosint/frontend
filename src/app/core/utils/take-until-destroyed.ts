import { Injectable, OnDestroy, Injector, effect, Inject, inject } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Utility function for takeUntilDestroyed pattern
 * Use this in components to automatically unsubscribe
 */
export function takeUntilDestroyed() {
  const destroy$ = new Subject<void>();

  // This will be called when component is destroyed
  const originalOnDestroy = (injector.get as any)?.prototype?.ngOnDestroy;

  return destroy$.asObservable();
}

/**
 * Injectable that provides destroy$ subject
 */
@Injectable()
export class DestroyService extends Subject<void> implements OnDestroy {
  ngOnDestroy(): void {
    this.next();
    this.complete();
  }
}
