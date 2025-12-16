import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Password match validator function
 * Validates that confirmPassword matches password field
 */
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('password')?.value;
  const confirmPassword = control.value;

  // If either field is empty, don't validate yet (let required validator handle it)
  if (!password || !confirmPassword) {
    return null;
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
}
