import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@core/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-verify-otp',
  standalone: false,
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtpComponent implements OnInit {
  otpForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  email = '';
  isResending = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });
  }

  ngOnInit(): void {
    this.email = localStorage.getItem('pending_verification_phone') || '';

    if (!this.email) {
      this.router.navigate(['/auth/register']);
    }
  }

  onSubmit(): void {
    if (this.otpForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const otp = this.otpForm.get('otp')?.value;

    this.auth
      .verifyOtp({ email: this.email, otp })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.markForCheck();

          // Show success toast
          this.snackBar.open('User created successfully!', 'OK', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          // Set flag to autofill login fields
          localStorage.setItem('from_otp_verification', 'true');

          // Clear pending email
          localStorage.removeItem('pending_verification_phone');

          // Navigate to dashboard
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 1000); // Small delay to show toast
        },
        error: error => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'OTP verification failed. Please try again.';
          this.cdr.markForCheck();

          this.snackBar.open(this.errorMessage, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }

  resendOtp(): void {
    // Prevent multiple simultaneous resend requests
    if (this.isResending || !this.email) {
      return;
    }

    this.isResending = true;
    this.cdr.markForCheck();

    this.auth
      .resendOtp(this.email)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isResending = false;
          this.cdr.markForCheck();

          const message = response?.message || 'OTP has been resent successfully!';
          this.snackBar.open(message, 'OK', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
        error: error => {
          this.isResending = false;
          this.cdr.markForCheck();

          const errorMessage =
            error?.error?.message || error?.message || 'Failed to resend OTP. Please try again.';

          this.snackBar.open(errorMessage, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }
}
