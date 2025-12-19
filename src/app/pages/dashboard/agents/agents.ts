import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

interface Agent {
  id: number;
  name: string;
  description: string;
  image: string;
  socialLinks: {
    facebook?: string;
    website?: string;
  };
  isCenter?: boolean;
}

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agents.html',
  styleUrl: './agents.scss',
})
export class Agents implements OnInit {
  // dependency injection using inject()
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  // signals for reactive state management
  readonly agents = signal<Agent[]>([
    {
      id: 1,
      name: 'Oasis Engineering',
      description: 'Over the last 20 years, we have established ourselves as the "Most Respected and Trusted company" in the field of general contracting in Oman.',
      image: 'assets/images/agents/grid/oasis_engineering.jpg',
      socialLinks: {
        facebook: 'https://www.facebook.com/oasisgracellc',
        website: 'https://oasisgrace.com/'
      }
    },
    {
      id: 2,
      name: 'Oasis Grace Oman',
      description: 'Over the last 20 years, we have established ourselves as the "Most Respected and Trusted company" in the field of general contracting in Oman.',
      image: 'assets/images/agents/grid/oasis-grace-oman.jpg',
      socialLinks: {
        facebook: 'https://www.facebook.com/oasisgracellc',
        website: 'https://oasisgrace.com/'
      },
      isCenter: true
    },
    {
      id: 3,
      name: 'JMR Nanjil',
      description: 'JMR Nanjil is a group of talented engineers and architects creating innovative architectural designs that meet international quality standards',
      image: '../../../../assets/images/agent-1.png',
      socialLinks: {
        facebook: 'https://www.facebook.com/nanjilproperties'
      }
    }
  ]);

  readonly isLoading = signal<boolean>(false);

  // Computed signals for enhanced functionality
  readonly pageMetadata = computed(() => ({
    title: 'Trusted Agents - JMR Real Estate',
    description: 'Meet our trusted team of real estate agents ready to serve you diligently. Discover why they are your ideal partners in your real estate journey.',
    keywords: 'trusted agents, real estate agents, JMR Real Estate, property experts, real estate professionals'
  }));

  readonly totalAgents = computed(() => this.agents().length);
  readonly centerAgent = computed(() => this.agents().find(agent => agent.isCenter));
  readonly sideAgents = computed(() => this.agents().filter(agent => !agent.isCenter));

  ngOnInit(): void {
    this.setupPageMetadata();
    this.scrollToTop();
  }

 
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
    window.scrollTo(0, 0);
  }

  /**
   * Handle social link clicks with analytics tracking
   */
  onSocialLinkClick(agent: Agent, platform: string): void {
    // Could add analytics tracking here
    console.log(`Social link clicked: ${agent.name} - ${platform}`);
  }

  /**
   * Track agent card interactions
   */
  onAgentCardClick(agent: Agent): void {
    console.log(`Agent card clicked: ${agent.name}`);
  }
}
