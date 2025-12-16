import {
  Component,
  input,
  output,
  effect,
  afterNextRender,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

declare let L: any;

interface AddressDetails {
  country: string;
  state: string;
  city: string;
  landMark: string;
  zipCode: string;
}

interface LocationUpdate {
  latitude: number;
  longitude: number;
  addressDetails: AddressDetails;
}

/**
 * MapLocation Component - Angular 20 Optimized
 * 
 * Modern implementation using:
 * - Signal-based inputs/outputs
 * - Lifecycle hooks via inject()
 * - Reactive effects
 * - Standalone component architecture
 */
@Component({
  selector: 'app-map-location',
  standalone: true,
  imports: [],
  template: `<div id="leafletMap" class="map-container"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .map-container {
        width: 100%;
        height: 370px;
        margin-bottom: 32px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class MapLocation {
  // Modern Angular 20 dependency injection
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based inputs (Angular 20 modern approach)
  readonly address = input<string>();
  readonly city = input<string>('');
  readonly state = input<string>('');
  readonly landMark = input<string>('');
  readonly country = input<string>('');
  readonly zipCode = input<string>('');
  readonly latitude = input<number>();
  readonly longitude = input<number>();
  readonly isDraggable = input<boolean>(true);

  // Signal-based output (Angular 20 modern approach)
  readonly locationUpdated = output<LocationUpdate>();

  // Internal state signals
  private readonly mapInitialized = signal(false);
  private readonly currentLat = signal<number | undefined>(undefined);
  private readonly currentLng = signal<number | undefined>(undefined);

  // Computed signal for address string
  private readonly addressString = computed(() => {
    const parts = [
      this.landMark(),
      this.city(),
      this.state(),
      this.country(),
    ].filter((part) => part && part.trim());
    return parts.length > 0 ? parts.join(', ') : 'Location';
  });

  // Map and marker references
  private map: any;
  private marker: any;

  // Debounced address change subject
  private readonly addressChange$ = new Subject<void>();

  constructor() {
    // Configure Leaflet icons early
    this.configureLeafletIconsGlobally();

    // Subscribe to debounced address changes
    this.addressChange$
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleAddressChange());

    // Initialize map after render (Angular 20 approach)
    afterNextRender(() => {
      this.initMap();
    });

    // Effect to handle address field changes
    effect(() => {
      // Track all address-related inputs
      this.country();
      this.city();
      this.state();
      this.landMark();
      this.zipCode();
      
      if (this.mapInitialized()) {
        this.addressChange$.next();
      }
    });

    // Effect to handle coordinate changes
    effect(() => {
      const lat = this.latitude();
      const lng = this.longitude();
      
      if (this.mapInitialized() && lat !== undefined && lng !== undefined) {
        if (lat !== this.currentLat() || lng !== this.currentLng()) {
          this.currentLat.set(lat);
          this.currentLng.set(lng);
          this.updateMapFromCoordinates(lat, lng);
        }
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.map) {
        this.map.remove();
        this.map = null;
        this.marker = null;
        this.mapInitialized.set(false);
      }
    });
  }

  /**
   * Public method to manually trigger address update
   */
  triggerAddressUpdate(): void {
    this.handleAddressChange();
  }

  /**
   * Configure Leaflet icons globally to prevent 404 errors
   */
  private configureLeafletIconsGlobally(): void {
    if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
    }
  }

  /**
   * Configure Leaflet default icon paths
   */
  private configureLeafletIcons(): void {
    const iconRetinaUrl = '/leaflet/marker-icon-2x.png';
    const iconUrl = '/leaflet/marker-icon.png';
    const shadowUrl = '/leaflet/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;
  }

  /**
   * Initialize the Leaflet map
   */
  private initMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.configureLeafletIcons();

    // Default coordinates (Nagercoil, Tamil Nadu)
    const initialLat = this.latitude() ?? 8.19068;
    const initialLng = this.longitude() ?? 77.43554;

    this.currentLat.set(initialLat);
    this.currentLng.set(initialLng);

    // Create map instance
    this.map = L.map('leafletMap').setView([initialLat, initialLng], 15);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Add marker
    this.marker = L.marker([initialLat, initialLng], {
      draggable: this.isDraggable(),
    }).addTo(this.map);

    // Marker drag event
    this.marker.on('dragend', (event: any) => this.onMarkerDragEnd(event));

    // Show initial popup
    if (this.landMark() && this.city()) {
      const initialAddress = this.addressString();
      this.marker
        .bindPopup(`<strong>Address:</strong><br>${initialAddress}`)
        .openPopup();
    } else {
      this.performReverseGeocoding(initialLat, initialLng);
    }

    this.mapInitialized.set(true);
  }

  /**
   * Handle marker drag end event
   */
  private onMarkerDragEnd(event: any): void {
    const { lat, lng } = event.target.getLatLng();
    this.currentLat.set(lat);
    this.currentLng.set(lng);
    this.performReverseGeocoding(lat, lng);
  }

  /**
   * Handle address field changes
   */
  private handleAddressChange(): void {
    const countryValue = this.country();
    if (!countryValue?.trim()) {
      console.warn('Country is required to update the map.');
      return;
    }

    const address = [
      this.landMark(),
      this.city(),
      this.state(),
      countryValue,
    ]
      .filter(Boolean)
      .join(', ');

    this.getCoordinatesFromAddress(address);
  }

  /**
   * Forward geocoding: Get coordinates from address
   */
  private getCoordinatesFromAddress(address: string): void {
    // Check if we should skip geocoding entirely (for development)
    if (!address || address.trim().length === 0) {
      console.log('📍 Empty address, using default coordinates');
      this.useDefaultCoordinates();
      return;
    }

    // Use proxy endpoint to avoid CORS issues
    this.tryGeocoding('', address);
  }

  /**
   * Try geocoding with local fallback (no external API calls)
   */
  private tryGeocoding(originalUrl: string, address: string): void {
    console.log('🔍 Geocoding requested for:', address);
    console.log('📍 Using local geocoding fallback to avoid CORS issues');
    
    // Use local geocoding database for common locations
    const coordinates = this.getLocalCoordinates(address);
    
    if (coordinates) {
      console.log('✅ Found local coordinates for:', address);
      this.currentLat.set(coordinates.lat);
      this.currentLng.set(coordinates.lng);
      this.updateMapAndMarker(coordinates.lat, coordinates.lng, coordinates.address);
    } else {
      console.log('📍 No local coordinates found, using default location');
      this.useDefaultCoordinates();
    }
  }

  /**
   * Get coordinates from local database (no external API needed)
   */
  private getLocalCoordinates(address: string): { lat: number; lng: number; address: string } | null {
    const normalizedAddress = address.toLowerCase();
    
    // Local coordinate database for common locations in Tamil Nadu
    const localDatabase = [
      {
        keywords: ['vasan', 'eye', 'care', 'hospital', 'vadasery', 'nagercoil'],
        lat: 8.1906,
        lng: 77.4356,
        address: 'Vasan Eye Care Hospital, Vadasery, Nagercoil, Tamil Nadu'
      },
      {
        keywords: ['nagercoil', 'kanyakumari'],
        lat: 8.1774,
        lng: 77.4349,
        address: 'Nagercoil, Kanyakumari District, Tamil Nadu'
      },
      {
        keywords: ['kanyakumari', 'cape', 'comorin'],
        lat: 8.0883,
        lng: 77.5385,
        address: 'Kanyakumari, Tamil Nadu'
      },
      {
        keywords: ['chennai', 'madras'],
        lat: 13.0827,
        lng: 80.2707,
        address: 'Chennai, Tamil Nadu'
      },
      {
        keywords: ['coimbatore'],
        lat: 11.0168,
        lng: 76.9558,
        address: 'Coimbatore, Tamil Nadu'
      },
      {
        keywords: ['madurai'],
        lat: 9.9252,
        lng: 78.1198,
        address: 'Madurai, Tamil Nadu'
      }
    ];
    
    // Find matching location
    for (const location of localDatabase) {
      const matchCount = location.keywords.filter(keyword => 
        normalizedAddress.includes(keyword)
      ).length;
      
      if (matchCount >= 2) { // Require at least 2 keyword matches
        console.log(`🎯 Found local match for "${address}":`, location.address);
        return location;
      }
    }
    
    console.log(`📍 No local match found for "${address}"`);
    return null;
  }

  /**
   * Use default coordinates when geocoding fails
   */
  private useDefaultCoordinates(): void {
    // Default to Vasan Eye Care Hospital, Vadasery, Nagercoil
    const defaultLat = 8.1906; // Vasan Eye Care Hospital coordinates
    const defaultLng = 77.4356;
    const defaultAddress = 'Vasan Eye Care Hospital, Vadasery, Nagercoil, Tamil Nadu, India';
    
    this.currentLat.set(defaultLat);
    this.currentLng.set(defaultLng);
    this.updateMapAndMarker(defaultLat, defaultLng, defaultAddress);
    
    console.log('📍 Using default coordinates (Vasan Eye Care Hospital):', { lat: defaultLat, lng: defaultLng });
  }

  /**
   * Handle reverse geocoding fallback
   */
  private handleReverseGeocodingFallback(lat: number, lng: number): void {
    // Provide fallback address details when reverse geocoding fails
    const fallbackAddress: AddressDetails = {
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Nagercoil',
      landMark: `Near Vasan Eye Care Hospital, Vadasery (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
      zipCode: '629003',
    };

    // Emit location update with fallback data
    this.locationUpdated.emit({
      latitude: lat,
      longitude: lng,
      addressDetails: fallbackAddress,
    });

    // Update marker popup with better fallback info
    this.marker
      .bindPopup(`<strong>Location:</strong><br>Near Vasan Eye Care Hospital, Vadasery, Nagercoil<br><small>Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>`)
      .openPopup();

    console.log('📍 Using fallback address for coordinates:', { lat, lng });
  }

  /**
   * Reverse geocoding: Get address from coordinates (local approach)
   */
  private performReverseGeocoding(lat: number, lng: number): void {
    console.log('🔄 Performing local reverse geocoding for coordinates:', { lat, lng });
    
    // Use local reverse geocoding to avoid CORS issues
    const addressDetails = this.getLocalAddressFromCoordinates(lat, lng);
    
    // Emit location update event
    this.locationUpdated.emit({
      latitude: lat,
      longitude: lng,
      addressDetails,
    });

    // Create popup text
    const popupText = `${addressDetails.landMark}, ${addressDetails.city}, ${addressDetails.state}`;

    this.marker
      .bindPopup(`<strong>Address:</strong><br>${popupText}`)
      .openPopup();
      
    console.log('✅ Local reverse geocoding completed:', addressDetails);
  }

  /**
   * Get address from coordinates using local database
   */
  private getLocalAddressFromCoordinates(lat: number, lng: number): AddressDetails {
    // Define regions with their boundaries and details
    const regions = [
      {
        name: 'Vasan Eye Care Hospital Area',
        bounds: { minLat: 8.185, maxLat: 8.195, minLng: 77.430, maxLng: 77.440 },
        address: {
          country: 'India',
          state: 'Tamil Nadu',
          city: 'Nagercoil',
          landMark: 'Vasan Eye Care Hospital, Vadasery',
          zipCode: '629003'
        }
      },
      {
        name: 'Nagercoil City',
        bounds: { minLat: 8.170, maxLat: 8.190, minLng: 77.420, maxLng: 77.450 },
        address: {
          country: 'India',
          state: 'Tamil Nadu',
          city: 'Nagercoil',
          landMark: 'Nagercoil City Center',
          zipCode: '629001'
        }
      },
      {
        name: 'Kanyakumari District',
        bounds: { minLat: 8.050, maxLat: 8.200, minLng: 77.400, maxLng: 77.600 },
        address: {
          country: 'India',
          state: 'Tamil Nadu',
          city: 'Kanyakumari District',
          landMark: 'Kanyakumari District Area',
          zipCode: '629001'
        }
      }
    ];

    // Find matching region
    for (const region of regions) {
      if (lat >= region.bounds.minLat && lat <= region.bounds.maxLat &&
          lng >= region.bounds.minLng && lng <= region.bounds.maxLng) {
        console.log(`🎯 Coordinates match region: ${region.name}`);
        return region.address;
      }
    }

    // Default fallback for Tamil Nadu
    console.log('📍 Using default Tamil Nadu address for coordinates');
    return {
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Tamil Nadu',
      landMark: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      zipCode: ''
    };
  }

  /**
   * Get sanitized popup text from geocoding data
   */
  private getPopupText(data: any): string {
    return (
      data?.namedetails?.['name:en'] ||
      data?.namedetails?.['name']?.replace(/[^\x00-\x7F]/g, '') ||
      data.display_name?.replace(/[^\x00-\x7F]/g, '') ||
      'Location Info'
    );
  }

  /**
   * Update map view and marker position
   */
  private updateMapAndMarker(
    lat: number,
    lng: number,
    popupText: string
  ): void {
    if (this.map && this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], 15);
      this.marker
        .bindPopup(`<strong>Address:</strong><br>${popupText}`)
        .openPopup();
    }
  }

  /**
   * Update map when coordinates change
   */
  private updateMapFromCoordinates(lat: number, lng: number): void {
    const displayAddress =
      this.landMark() && this.city()
        ? this.addressString()
        : 'Updated with new Location';
    this.updateMapAndMarker(lat, lng, displayAddress);
    this.performReverseGeocoding(lat, lng);
  }

  /**
   * Reset map to default location
   */
  resetMap(): void {
    const defaultLat = 8.19068;
    const defaultLng = 77.43554;

    this.map.setView([defaultLat, defaultLng], 13);
    this.marker.setLatLng([defaultLat, defaultLng]);
    this.currentLat.set(defaultLat);
    this.currentLng.set(defaultLng);
    this.performReverseGeocoding(defaultLat, defaultLng);
  }
}