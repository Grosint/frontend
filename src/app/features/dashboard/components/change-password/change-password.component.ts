import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
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
export class ChangePasswordComponent {
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

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    // Add password match validator
    this.changePasswordForm
      .get('confirmPassword')
      ?.setValidators([Validators.required, this.passwordMatchValidator.bind(this)]);
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
    this.closeForm.emit();
    this.cdr.markForCheck();
  }

  savePassword(): void {
    if (this.changePasswordForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const formValue = this.changePasswordForm.value;
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
          this.cdr.markForCheck();
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            'Failed to change password. Please try again.';
          this.snackBar.open(errorMessage, 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }
}
