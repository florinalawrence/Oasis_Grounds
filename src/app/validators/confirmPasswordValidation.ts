import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function matchPasswordValidator(controlName: string, checkControlName: string): ValidatorFn {
  return (controls: AbstractControl): ValidationErrors | null => {
    const control = controls.get(controlName);
    const checkControl = controls.get(checkControlName);

    // If checkControl has validation errors and is not matching, or has no value, return null
    if (checkControl?.errors && !checkControl.errors['matching'] && !checkControl?.value?.length) {
      return null;
    }

    // Check minimum length for the second control
    if (checkControl?.value?.length > 6) {
      controls.get(checkControlName)?.setErrors({ minLength: true });
    }

    // Check if the values are not matching
    if (control?.value !== checkControl?.value) {
      controls.get(checkControlName)?.setErrors({ matching: true });
      return { matching: true }; // Return the matching error
    } else {
      return null; // Return null if the values match
    }
  };
}
