import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '@core/models/user.model';
import { take } from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  standalone: false,
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfileComponent implements OnInit {
  @Input() user: User | null = null;
  @Output() closeForm = new EventEmitter<void>();

  profileForm: FormGroup = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    address: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    pinCode: new FormControl('', [Validators.required]),
    state: new FormControl('', [Validators.required]),
    phone: new FormControl('', [Validators.required]),
  });

  isLoading = false;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Populate form with current user data
    if (this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        address: this.user.address || '',
        city: this.user.city || '',
        pinCode: this.user.pinCode || '',
        state: this.user.state || '',
        phone: this.user.phone || '',
      });
      this.cdr.markForCheck();
    }
  }

  cancelEdit(): void {
    this.profileForm.reset();
    this.closeForm.emit();
    this.cdr.markForCheck();
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const formValue = this.profileForm.value;
    this.auth
      .updateProfile({
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        address: formValue.address,
        city: formValue.city,
        pinCode: formValue.pinCode,
        state: formValue.state,
        phone: formValue.phone,
      })
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.isLoading = false;
          this.cdr.markForCheck();
          // Show success message from API response
          const message = response.message || 'Profile updated successfully!';
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
            'Failed to update profile. Please try again.';
          this.snackBar.open(errorMessage, 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        },
      });
  }
}
