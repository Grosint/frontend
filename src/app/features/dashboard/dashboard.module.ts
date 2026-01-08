import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { UiModule } from '@ui/ui.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SearchPanelComponent } from './components/search-panel/search-panel.component';
import { ResultCardComponent } from './components/result-card/result-card.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { EditProfileComponent } from './components/edit-profile/edit-profile.component';
import { BuyCreditsComponent } from './components/buy-credits/buy-credits.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'profile',
        component: UserProfileComponent,
      },
      {
        path: 'buy-credits',
        component: BuyCreditsComponent,
      },
    ],
  },
];

@NgModule({
  declarations: [
    DashboardLayoutComponent,
    DashboardHeaderComponent,
    DashboardComponent,
    NavbarComponent,
    SearchPanelComponent,
    ResultCardComponent,
    UserProfileComponent,
    ChangePasswordComponent,
    EditProfileComponent,
    BuyCreditsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    UiModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
})
export class DashboardModule {}
