import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyLoadImageDirective } from './directives/lazy-load-image.directive';
import { TouchOptimizedDirective } from './directives/touch-optimized.directive';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

@NgModule({
  declarations: [],
  imports: [CommonModule, LazyLoadImageDirective, TouchOptimizedDirective, SafeHtmlPipe],
  exports: [CommonModule, LazyLoadImageDirective, TouchOptimizedDirective, SafeHtmlPipe],
})
export class SharedModule {}
