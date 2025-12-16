import { AbstractControl, ValidationErrors } from "@angular/forms";

export function fileExtensionValidator(allowedFormats: string[]) {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;
    if (typeof file === 'string' && file) {
      const fileExtension = file.split('.').pop()?.toLowerCase() || '';
      if (!allowedFormats.includes(fileExtension)) {
        return { fileFormat: true };
      }
    }
    return null;
  };
}
