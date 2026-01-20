import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { take } from 'rxjs/operators';

type EmailType = 'government' | 'personal';

@Component({
  selector: 'app-register-email',
  standalone: false,
  templateUrl: './register-email.component.html',
  styleUrls: ['./register-email.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterEmailComponent implements OnInit {
  emailForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  emailType: EmailType = 'personal';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.govEmailValidator.bind(this)]],
    });
  }

  ngOnInit(): void {
    const storedType = localStorage.getItem('pre_signup_email_type');
    if (storedType !== 'government' && storedType !== 'personal') {
      this.router.navigate(['/auth/register']);
      return;
    }

    this.emailType = storedType;
    this.emailForm.get('email')?.updateValueAndValidity();
  }

  get isGovernmentEmail(): boolean {
    return this.emailType === 'government';
  }

  get emailLabel(): string {
    return this.isGovernmentEmail ? 'Government Email' : 'Personal Email';
  }

  get helperText(): string {
    return this.isGovernmentEmail ? 'Must end with @gov.in' : 'Manual verification required';
  }

  onSubmit(): void {
    if (this.emailForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const email = this.emailForm.get('email')?.value as string;

    this.auth
      .sendOtp(email)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.cdr.markForCheck();

          if (!response?.success) {
            const message = response?.message || 'Failed to send OTP. Please try again.';
            this.errorMessage = message;
            this.snackBar.open(message, 'Dismiss', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
            return;
          }

          localStorage.setItem('pre_signup_email', email);
          localStorage.setItem('pre_signup_email_verified', 'false');

          const message = response?.message || 'OTP sent successfully!';
          this.snackBar.open(message, 'OK', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          this.router.navigate(['/auth/register/otp']);
        },
        error: error => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'Failed to send OTP. Please try again.';
          this.cdr.markForCheck();
          this.snackBar.open(this.errorMessage, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/auth/register']);
  }

  private govEmailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value as string;
    if (this.isGovernmentEmail && email && !email.toLowerCase().endsWith('@gov.in')) {
      return { govEmailRequired: true };
    }
    return null;
  }
}
