import { Directive, HostListener, Renderer2, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTouchOptimized]',
  standalone: true
})
export class TouchOptimizedDirective {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.renderer.addClass(this.el.nativeElement, 'touch-active');
    // Prevent default to avoid double-tap zoom on iOS
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    setTimeout(() => {
      this.renderer.removeClass(this.el.nativeElement, 'touch-active');
    }, 150);
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(event: TouchEvent): void {
    this.renderer.removeClass(this.el.nativeElement, 'touch-active');
  }
}
