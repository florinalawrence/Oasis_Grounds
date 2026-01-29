import {
  Component,
  input,
  output,
  effect,
  afterNextRender,
  signal,
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

@Component({
  selector: 'app-map-location',
  standalone: true,
  template: `
    <div #mapContainer class="map-container"></div>
  `,
  styles: [
    `
      .map-container {
        width: 100%;
        height: 370px;
        margin-bottom: 32px;
        border-radius: 8px;
        border: 2px solid #e0e0e0;
      }
      
      /* Ensure Leaflet marker icons are visible */
      .map-container :global(.leaflet-marker-icon) {
        display: block !important;
      }
      
      .map-container :global(.leaflet-marker-shadow) {
        display: block !important;
      }
      
      /* Fix for marker icon positioning */
      .map-container :global(.leaflet-marker-pane) {
        z-index: 600 !important;
      }
    `,
  ],
})
export class MapLocationComponent {
  /* -------------------- DI -------------------- */
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  /* -------------------- INPUTS -------------------- */
  readonly city = input<string>('');
  readonly state = input<string>('');
  readonly landMark = input<string>('');
  readonly country = input<string>('');
  readonly zipCode = input<string>('');
  readonly latitude = input<number>();
  readonly longitude = input<number>();
  readonly isDraggable = input<boolean>(true);
  readonly disableReverseGeocoding = input<boolean>(false);

  /* -------------------- OUTPUT -------------------- */
  readonly locationUpdated = output<{
    latitude: number;
    longitude: number;
    addressDetails: AddressDetails;
  }>();

  /* -------------------- INTERNAL STATE -------------------- */
  private readonly mapInitialized = signal(false);
  private map!: any;
  private marker!: any;

  private readonly addressChange$ = new Subject<void>();

  /* -------------------- CONSTRUCTOR -------------------- */
  constructor() {
    // Configure Leaflet icons globally on construction
    this.configureLeafletIconsGlobally();
    
    /* Debounced address updates */
    this.addressChange$
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleAddressChange());

    /* Init map after render */
    afterNextRender(() => {
      this.initMap();
    });

    /* Address change effect (replaces ngOnChanges) */
    effect(() => {
      if (!this.mapInitialized()) return;

      const country = this.country();
      const city = this.city();
      const zip = this.zipCode();

      if (country && (city || zip)) {
        this.addressChange$.next();
      }
    });

    /* Coordinate change effect */
    effect(() => {
      if (!this.mapInitialized()) return;

      const lat = this.latitude();
      const lng = this.longitude();

      if (lat && lng) {
        this.updateMapFromCoordinates(lat, lng);
      }
    });

    /* Cleanup */
    this.destroyRef.onDestroy(() => {
      this.map?.remove();
    });
  }

  /* -------------------- GLOBAL ICON CONFIGURATION -------------------- */
  private configureLeafletIconsGlobally(): void {
    // Configure Leaflet icons globally to prevent 404 errors
    if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
      console.log('✅ Leaflet icons configured globally');
    } else {
      console.warn('⚠️ Leaflet library not available for global icon configuration');
    }
  }

  /* -------------------- MAP INIT -------------------- */
  private initMap(): void {
    const lat = this.latitude() ?? 8.190577;
    const lng = this.longitude() ?? 77.435586;

    console.log('🗺️ Initializing map with coordinates:', { lat, lng });

    // Configure Leaflet default icon paths
    this.configureLeafletIcons();

    this.map = L.map(document.querySelector('.map-container') as HTMLElement)
      .setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Create marker with custom icon
    const customIcon = this.createCustomIcon();
    console.log('📍 Creating marker with custom icon');
    
    this.marker = L.marker([lat, lng], {
      draggable: this.isDraggable(),
      icon: customIcon
    }).addTo(this.map);

    console.log('✅ Marker added to map');

    if (this.isDraggable()) {
      this.marker.on('dragend', (e: any) => this.onMarkerDragEnd(e));
    }

    // Perform initial reverse geocoding or set custom popup
    if (this.disableReverseGeocoding()) {
      // Set custom popup with the exact address we want
      const customAddress = `Vasan Eye Care Hospital, Kanyakumari, Tamil Nadu, India`;
      this.marker.bindPopup(`<strong>Address:</strong><br>${customAddress}`).openPopup();
      console.log('✅ Custom popup set:', customAddress);
    } else {
      this.performReverseGeocoding(lat, lng);
    }
    
    this.mapInitialized.set(true);
    console.log('✅ Map initialization complete');
  }

  /* -------------------- ICON CONFIGURATION -------------------- */
  private configureLeafletIcons(): void {
    // Fix for Leaflet default icon paths
    if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
    }
  }

  private createCustomIcon(): any {
    try {
      // Try to use local icons first
      const icon = L.icon({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      console.log('✅ Custom icon created successfully');
      return icon;
    } catch (error) {
      console.error('❌ Error creating custom icon:', error);
      // Try CDN fallback
      return this.createFallbackIcon();
    }
  }

  private createFallbackIcon(): any {
    try {
      // Fallback to CDN icons
      return L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
    } catch (error) {
      console.error('❌ Error creating fallback icon:', error);
      // Last resort: return default Leaflet icon
      return new L.Icon.Default();
    }
  }

  /* -------------------- MANUAL TRIGGER -------------------- */
  triggerAddressUpdate(): void {
    console.log('🔄 Manual address update triggered');
    this.handleAddressChange();
    
    // Also update popup with current address values
    setTimeout(() => {
      this.updatePopupWithCurrentAddress();
    }, 1000); // Wait for address change to complete
  }

  /* -------------------- ADDRESS → COORDINATES -------------------- */
  private handleAddressChange(): void {
    const address = [
      this.landMark(),
      this.city(),
      this.state(),
      this.country(),
      this.zipCode(),
    ]
      .filter(Boolean)
      .join(', ');

    if (!address.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&limit=1`;

    this.http
      .get<any[]>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.length) return;

        const lat = parseFloat(res[0].lat);
        const lng = parseFloat(res[0].lon);

        this.updateMapAndMarker(lat, lng, res[0].display_name);
      });
  }

  /* -------------------- MARKER DRAG -------------------- */
  private onMarkerDragEnd(event: any): void {
    const { lat, lng } = event.target.getLatLng();
    
    console.log('🖱️ Marker dragged to:', { lat, lng });
    
    // Only perform reverse geocoding if not disabled
    if (!this.disableReverseGeocoding()) {
      this.performReverseGeocoding(lat, lng);
    } else {
      // If reverse geocoding is disabled, still update popup with current form values
      this.updatePopupWithCurrentAddress();
    }
  }

  /* -------------------- COORDINATES → ADDRESS -------------------- */
  private performReverseGeocoding(lat: number, lng: number): void {
    // Skip reverse geocoding if disabled
    if (this.disableReverseGeocoding()) {
      console.log('🚫 Reverse geocoding disabled, skipping...');
      return;
    }
    
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    this.http
      .get<any>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const addr = data?.address || {};

        const addressDetails: AddressDetails = {
          country: addr.country || '',
          state: addr.state || '',
          city: addr.city || addr.town || addr.village || '',
          landMark: addr.road || '',
          zipCode: addr.postcode || '',
        };

        // Emit location update to parent component
        this.locationUpdated.emit({
          latitude: lat,
          longitude: lng,
          addressDetails,
        });

        // Update popup with formatted address
        this.updatePopupWithFormattedAddress(addressDetails);
      });
  }

  /* -------------------- POPUP UPDATE METHODS -------------------- */
  private updatePopupWithFormattedAddress(addressDetails: AddressDetails): void {
    const customPopupText = this.formatAddressPopup(addressDetails);
    console.log('📍 Updating popup with formatted address:', customPopupText);
    
    this.marker
      .bindPopup(`<strong>Address:</strong><br>${customPopupText}`)
      .openPopup();
  }

  private updatePopupWithCurrentAddress(): void {
    const currentAddress = this.formatCurrentAddressPopup();
    const displayText = currentAddress || 'Location selected';
    
    console.log('📍 Updating popup with current address:', displayText);
    
    this.marker
      .bindPopup(`<strong>Address:</strong><br>${displayText}`)
      .openPopup();
  }

  /* -------------------- ADDRESS FORMATTING -------------------- */
  private formatAddressPopup(addressDetails: any): string {
    const parts = [];
    
    // Add landmark if available
    if (addressDetails.landMark && addressDetails.landMark.trim()) {
      parts.push(addressDetails.landMark.trim());
    }
    
    // Add city if available
    if (addressDetails.city && addressDetails.city.trim()) {
      parts.push(addressDetails.city.trim());
    }
    
    // Add state if available
    if (addressDetails.state && addressDetails.state.trim()) {
      parts.push(addressDetails.state.trim());
    }
    
    // Add pincode if available
    if (addressDetails.zipCode && addressDetails.zipCode.trim()) {
      parts.push(`PIN: ${addressDetails.zipCode.trim()}`);
    }
    
    // Add country if available
    if (addressDetails.country && addressDetails.country.trim()) {
      parts.push(addressDetails.country.trim());
    }
    
    // Join parts with commas, or show default message
    const formattedAddress = parts.length > 0 ? parts.join(', ') : 'Location selected';
    
    console.log('📍 Formatted popup address:', formattedAddress);
    return formattedAddress;
  }

  /* -------------------- MAP UPDATE -------------------- */
  private updateMapFromCoordinates(lat: number, lng: number): void {
    this.updateMapAndMarker(lat, lng, 'Updated Location');
  }

  private updateMapAndMarker(lat: number, lng: number, text: string): void {
    this.marker.setLatLng([lat, lng]);
    this.map.setView([lat, lng], 15);
    
    // Update popup with current address values instead of generic text
    this.updatePopupWithCurrentAddress();
  }

  /* -------------------- CURRENT ADDRESS FORMATTING -------------------- */
  private formatCurrentAddressPopup(): string {
    const parts = [];
    
    // Add landmark if available
    if (this.landMark() && this.landMark().trim()) {
      parts.push(this.landMark().trim());
    }
    
    // Add city if available
    if (this.city() && this.city().trim()) {
      parts.push(this.city().trim());
    }
    
    // Add state if available
    if (this.state() && this.state().trim()) {
      parts.push(this.state().trim());
    }
    
    // Add pincode if available
    if (this.zipCode() && this.zipCode().trim()) {
      parts.push(`PIN: ${this.zipCode().trim()}`);
    }
    
    // Add country if available
    if (this.country() && this.country().trim()) {
      parts.push(this.country().trim());
    }
    
    // Join parts with commas
    return parts.length > 0 ? parts.join(', ') : '';
  }

  /* -------------------- RESET -------------------- */
  resetMap(): void {
    this.updateMapAndMarker(8.190577, 77.435586, 'Default Location');
  }
}
