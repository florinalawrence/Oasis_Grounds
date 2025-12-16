import { Directive, ElementRef, inject, DestroyRef, afterNextRender } from '@angular/core';


@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective {
  //  dependency injection
  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly destroyRef = inject(DestroyRef);
  
  private observer?: IntersectionObserver;

  constructor() {
    // Initialize after next render (ensures browser environment)
    afterNextRender(() => {
      this.initIntersectionObserver();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Initialize IntersectionObserver to watch for element visibility
   */
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

  /**
   * Load the image by setting src from data-src
   */
  private loadImage(img: HTMLImageElement): void {
    const dataSrc = img.getAttribute('data-src');
    
    if (dataSrc) {
      // Optional: Add loading class for fade-in effect
      img.classList.add('lazy-loading');
      
      img.src = dataSrc;
      
      // Optional: Handle load success
      img.onload = () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
      };
      
      // Optional: Handle load error
      img.onerror = () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
      };
      
      // Remove data-src attribute after loading
      img.removeAttribute('data-src');
      
      // Stop observing this element
      if (this.observer) {
        this.observer.unobserve(img);
      }
    }
  }

  /**
   * Cleanup observer on directive destroy
   */
  private cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}