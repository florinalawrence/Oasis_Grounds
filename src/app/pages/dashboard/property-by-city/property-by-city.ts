import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

interface CityData {
  id: number;
  name: string;
  imagePath: string;
  altText: string;
}

@Component({
  selector: 'app-property-by-city',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-by-city.html',
  styleUrl: './property-by-city.scss',
})
export class PropertyByCity implements OnInit {
  
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);


  readonly cities = signal<CityData[]>([
    {
      id: 1,
      name: 'Chennai',
      imagePath: '../../../../assets/images/properties/city/2.jpg',
      altText: 'Chennai Property'
    },
    {
      id: 2,
      name: 'Muscat',
      imagePath: '../../../../assets/images/properties/city/1.jpg',
      altText: 'Muscat Property'
    },
    {
      id: 3,
      name: 'Tuticorin',
      imagePath: '../../../../assets/images/properties/city/3.jpg',
      altText: 'Tuticorin Property'
    },
    {
      id: 4,
      name: 'Bangalore',
      imagePath: '../../../../assets/images/properties/city/4.jpg',
      altText: 'Bangalore Property'
    }
  ]);

 
  readonly pageMetadata = computed(() => ({
    title: 'Properties by City - JMR Real Estate',
    description: 'Explore properties in Chennai, Muscat, Tuticorin, and Bangalore. Find your perfect property in top cities.',
    keywords: 'properties by city, Chennai properties, Muscat properties, Tuticorin properties, Bangalore properties'
  }));

  readonly totalCities = computed(() => this.cities().length);

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
}
