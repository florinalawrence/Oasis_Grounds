import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

interface AboutContent {
  title: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);


  readonly isLoading = signal(false);
  readonly currentYear = signal(new Date().getFullYear());
  
 
  readonly aboutContent = signal<AboutContent[]>([
    {
      title: 'Security',
      description: 'We use commercially reasonable security measures to protect the loss,misuse and alteration of the information under our control. If you use this site, you are responsible for maintaining your account and password.'
    },
    {
      title: 'Perfect Tools',
      description: 'Personal information will be used to allow you to login to your account on Site or to resolve specific service issues, inform you of our new services or features and to communicate with you in relation to your use of the Site.'
    },
    {
      title: 'Search in Click',
      description: 'The search response will include a list of locations. You can send a Place Details request for more information about any of the places in the response.You\'ll see search results as red mini-pins or red dots.'
    }
  ]);

  // Computed signal for page metadata
  readonly pageMetadata = computed(() => ({
    title: `About US - Oasis Grounds`,
    description: 'Learn more about Oasis Grounds - Security, Perfect Tools, and Search in Click features.',
    keywords: 'about, oasis grounds, security, tools, search'
  }));

  ngOnInit(): void {
    this.setupPageMetadata();
    this.scrollToTop();
  }

  /**
   * Setup page metadata for SEO (Angular 20 feature)
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
   * Navigate to home page 
   */
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Get about content 
   */
  getAboutContent(): AboutContent[] {
    return this.aboutContent();
  }
}
