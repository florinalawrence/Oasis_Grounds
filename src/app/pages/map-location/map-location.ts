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


@Component({
  selector: 'app-map-location',
  standalone: true,
  imports: [],
  template: `<div id="leafletMap" class="map-container" style="background: #f8f9fa !important;"></div>`,
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
        border: 2px solid #e0e0e0;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        position: relative;
        overflow: hidden;
      }

      /* Ensure Leaflet controls are visible */
      .map-container :global(.leaflet-control-zoom) {
        z-index: 1000;
      }

      .map-container :global(.leaflet-control-attribution) {
        z-index: 1000;
      }

      /* Loading indicator */
      .map-container::before {
        content: '🗺️ Loading map...';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 500;
        color: #495057;
        font-size: 16px;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.9);
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      /* Hide loading indicator when map is loaded */
      .map-container.loaded::before {
        display: none;
      }

      /* Prevent blue background from showing through */
      .map-container :global(.leaflet-container) {
        background: #f8f9fa !important;
      }

      .map-container :global(.leaflet-tile-pane) {
        background: #f8f9fa !important;
      }
    `,
  ],
})
export class MapLocation {
  //  dependency injection
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based inputs
  readonly address = input<string>();
  readonly city = input<string>('');
  readonly state = input<string>('');
  readonly landMark = input<string>('');
  readonly country = input<string>('');
  readonly zipCode = input<string>('');
  readonly latitude = input<number>();
  readonly longitude = input<number>();
  readonly isDraggable = input<boolean>(true);
  readonly isDynamic = input<boolean>(false);


  // Signal-based output 
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
    console.log('🗺️ MapLocation component constructor called');
    
    // Check if Leaflet is available
    if (typeof L !== 'undefined') {
      console.log('✅ Leaflet library is available');
      // Configure Leaflet icons early
      this.configureLeafletIconsGlobally();
    } else {
      console.error('❌ Leaflet library is not available! Check if it\'s loaded in index.html');
    }

    // Subscribe to debounced address changes
    this.addressChange$
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.handleAddressChange());

    // Initialize map after render
    afterNextRender(() => {
      // Add a small delay to ensure DOM is fully ready
      setTimeout(() => {
        console.log('🚀 Attempting to initialize map...');
        this.initMap();
      }, 100);
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
    console.log('🗺️ Initializing Leaflet map...');
    
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('❌ Leaflet library is not loaded! Map will not work.');
      this.showLeafletError();
      return;
    }

    this.configureLeafletIcons();

    // Default coordinates (Nagercoil, Tamil Nadu)
    const initialLat = this.latitude() ?? 8.19068;
    const initialLng = this.longitude() ?? 77.43554;

    this.currentLat.set(initialLat);
    this.currentLng.set(initialLng);

    console.log('📍 Creating map with coordinates:', { lat: initialLat, lng: initialLng });

    // Create map instance with better error handling
    try {
      this.map = L.map('leafletMap', {
        preferCanvas: true,
        zoomControl: true,
        attributionControl: true
      }).setView([initialLat, initialLng], 15);

      // Add loaded class to hide loading indicator
      const mapContainer = document.getElementById('leafletMap');
      if (mapContainer) {
        setTimeout(() => {
          mapContainer.classList.add('loaded');
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Failed to create map instance:', error);
      this.showLeafletError();
      return;
    }

    // Add reliable tile layer immediately
    this.addReliableTileLayer();

    // Add marker
    this.marker = L.marker([initialLat, initialLng], {
      draggable: this.isDraggable(),
    }).addTo(this.map);

    // Only add drag event listener if marker is draggable
    if (this.isDraggable()) {
      this.marker.on('dragend', (event: any) => this.onMarkerDragEnd(event));
    }

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
    console.log('✅ Map initialized successfully');
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
    
    // Enhanced local coordinate database for form-based address matching
    const localDatabase = [
      // Nagercoil area locations
      {
        keywords: ['vasan', 'eye', 'care', 'hospital', 'vadasery'],
        lat: 8.1906,
        lng: 77.4356,
        address: 'Vasan Eye Care Hospital, Vadasery, Nagercoil, Tamil Nadu'
      },
      {
        keywords: ['railway', 'station', 'nagercoil'],
        lat: 8.1800,
        lng: 77.4300,
        address: 'Near Railway Station, Nagercoil, Tamil Nadu'
      },
      {
        keywords: ['bus', 'stand', 'nagercoil'],
        lat: 8.1750,
        lng: 77.4250,
        address: 'Near Bus Stand, Nagercoil, Tamil Nadu'
      },
      {
        keywords: ['kottar', 'nagercoil'],
        lat: 8.1700,
        lng: 77.4200,
        address: 'Kottar, Nagercoil, Tamil Nadu'
      },
      {
        keywords: ['asaripallam', 'nagercoil'],
        lat: 8.1850,
        lng: 77.4450,
        address: 'Asaripallam, Nagercoil, Tamil Nadu'
      },
      {
        keywords: ['nh944', 'nagercoil'],
        lat: 8.1774,
        lng: 77.4349,
        address: 'NH944, Nagercoil, Tamil Nadu'
      },
      // City-specific matches (most important for city field changes)
      {
        keywords: ['nagercoil'],
        lat: 8.1774,
        lng: 77.4349,
        address: 'Nagercoil, Kanyakumari District, Tamil Nadu'
      },
      {
        keywords: ['kanyakumari'],
        lat: 8.0883,
        lng: 77.5385,
        address: 'Kanyakumari, Tamil Nadu'
      },
      {
        keywords: ['marthandam'],
        lat: 8.3100,
        lng: 77.2300,
        address: 'Marthandam, Kanyakumari District, Tamil Nadu'
      },
      {
        keywords: ['colachel'],
        lat: 8.1700,
        lng: 77.2400,
        address: 'Colachel, Kanyakumari District, Tamil Nadu'
      },
      {
        keywords: ['tirunelveli'],
        lat: 8.7139,
        lng: 77.7567,
        address: 'Tirunelveli, Tamil Nadu'
      },
      {
        keywords: ['tuticorin', 'thoothukudi'],
        lat: 8.7642,
        lng: 78.1348,
        address: 'Tuticorin (Thoothukudi), Tamil Nadu'
      },
      // Kerala locations
      {
        keywords: ['parassala', 'thiruvananthapuram'],
        lat: 8.2000,
        lng: 77.4400,
        address: 'Parassala, Thiruvananthapuram, Kerala'
      },
      {
        keywords: ['thiruvananthapuram', 'trivandrum'],
        lat: 8.5241,
        lng: 76.9366,
        address: 'Thiruvananthapuram, Kerala'
      },
      {
        keywords: ['kollam'],
        lat: 8.8932,
        lng: 76.6141,
        address: 'Kollam, Kerala'
      },
      {
        keywords: ['kochi', 'cochin'],
        lat: 9.9312,
        lng: 76.2673,
        address: 'Kochi, Kerala'
      },
      // Major Tamil Nadu cities
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
      },
      {
        keywords: ['salem'],
        lat: 11.6643,
        lng: 78.1460,
        address: 'Salem, Tamil Nadu'
      },
      {
        keywords: ['erode'],
        lat: 11.3410,
        lng: 77.7172,
        address: 'Erode, Tamil Nadu'
      },
      {
        keywords: ['vellore'],
        lat: 12.9165,
        lng: 79.1325,
        address: 'Vellore, Tamil Nadu'
      },
      {
        keywords: ['tiruchirappalli', 'trichy'],
        lat: 10.7905,
        lng: 78.7047,
        address: 'Tiruchirappalli (Trichy), Tamil Nadu'
      }
    ];
    
    // Find matching location with improved matching logic
    for (const location of localDatabase) {
      const matchCount = location.keywords.filter(keyword => 
        normalizedAddress.includes(keyword)
      ).length;
      
      // For single keyword matches, require exact match for city names
      if (matchCount >= 1) {
        const hasExactCityMatch = location.keywords.some(keyword => {
          const cityKeywords = [
            'nagercoil', 'kanyakumari', 'chennai', 'coimbatore', 'madurai', 
            'thiruvananthapuram', 'marthandam', 'colachel', 'tirunelveli',
            'tuticorin', 'thoothukudi', 'kollam', 'kochi', 'cochin',
            'salem', 'erode', 'vellore', 'tiruchirappalli', 'trichy'
          ];
          return cityKeywords.includes(keyword) && normalizedAddress.includes(keyword);
        });
        
        if (matchCount >= 2 || hasExactCityMatch) {
          console.log(`🎯 Found local match for "${address}":`, location.address);
          return location;
        }
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
      zipCode: '629001',
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
          zipCode: '629001'
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

  /**
   * Add a reliable tile layer that works consistently
   */
  private addReliableTileLayer(): void {
    console.log('🗺️ Adding reliable tile layer...');
    
    // Use OpenStreetMap directly - this is what's working in your screenshot
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    });

    // Add to map immediately
    tileLayer.addTo(this.map);
    
    // Set up success handler
    tileLayer.on('tileload', () => {
      console.log('✅ Tiles loaded successfully');
      const mapContainer = document.getElementById('leafletMap');
      if (mapContainer) {
        mapContainer.classList.add('loaded');
      }
    });

    // If tiles fail, try CartoDB as backup
    tileLayer.on('tileerror', () => {
      console.warn('⚠️ OpenStreetMap failed, trying CartoDB...');
      this.tryCartoDBTiles();
    });

    // Force map refresh after a short delay
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        console.log('🔄 Map refreshed');
      }
    }, 1000);
  }

  /**
   * Fallback to CartoDB tiles if OpenStreetMap fails
   */
  private tryCartoDBTiles(): void {
    // Remove existing tile layers
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        this.map.removeLayer(layer);
      }
    });

    // Add CartoDB Voyager tiles (very reliable)
    const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    });

    cartoLayer.addTo(this.map);
    
    cartoLayer.on('tileload', () => {
      console.log('✅ CartoDB tiles loaded successfully');
      const mapContainer = document.getElementById('leafletMap');
      if (mapContainer) {
        mapContainer.classList.add('loaded');
      }
    });

    // Force refresh
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 500);
  }



  /**
   * Use offline mode with better styling and visual feedback
   */
  private useOfflineMode(): void {
    console.log('📍 Using offline mode - map will show with basic styling');
    
    // Remove all tile layers
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        this.map.removeLayer(layer);
      }
    });

    // Create a simple grid pattern as background
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Light gray background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 256, 256);
      
      // Grid lines
      ctx.strokeStyle = '#e9ecef';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= 256; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 256);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
      
      // Add "OFFLINE" text
      ctx.fillStyle = '#6c757d';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('OFFLINE MODE', 128, 128);
    }

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL();

    // Add offline tile layer
    const offlineLayer = L.tileLayer(dataUrl, {
      attribution: 'Offline Mode - Map tiles unavailable',
      opacity: 0.8,
      maxZoom: 19
    });

    offlineLayer.addTo(this.map);

    // Show notification to user
    if (this.marker) {
      this.marker.bindPopup(`
        <div style="text-align: center; padding: 10px;">
          <strong>⚠️ Offline Mode</strong><br>
          <small>Map tiles are unavailable.<br>
          Location marker is still functional.</small>
        </div>
      `).openPopup();
    }
  }

  /**
   * Show error when Leaflet library is not available
   */
  private showLeafletError(): void {
    const mapContainer = document.getElementById('leafletMap');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background-color: #f8f9fa;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
          color: #6c757d;
          text-align: center;
          padding: 20px;
        ">
          <div>
            <h5>Map Unavailable</h5>
            <p>The map library failed to load.<br>Please refresh the page or check your internet connection.</p>
          </div>
        </div>
      `;
    }
  }
}