import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
export function noSpaceAllowedValidator(): ValidatorFn {

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value !=null && value.indexOf(' ')!= -1) {
      return {noSpaceAllowed: true};
    }
    return null;
  }
}
