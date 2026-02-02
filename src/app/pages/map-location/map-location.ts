import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Subject, of } from 'rxjs';
import { debounceTime, catchError, retry, delay } from 'rxjs/operators';    

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
  template: `<div id="leafletMap" class="map-container"></div>`,
  styles: [
    `
      .map-container {
        width: 100%;
        height: 370px;
        margin-bottom: 32px;
        border-radius: 8px;
        border: 2px solid #e0e0e0;
      }

      .map-container :global(.leaflet-marker-icon) {
        display: block !important;
      }

      .map-container :global(.leaflet-marker-shadow) {
        display: block !important;
      }

      .map-container :global(.leaflet-marker-pane) {
        z-index: 600 !important;
      }
    `,
  ],
})
export class MapLocationComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  
  @Input() country = '';
  @Input() state = '';
  @Input() city = '';
  @Input() landMark = '';
  @Input() zipCode = '';
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Input() isDraggable = true;
  @Input() disableReverseGeocoding = false;

 
  @Output() locationUpdated = new EventEmitter<{
    latitude: number;
    longitude: number;
    addressDetails: AddressDetails;
  }>();

  private map!: any;
  private marker!: any;
  private mapInitialized = false;

  private addressChange$ = new Subject<void>();

  constructor(private http: HttpClient) {
    this.addressChange$
      .pipe(debounceTime(500))
      .subscribe(() => this.handleAddressChange());
    

    this.configureLeafletIcons();
  }

  /**
   *  ADDED: Configure Leaflet icons to fix marker display issue
   */
  private configureLeafletIcons(): void {
    if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
    
      
      
     
      
      this.verifyIconPaths();
    } 
    
  }

  /**
   * ✅ ADDED: Verify that icon files are accessible
   */
  private verifyIconPaths(): void {
    const iconPaths = [
      '/leaflet/marker-icon.png',
      '/leaflet/marker-icon-2x.png',
      '/leaflet/marker-shadow.png'
    ];

    iconPaths.forEach(path => {
      const img = new Image();
      img.onload = () => console.log(`Icon loaded successfully: ${path}`);
      img.onerror = () => console.warn(`Icon failed to load: ${path}`);
      img.src = path;
    });
  }

  /**
   *  Create custom icon with proper configuration
   */
  private createCustomIcon(): any {
    try {
      const icon = L.icon({
        iconUrl: '/leaflet/marker-icon.png',
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        shadowUrl: '/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      });
      console.log('✅ Custom icon created successfully');
      return icon;
    } catch (error) {
      console.error('❌ Error creating custom icon:', error);
      return this.createFallbackIcon();
    }
  }

  /**
   * Fallback icon using CDN if local icons fail
   */
  private createFallbackIcon(): any {
    try {
      return L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      });
    } catch (error) {
      console.error('❌ Error creating fallback icon:', error);
      return new L.Icon.Default();
    }
  }

  // 🔥 OLD BEHAVIOR RESTORED
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapInitialized) return;

    // 1️⃣ Coordinates update
    if (changes['latitude'] || changes['longitude']) {
      if (this.latitude && this.longitude) {
        this.updateMapAndMarker(this.latitude, this.longitude);
      }
      return;
    }

   
    if (
      changes['country'] ||
      changes['city'] ||
      changes['state'] ||
      changes['landMark'] ||
      changes['zipCode']
    ) {
      if (this.country && (this.city || this.zipCode)) {
        this.addressChange$.next();
      }
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }


  
  triggerAddressUpdate(): void {
    this.addressChange$.next();
  }

  /**
   * Direct navigation method for property-location component
   */
  navigateToAddress(country: string, state: string, city: string, zipCode?: string, landMark?: string): void {
   
    
   
    
    this.country = country;
    this.state = state;
    this.city = city;
    this.zipCode = zipCode || '';
    this.landMark = landMark || '';
    
    // Build address string for geocoding
    const addressParts = [landMark, city, state, country, zipCode].filter(Boolean);
    const address = addressParts.join(', ');
    
    if (!address.trim()) {
     
      
      return;
    }

  
    

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const headers = new HttpHeaders({ Accept: 'application/json' });

    this.http
      .get<any[]>(url, { headers })
      .pipe(
        delay(1000),
        retry(2),
        catchError((error) => {
      
          
          return of([]);
        })
      )
      .subscribe({
        next: (res) => {
          if (!res?.length) {
           
            
            return;
          }

          const lat = parseFloat(res[0].lat);
          const lng = parseFloat(res[0].lon);

          
          
          
          // Update map and marker position with custom icon
          this.updateMapAndMarker(lat, lng);
          
          // Emit location update
          this.locationUpdated.emit({
            latitude: lat,
            longitude: lng,
            addressDetails: {
              country: this.country,
              state: this.state,
              city: this.city,
              landMark: this.landMark,
              zipCode: this.zipCode,
            },
          });
          
         
          
        },
        error: (error) => {
          console.error('❌ Unexpected direct geocoding error:', error);
        },
      });
  }

  // ================= MAP LOGIC =================

  private initMap(): void {
    const lat = this.latitude ?? 8.190577;
    const lng = this.longitude ?? 77.435586;

    

    this.map = L.map('leafletMap').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    
    const customIcon = this.createCustomIcon();
    

    this.marker = L.marker([lat, lng], {
      draggable: this.isDraggable,
      icon: customIcon, 
    }).addTo(this.map);

  
    

    if (this.isDraggable) {
      this.marker.on('dragend', (e: any) => this.onMarkerDragEnd(e));
    }

 
    
    this.updatePopupWithCurrentAddress();

    this.mapInitialized = true;

   
    
    if (this.country && (this.city || this.zipCode)) {
      this.addressChange$.next();
    }
  }

  private handleAddressChange(): void {
    const address = [
      this.landMark,
      this.city,
      this.state,
      this.country,
      this.zipCode,
    ]
      .filter(Boolean)
      .join(', ');

    if (!address.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&limit=1`;

    const headers = new HttpHeaders({ Accept: 'application/json' });

    this.http
      .get<any[]>(url, { headers })
      .pipe(
        delay(500),
        retry(2),
        catchError(() => of([]))
      )
      .subscribe((res) => {
        if (!res.length) return;

        const lat = +res[0].lat;
        const lng = +res[0].lon;

        this.updateMapAndMarker(lat, lng);

        this.locationUpdated.emit({
          latitude: lat,
          longitude: lng,
          addressDetails: {
            country: this.country,
            state: this.state,
            city: this.city,
            landMark: this.landMark,
            zipCode: this.zipCode,
          },
        });
      });
  }

  private onMarkerDragEnd(event: any): void {
    const { lat, lng } = event.target.getLatLng();

    if (this.disableReverseGeocoding) {
      this.updateMapAndMarker(lat, lng);
      return;
    }

    this.performReverseGeocoding(lat, lng);
  }

  private performReverseGeocoding(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    this.http.get<any>(url).subscribe((data) => {
      const addr = data?.address || {};

      const details: AddressDetails = {
        country: addr.country || this.country,
        state: addr.state || this.state,
        city: addr.city || addr.town || addr.village || this.city,
        landMark: addr.road || this.landMark,
        zipCode: addr.postcode || this.zipCode,
      };

      this.locationUpdated.emit({
        latitude: lat,
        longitude: lng,
        addressDetails: details,
      });

      this.marker.bindPopup(data.display_name).openPopup();
    });
  }

  private updateMapAndMarker(lat: number, lng: number): void {

    const customIcon = this.createCustomIcon();
    
    this.marker.setLatLng([lat, lng]);
    this.marker.setIcon(customIcon); 
    this.map.setView([lat, lng], 15);
    
    
    this.updatePopupWithCurrentAddress();
    
  
    
  }

  /**
   * ✅ ADDED: Update popup with current address information
   */
  private updatePopupWithCurrentAddress(): void {
    const currentAddress = this.formatCurrentAddressPopup();
    const displayText = currentAddress || 'Location selected';

    
    this.marker.bindPopup(`<strong>Address:</strong><br>${displayText}`).openPopup();
  }

  /**
   * Format current address for popup display
   */
  private formatCurrentAddressPopup(): string {
    const parts = [];

    if (this.landMark && this.landMark.trim()) {
      parts.push(this.landMark.trim());
    }

    if (this.city && this.city.trim()) {
      parts.push(this.city.trim());
    }

    if (this.state && this.state.trim()) {
      parts.push(this.state.trim());
    }

    if (this.zipCode && this.zipCode.trim()) {
      parts.push(`PIN: ${this.zipCode.trim()}`);
    }

    if (this.country && this.country.trim()) {
      parts.push(this.country.trim());
    }

    return parts.length > 0 ? parts.join(', ') : '';
  }

  //  Reset map to default location
  resetMap(): void {
    if (!this.map || !this.marker) return;

    const defaultLat = 8.190577;
    const defaultLng = 77.435586;

    this.latitude = defaultLat;
    this.longitude = defaultLng;

   
    const customIcon = this.createCustomIcon();
    this.marker.setLatLng([defaultLat, defaultLng]);
    this.marker.setIcon(customIcon); 
    
    this.map.setView([defaultLat, defaultLng], 13);

    this.marker.bindPopup('Default Location').openPopup();
    
    
  }
}