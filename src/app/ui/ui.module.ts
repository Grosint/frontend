import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './components/button/button.component';

const UI_COMPONENTS = [
  ButtonComponent
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ...UI_COMPONENTS
  ],
  exports: [
    ...UI_COMPONENTS
  ]
})
export class UiModule { }
