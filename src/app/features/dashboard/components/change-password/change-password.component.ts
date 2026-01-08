import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent implements OnInit {
  @Output() closeForm = new EventEmitter<void>();

  changePasswordForm: FormGroup = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage = '';
  lastAttemptedPassword = '';

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Add password match validator
    this.changePasswordForm
      .get('confirmPassword')
      ?.setValidators([Validators.required, this.passwordMatchValidator.bind(this)]);

    // Re-validate confirmPassword when newPassword changes
    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.changePasswordForm.get('confirmPassword')?.updateValueAndValidity();
      // Clear error message when user starts typing
      if (this.errorMessage) {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }
    });

    // Clear error and re-enable button when current password changes
    this.changePasswordForm.get('currentPassword')?.valueChanges.subscribe((newValue: string) => {
      // If there's an error and the current password has changed from the last attempted value
      if (this.errorMessage && newValue !== this.lastAttemptedPassword) {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }
    });
  }

  passwordMatchValidator(control: FormControl): { [key: string]: boolean } | null {
    const newPassword = this.changePasswordForm?.get('newPassword')?.value;
    const confirmPassword = control.value;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  cancelChangePassword(): void {
    this.changePasswordForm.reset();
    this.lastAttemptedPassword = '';
    this.errorMessage = '';
    this.isLoading = false;
    this.closeForm.emit();
    this.cdr.markForCheck();
  }

  savePassword(): void {
    if (this.changePasswordForm.invalid || this.isLoading || this.isButtonDisabled()) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    const formValue = this.changePasswordForm.value;
    this.lastAttemptedPassword = formValue.currentPassword;

    this.auth
      .changePassword({
        current_password: formValue.currentPassword,
        new_password: formValue.newPassword,
      })
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.changePasswordForm.reset();
          this.cdr.markForCheck();
          // Show success message from API response
          const message = response.message || 'Password changed successfully!';
          this.snackBar.open(message, 'OK', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          // Emit close event to parent
          this.closeForm.emit();
        },
        error: error => {
          this.isLoading = false;
          this.errorMessage =
            error.message ||
            error?.error?.message ||
            'Failed to change password. Please try again.';
          this.cdr.markForCheck();
          this.snackBar.open(this.errorMessage, 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }

  isButtonDisabled(): boolean {
    // Disable if there's an error and current password hasn't changed
    if (this.errorMessage && this.lastAttemptedPassword) {
      const currentPasswordValue = this.changePasswordForm.get('currentPassword')?.value || '';
      if (currentPasswordValue === this.lastAttemptedPassword) {
        return true; // Still the same password that caused error
      }
    }
    return false;
  }
}
