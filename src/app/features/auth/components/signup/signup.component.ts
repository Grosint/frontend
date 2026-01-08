import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { take } from 'rxjs/operators';
import { passwordMatchValidator } from '@shared/validators/pass-match.validator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TermsConditionsDialogComponent } from '../terms-conditions-dialog/terms-conditions-dialog.component';

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
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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
      address: [''],
      city: [''],
      pinCode: ['', [Validators.pattern(/^[0-9]{6}$/)]],
      state: [''],
      organizationId: [null],
      orgName: [null],
      termsAccepted: [false, [Validators.requiredTrue]],
    });

    this.addEmailValidator();

    this.signupForm.get('verifyByGovId')?.valueChanges.subscribe(() => {
      this.signupForm.get('email')?.updateValueAndValidity();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  private addEmailValidator(): void {
    const emailControl = this.signupForm.get('email');
    if (emailControl) {
      emailControl.setValidators([
        Validators.required,
        Validators.email,
        this.govEmailValidator.bind(this),
      ]);
    }
  }

  private govEmailValidator(control: AbstractControl): ValidationErrors | null {
    const verifyByGovId = this.signupForm.get('verifyByGovId')?.value;
    const email = control.value;

    if (verifyByGovId && email) {
      // If verifyByGovId is checked, email must end with .gov.in
      if (!email.toLowerCase().endsWith('.gov.in')) {
        return { govEmailRequired: true };
      }
    }

    return null;
  }

  get verifyByGovId(): boolean {
    return this.signupForm.get('verifyByGovId')?.value || false;
  }

  openTermsModal(): void {
    const dialogRef = this.dialog.open(TermsConditionsDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'terms-dialog',
      backdropClass: 'terms-dialog-backdrop',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((accepted: boolean) => {
      if (accepted) {
        // User accepted terms, check the checkbox
        this.signupForm.patchValue({ termsAccepted: true });
        this.cdr.markForCheck();
      }
      // If declined, checkbox remains unchecked
    });
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

    // Remove confirmPassword from form value before sending
    const { confirmPassword, termsAccepted, ...restFormValue } = formValue;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void confirmPassword; // Explicitly mark as intentionally unused
    void termsAccepted; // Explicitly mark as intentionally unused

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
          localStorage.setItem('pending_verification_phone', formValue.email);
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
