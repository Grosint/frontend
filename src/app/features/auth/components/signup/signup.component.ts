import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { take } from 'rxjs/operators';
import { passwordMatchValidator } from '@shared/validators/pass-match.validator';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar // Add this
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,12}$/)]],
      verifyByGovId: [false],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        ],
      ],
      confirmPassword: ['', [Validators.required, passwordMatchValidator]],
      userType: ['user', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      pinCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      state: ['', [Validators.required]],
      organizationId: [null],
      orgName: [null],
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.isLoading || this.signupForm.invalid) {
      this.markFormGroupTouched(this.signupForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const formValue = this.signupForm.value;

    const { confirmPassword, ...restFormValue } = formValue;
    const signupData = {
      ...restFormValue,
      organizationId: formValue.organizationId || null,
      orgName: formValue.orgName || null,
    };

    this.auth
      .signup(signupData)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.errorMessage = '';
          this.cdr.markForCheck();

          // Store email and form data for autofill after OTP verification
          localStorage.setItem('pending_verification_email', formValue.email);
          localStorage.setItem('from_signup', 'true'); // Flag to indicate coming from signup

          this.router.navigate(['/auth/verify-otp']);
        },
        error: error => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorMessage =
            error?.error?.message || error?.message || 'Signup failed. Please try again.';

          this.snackBar.open(this.errorMessage, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
