import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastService } from '../Toast-service/toast.service';
import { SessionService } from '../Session-service/session.service';
import countryData from '../../../assets/countryCodes.json';
import currencyDataJson from '../../../assets/common-currency.json';

import { AuthEndPoints } from '../../core/constant/api.constant';
import stateData from '../../../assets/states.json';

@Injectable({
  providedIn: 'root'
})
export class ManagePropertyService {
  private http = inject(HttpClient);  
  private swalToast = inject(ToastService);
  private session = inject(SessionService);
  
  baseApiUrl: string = environment.baseApiUrl;
  countryCodes: any = countryData;
  currencyData: any = currencyDataJson;  
  states: any = stateData;  

  constructor() {}

  /**
   * Get headers with current access token
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    const token = this.session.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('🔍 ManageProperty getHeaders() called');
    console.log('🔑 Token exists:', !!token);
    console.log('🔑 Token length:', token ? token.length : 0);
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('✅ Authorization header added successfully');
    } else {
      console.error('❌ No access token found - user may not be logged in');
    }
    
    return headers;
  }

  // Country codes data
  getCountryCodes() {
    return this.countryCodes;
  }

  // State data
  getStates() {
    return this.states;
  }

  // Currency data
  getCurrencyData() {
    this.currencyData = Object.values(this.currencyData).map(x => x);
    return this.currencyData;
  }

  // Save property data
  savePropertyData(basicDtlReq: any): Observable<any> {
    const headers = this.getHeaders();
    
    console.log('Sending property data:', basicDtlReq);
    console.log('API URL:', `${this.baseApiUrl}${AuthEndPoints.POST_YOUR_PROPERTY}`);
    console.log('📡 Making save property API call with headers:', headers.keys());
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.POST_YOUR_PROPERTY}`, basicDtlReq, { headers })
      .pipe(
        catchError((err) => {
          console.error('API Error:', err);
          
          if (err.status === 401) {
            return throwError(() => new Error('You must be logged in to add a property. Please login first.'));
          }
          
          const errorMessage = err.error?.headers?.message || err.error?.message || err.message || 'An error occurred while saving property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save property feature data
  savePropertyFeature(featureData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.AMENITIES}`, featureData, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving property feature';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save facility data
  saveFacilityData(facilityData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.MANAGE_FACILITY}`, facilityData, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving facility data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save address details
  saveAddressDetail(addressData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.ADDRESS_DETAILS}`, addressData)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving address details';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save feature image gallery
  saveFeatureImageGallery(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_FEATUREDIMAGE_GALLERY}`, data)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving feature image gallery';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

   deleteFeatureImage(deleteReq: any): Observable<any> {
    return this.http.post<any>('/api/property/delete-featured-image', deleteReq);
  }

    deleteListOfImage(deleteReq: any): Observable<any> {
    return this.http.post<any>('/api/property/delete-list-of-images', deleteReq);
  }
  // Save list of image gallery
  saveListOfImageGallery(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_LISTOFIMAGE_GALLERY}`, data)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving list of image gallery';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save document
  saveDocument(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_DOCUMENT_UPLOAD}`, data)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving document';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Delete document
  deleteDocument(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.DELETE_DOCUMENT_UPLOAD}`, data)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting document';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save nearby details
  saveNearByDetails(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.NEARBY_DETAIL}`, data, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving nearby details';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Delete nearby detail
  deleteNearByDetail(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.DELETE_NEARBY_DATA}`, data, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting nearby detail';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  

  // Get property details by filter (for public property search)
  getPropertyDetailsByFilter(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SERARCH_PUBLISHED_PROPERTY}`, data)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching property details';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Get property details with authentication (for my-properties page)
  getPropertyDetails(data: any): Observable<any> {
    const headers = this.getHeaders();
    console.log('📡 Making getPropertyDetails API call with data:', data);
    console.log('🔑 Headers include Authorization:', headers.has('Authorization'));
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.GET_ACTIVE_USER_PROPERTIES}`, data, { 
      headers,
      withCredentials: false // Set to true if using cookies for auth
    })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // Get user's own properties (for my-properties page) with authentication
  getUserProperties(): Observable<any> {
    const headers = this.getHeaders();
    console.log('📡 Making getUserProperties API call');
    console.log('🔑 Headers include Authorization:', headers.has('Authorization'));
    
    // Use POST method with empty body as the API expects POST, not GET
    const requestBody = {};
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.GET_ACTIVE_USER_PROPERTIES}`, requestBody, { 
      headers,
      withCredentials: false // Set to true if using cookies for auth
    })
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Centralized error handling for all API calls
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ ManageProperty API Error:', error);
    console.error('❌ Error Status:', error.status);
    console.error('❌ Error Message:', error.error?.headers?.message || error.message);
    
    if (error.status === 401) {
      console.error('❌ 401 Unauthorized - Token may be invalid or expired');
    } else if (error.status === 403) {
      console.error('❌ 403 Forbidden - Insufficient permissions');
    } else if (error.status === 0) {
      console.error('❌ Network error - Check CORS settings or network connection');
    }
    
    const errorMessage = error.error?.headers?.message || error.error?.message || error.message || 'An error occurred while processing your request';
    return throwError(() => new Error(errorMessage));
  }

  // Get random property data
  getRandomPropertyData(): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_PROPERTY_DETAIL_RANDOM}`)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching random property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }



  // Get property details by id
  getPropertyDetailById(propertyId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_PROPERTY_DETAIL_BY_PROP_ID}${propertyId}`, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Get published property details by id
  getPublishedPropertyDetailById(propertyId: string): Observable<any> {
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.PUBLISHED_SINGLE_PROPERTY_VIEW_URL}${propertyId}`)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching published property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save room details
  saveRoomDetails(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.BEDROOMS}`, data, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving room details';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Publish property
  publishProperty(propertyId: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.PUBLISH_PROPERTY}${propertyId}`, {}, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while publishing property';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save property to wishlist
  savePropertyToWishList(wishListData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_WISHLIST_PROPERTY}`, wishListData, { headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving property to wishlist';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Delete wishlist property
  deleteWishListProperty(propertyId: string): Observable<any> {
    const headers = this.getHeaders();
    const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_WISHLIST_PROPERTY}/${propertyId}`;
    
    console.log('📡 Making delete wishlist API call with headers:', headers.keys());
    
    return this.http.delete<any>(endpoint, { headers })
      .pipe(
        catchError((err) => {
          console.error('❌ Delete Wishlist API Error:', err);
          console.error('❌ Error Status:', err.status);
          console.error('❌ Error Message:', err.error?.headers?.message || err.message);
          
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting wishlist property';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Get wishlist data
  getWishlistData(): Observable<any> {
    const headers = this.getHeaders();
    console.log('📡 Making wishlist API call with headers:', headers.keys());
    
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_WISHLIST_PROPERTY}`, { headers })
      .pipe(
        catchError((err) => {
          console.error('❌ Wishlist API Error:', err);
          console.error('❌ Error Status:', err.status);
          console.error('❌ Error Message:', err.error?.headers?.message || err.message);
          
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching wishlist data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
  // Delete property by id
  deletePropertyById(propertyId: string): Observable<any> {
    const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_PROPERTY_BY_ID}/${propertyId}`;
    return this.http.delete<any>(endpoint)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting property';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
