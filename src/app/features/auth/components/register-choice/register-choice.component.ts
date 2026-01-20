import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

type EmailType = 'government' | 'personal';

@Component({
  selector: 'app-register-choice',
  standalone: false,
  templateUrl: './register-choice.component.html',
  styleUrls: ['./register-choice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterChoiceComponent {
  constructor(private router: Router) {}

  selectEmailType(type: EmailType): void {
    localStorage.setItem('pre_signup_email_type', type);
    localStorage.removeItem('pre_signup_email');
    localStorage.setItem('pre_signup_email_verified', 'false');
    this.router.navigate(['/auth/register/email']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
