import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class PasswordValidators {
  constructor() {}

  static patternValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // If control is empty return no error
      if (!control.value) {
        return null;
      }

      // Test the value of the control against the regexp supplied
      const valid = regex.test(control.value);

      // If true, return no error (null), else return error passed in the second parameter
      return valid ? null : error;
    };
  }
}