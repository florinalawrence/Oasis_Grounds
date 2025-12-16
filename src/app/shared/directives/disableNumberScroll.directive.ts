import { Directive, ElementRef, HostListener, inject } from '@angular/core';


@Directive({
  selector: 'input[type="number"][appDisableNumberScroll]',
  standalone: true
})
export class DisableNumberScrollDirective {
  //dependency injection
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  /**
   * Prevent mouse wheel from changing number input value
   */
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
  }

  /**
   * Prevent arrow keys from changing number input value on keydown
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }

  /**
   * Prevent arrow keys from changing number input value on keyup
   */
  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }
}