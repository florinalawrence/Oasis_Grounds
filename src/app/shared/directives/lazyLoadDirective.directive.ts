import { Directive, ElementRef, inject, DestroyRef, afterNextRender } from '@angular/core';


@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective {
  
  
  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly destroyRef = inject(DestroyRef);
  
  private observer?: IntersectionObserver;

  constructor() {
   
    
    afterNextRender(() => {
      this.initIntersectionObserver();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

 
  
  private initIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px', 
      threshold: 0.01
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadImage(entry.target as HTMLImageElement);
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }


  
  private loadImage(img: HTMLImageElement): void {
    const dataSrc = img.getAttribute('data-src');
    
    if (dataSrc) {
      img.classList.add('lazy-loading');
      
      img.src = dataSrc;
      
      img.onload = () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
      };
      
      img.onerror = () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
      };
      
      img.removeAttribute('data-src');
      
      if (this.observer) {
        this.observer.unobserve(img);
      }
    }
  }


  
  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}