import { Directive, ElementRef, HostListener, inject } from '@angular/core';


@Directive({
  selector: 'input[type="number"][appDisableNumberScroll]',
  standalone: true
})
export class DisableNumberScrollDirective {
 
  
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

 
  
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
  }

 
  
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }

 
  
  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }
}