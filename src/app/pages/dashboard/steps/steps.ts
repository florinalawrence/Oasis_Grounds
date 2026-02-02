import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

interface Step {
  id: number;
  title: string;
  description: string;
  iconPath: string;
  altText: string;
  order: number;
}

@Component({
  selector: 'app-steps',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './steps.html',
  styleUrl: './steps.scss',
})
export class Steps implements OnInit {
  
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  
  readonly steps = signal<Step[]>([
    {
      id: 1,
      title: 'Search For Real Estates',
      description: 'To pursue this, we provide credentials through Register and Login.',
      iconPath: 'assets/images/features/icons/5.png',
      altText: 'Search icon',
      order: 1
    },
    {
      id: 2,
      title: 'Select Your Favorite',
      description: 'Choose your favorites among these properties using the Properties page.',
      iconPath: 'assets/images/features/icons/6.png',
      altText: 'Select icon',
      order: 2
    },
    {
      id: 3,
      title: 'Take Your Key',
      description: 'Contact our clients or customers directly through the Contact page.',
      iconPath: 'assets/images/features/icons/7.png',
      altText: 'Key icon',
      order: 3
    }
  ]);

  
  readonly pageMetadata = computed(() => ({
    title: 'Simple Steps - JMR Real Estate | How to Find Your Property',
    description: 'Follow our simple 3-step process to find your dream property: Search for real estates, select your favorite, and take your key.',
    keywords: 'property search steps, real estate process, find property, JMR Real Estate steps'
  }));

  readonly totalSteps = computed(() => this.steps().length);
  readonly orderedSteps = computed(() => 
    this.steps().sort((a, b) => a.order - b.order)
  );

  ngOnInit(): void {
    this.setupPageMetadata();
    this.scrollToTop();
  }

  /**
   * Setup page metadata for SEO
   */
  private setupPageMetadata(): void {
    const metadata = this.pageMetadata();
    
    this.title.setTitle(metadata.title);
    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  /**
   * Scroll to top of page
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handle image loading error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/no_image.png';
  }

  /**
   * Get step number display
   */
  getStepNumber(step: Step): string {
    return `Step ${step.order}`;
  }

  /**
   * Check if step is the last one
   */
  isLastStep(step: Step): boolean {
    return step.order === this.totalSteps();
  }
}
