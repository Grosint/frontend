import { Directive, ElementRef, Input, OnInit, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true,
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad?: string;
  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const img = this.el.nativeElement;

    // Set loading attribute for native lazy loading
    this.renderer.setAttribute(img, 'loading', 'lazy');

    // Use Intersection Observer for better browser support
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage();
              this.observer?.unobserve(img);
            }
          });
        },
        { rootMargin: '50px' }
      );
      this.observer.observe(img);
    } else {
      // Fallback for older browsers
      this.loadImage();
    }
  }

  private loadImage(): void {
    const img = this.el.nativeElement;
    if (this.appLazyLoad && !img.src) {
      this.renderer.setAttribute(img, 'src', this.appLazyLoad);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
