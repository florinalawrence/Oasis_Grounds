import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export function digitsLengthValidator(minLength: number, maxLength: number): ValidatorFn {

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && !value.match(/^\d{3,12}$/)) {
      return { 'digitsLength': { minLength, maxLength, actualLength: value.length } };
    }
    return null;
  };
}