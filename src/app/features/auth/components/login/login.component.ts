import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { take } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      countryCode: ['+91', [Validators.required, Validators.pattern(/^\+\d{1,4}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,12}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.auth.isAuthenticated()) {
      this.redirectToDashboard();
      return;
    }

    // Check if coming from OTP verification and autofill phone only
    const fromOtp = localStorage.getItem('from_otp_verification');
    const fromSignup = localStorage.getItem('from_signup');

    if (fromOtp === 'true' || fromSignup === 'true') {
      const phone = localStorage.getItem('pending_verification_phone');
      if (phone) {
        let countryCode = this.loginForm.get('countryCode')?.value || '+91';
        let phoneNumber = phone;

        if (phone.startsWith('+')) {
          const match = phone.match(/^(\+\d{1,4})(\d{10,12})$/);
          if (match) {
            countryCode = match[1];
            phoneNumber = match[2];
          }
        }

        // Only autofill phone, NOT password
        this.loginForm.patchValue({
          countryCode,
          phone: phoneNumber,
          // Password field left empty for security
        });

        // Clear the flags
        localStorage.removeItem('from_otp_verification');
        localStorage.removeItem('from_signup');
        // Keep email in case user navigates away and comes back
        // Or clear it: localStorage.removeItem('pending_verification_phone');

        this.cdr.markForCheck();
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const { countryCode, phone, password } = this.loginForm.value;
    const fullPhone = `${countryCode}${phone}`;

    this.auth
      .login({ phone: fullPhone, password })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.markForCheck();
          this.redirectToDashboard();
        },

        error: error => {
          this.isLoading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'Login failed. Please try again.';
          this.cdr.markForCheck();

          this.snackBar.open(this.errorMessage, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }

  private redirectToDashboard(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigate([returnUrl]);
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPhonePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!/^\d+$/.test(pasted)) {
      event.preventDefault();
    }
  }
}
