import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  
  baseApiUrl: string = environment.baseApiUrl;
  countryCodes: any = countryData;
  currencyData: any = currencyDataJson;  
  states: any = stateData;  

  constructor() {}

  /**
   * Handle token expiration and redirect to login
   */
  private handleTokenExpiration(): void {
    console.warn('🔒 Token expired - redirecting to login');
    this.session.removeCredentials();
    this.swalToast.showToast('Your session has expired. Please log in again.', 'warning');
    this.router.navigate(['/login']);
  }

  /**
   * Check if error is due to token expiration
   */
  private isTokenExpired(error: any): boolean {
    const errorMessage = error.error?.headers?.message || error.message || '';
    return (
      error.status === 401 || 
      errorMessage.toLowerCase().includes('expired') ||
      errorMessage.toLowerCase().includes('invalid') ||
      errorMessage.toLowerCase().includes('unauthorized')
    );
  }

  /**
   * Handle API errors with token expiration check
   */
  private handleApiError(error: any, operation: string = 'API call'): Observable<never> {
    console.error(`❌ ${operation} error:`, error);
    
    // Check if token is expired
    if (this.isTokenExpired(error)) {
      this.handleTokenExpiration();
      return throwError(() => new Error('Session expired. Please log in again.'));
    }
    
    const errorMessage = error.error?.headers?.message || error.error?.message || `An error occurred during ${operation}`;
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get headers with current access token
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    const token = this.session.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('🔑 ManageProperty getHeaders() called');
    console.log('🔑 Token exists:', !!token);
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('✅ Authorization header added successfully');
    } else {
      console.error('❌ No access token found - redirecting to login');
      this.handleTokenExpiration();
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
    const headers = this.getHeaders();
    console.log('📍 Saving address details with auth headers');
    console.log('📡 Address API URL:', `${this.baseApiUrl}${AuthEndPoints.ADDRESS_DETAILS}`);
    console.log('📤 Address data:', addressData);
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.ADDRESS_DETAILS}`, addressData, { headers })
      .pipe(
        catchError((err) => this.handleApiError(err, 'Save Address Details'))
      );
  }

  // Save feature image gallery
  saveFeatureImageGallery(data: any): Observable<any> {
    // For file uploads, we need headers WITHOUT Content-Type (let browser set it)
    const token = this.session.getToken();
    
    if (!token) {
      console.error(' No authentication token available for featured image upload');
      return throwError(() => new Error('Authentication required. Please log in again.'));
    }
    
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log(' Featured Image Upload: Token added to headers');
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_FEATUREDIMAGE_GALLERY}`, data, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Featured image upload API error:', err);
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving feature image gallery';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

   deleteFeatureImage(deleteReq: any): Observable<any> {
    const headers = this.getHeaders();
    console.log(' Deleting featured image with auth headers');
    
    return this.http.post<any>(`${this.baseApiUrl}property/delete/featured-image`, deleteReq, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Delete featured image API error:', err);
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting featured image';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

    deleteListOfImage(deleteReq: any): Observable<any> {
    const headers = this.getHeaders();
    console.log(' Deleting gallery image with auth headers');
    
    return this.http.post<any>(`${this.baseApiUrl}property/delete/list-of-images`, deleteReq, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Delete gallery image API error:', err);
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting image';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
  // Save list of image gallery
  saveListOfImageGallery(data: any): Observable<any> {
    // For file uploads, we need headers WITHOUT Content-Type (let browser set it)
    const token = this.session.getToken();
    
    if (!token) {
      console.error(' No authentication token available for gallery images upload');
      return throwError(() => new Error('Authentication required. Please log in again.'));
    }
    
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log(' Gallery Images Upload: Token added to headers');
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_LISTOFIMAGE_GALLERY}`, data, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Gallery images upload API error:', err);
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving list of image gallery';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save document
  saveDocument(data: any): Observable<any> {
    // For file uploads, we need headers WITHOUT Content-Type (let browser set it)
    const token = this.session.getToken();
    
    if (!token) {
      console.error('❌ No authentication token available for document upload');
      this.handleTokenExpiration();
      return throwError(() => new Error('Authentication required. Please log in again.'));
    }
    
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log('📤 Document Upload: Token added to headers');
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_DOCUMENT_UPLOAD}`, data, { headers })
      .pipe(
        catchError((err) => this.handleApiError(err, 'Save Document'))
      );
  }

  // Delete document
  // deleteDocumentUpload(data: any): Observable<any> {
  //   const headers = this.getHeaders();
  //   console.log('🗑️ Deleting document with auth headers');
  //   console.log('🌐 Base API URL:', this.baseApiUrl);
  //   console.log('🔗 Full delete URL:', `${this.baseApiUrl}${AuthEndPoints.DELETE_DOCUMENT_UPLOAD}`);
  //   console.log('📤 Delete request data:', data);
    
  //   return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.DELETE_DOCUMENT_UPLOAD}`, data, { headers })
  //     .pipe(
  //       catchError((err) => this.handleApiError(err, 'Delete Document'))
  //     );
  // }

//   deleteDocumentUpload(deleteReq: { propertyId: string; identifierId: string }) {
//   const formData = new FormData();
//   formData.append('propertyId', deleteReq.propertyId);
//   formData.append('identifierId', deleteReq.identifierId);

//   return this.http.post(
//     `${this.baseApiUrl}/property/delete/upload/file`,
//     formData
//   );
// }


// deleteDocumentUpload(deleteReq: { propertyId: string; identifierId: string }): Observable<any> {
//   const formData = new FormData();
//   formData.append('propertyId', deleteReq.propertyId);
//   formData.append('identifierId', deleteReq.identifierId);

//   const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.getToken()}`);

//   return this.http.post(this.baseApiUrl + AuthEndPoints.DELETE_DOCUMENT_UPLOAD, formData, { headers })
//     .pipe(
//       catchError(err => this.handleApiError(err, 'Delete Document'))
//     );
// }


// deleteDocumentUpload(fileData: any): Observable<any> {
//   const url = `${this.baseApiUrl}property/delete/upload/file`;
  
  
//   return this.http.delete(url, {
//     body: fileData,
//     headers: new HttpHeaders({
//       'Content-Type': 'application/json'
//     })
//   }).pipe(
//     catchError(this.handleError)
//   );
// }


deleteDocumentUpload(fileData: any): Observable<any> {
  const url = `${this.baseApiUrl}property/delete/upload/file`;
   const headers = this.getHeaders();
   let options = {
    headers: headers,
    body: fileData
  };
  
  // Get token from storage
  const token = localStorage.getItem('authToken'); 
  
  /*const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  });*/
  
  return this.http.delete(url,  options ).pipe(
    catchError(this.handleError)
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
  return this.http.put<any>(
    `${this.baseApiUrl}${AuthEndPoints.DELETE_NEARBY_DATA}`,
    data,
    { headers }
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
    console.log(' Making getPropertyDetails API call with data:', data);
    console.log(' Headers include Authorization:', headers.has('Authorization'));
    
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
    console.log(' Making getUserProperties API call');
    console.log(' Headers include Authorization:', headers.has('Authorization'));
    
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
   
    
    
    if (error.status === 401) {
      console.error(' 401 Unauthorized - Token may be invalid or expired');
    } else if (error.status === 403) {
      console.error(' 403 Forbidden - Insufficient permissions');
    } else if (error.status === 0) {
      console.error(' Network error - Check CORS settings or network connection');
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
    
    console.log(' Making delete wishlist API call with headers:', headers.keys());
    
    return this.http.delete<any>(endpoint, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Delete Wishlist API Error:', err);
          console.error(' Error Status:', err.status);
          console.error(' Error Message:', err.error?.headers?.message || err.message);
          
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting wishlist property';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Get wishlist data
  getWishlistData(): Observable<any> {
    const headers = this.getHeaders();
    console.log(' Making wishlist API call with headers:', headers.keys());
    
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_WISHLIST_PROPERTY}`, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Wishlist API Error:', err);
          console.error(' Error Status:', err.status);
          console.error(' Error Message:', err.error?.headers?.message || err.message);
          
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching wishlist data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
  // Delete property by id
  // deletePropertyById(propertyId: string): Observable<any> {
  //   const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_PROPERTY_BY_ID}/${propertyId}`;
  //   return this.http.delete<any>(endpoint)
  //     .pipe(
  //       catchError((err) => {
  //         const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting property';
  //         return throwError(() => new Error(errorMessage));
  //       })
  //     );
  // }

  deletePropertyById(propertyId: string): Observable<any> {
  const token = this.session.getToken();

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_PROPERTY_BY_ID}/${propertyId}`;

  return this.http.delete<any>(endpoint, { headers }).pipe(
    catchError((err) => {
      const errorMessage =
        err.error?.errorList ||
        err.error?.headers?.message ||
        'An error occurred while deleting property';

      return throwError(() => new Error(errorMessage));
    })
  );
}


  // Get property by ID for editing
  getPropertyById(propertyId: string): Observable<any> {
    const headers = this.getHeaders();
    console.log('Getting property by ID:', propertyId);
    
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_PROPERTY_DETAIL_BY_PROP_ID}${propertyId}`, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Get Property By ID Error:', err);
          const errorMessage = err.error?.headers?.message || err.error?.message || 'An error occurred while fetching property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Update existing property data
  updatePropertyData(propertyData: any): Observable<any> {
    const headers = this.getHeaders();
    console.log(' Updating property data:', propertyData);
    console.log(' Property ID for update:', propertyData.propertyId);
    
    // Check if we have a property ID for the update
    if (!propertyData.propertyId) {
      console.error(' No property ID provided for update');
      return throwError(() => new Error('Property ID is required for updates'));
    }
    
    // Try different approaches for the update API call
    // Approach 1: Use POST method (same as create) - many APIs use POST for both create and update
    console.log(' Attempting update with POST method...');
    
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.POST_YOUR_PROPERTY}`, propertyData, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Update Property Error (POST method):', err);
          console.error(' Error details:', {
            status: err.status,
            statusText: err.statusText,
            url: err.url,
            message: err.message
          });
          
          // If POST fails, try PUT method as fallback
          if (err.status === 0 || err.status === 405) {
            console.log(' POST failed, trying PUT method as fallback...');
            return this.updatePropertyDataWithPUT(propertyData, headers);
          }
          
          if (err.status === 401) {
            return throwError(() => new Error('You must be logged in to update a property. Please login first.'));
          }
          
          const errorMessage = err.error?.headers?.message || err.error?.message || err.message || 'An error occurred while updating property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Fallback method using PUT
  private updatePropertyDataWithPUT(propertyData: any, headers: HttpHeaders): Observable<any> {
    console.log('🔄 Attempting update with PUT method...');
    
    return this.http.put<any>(`${this.baseApiUrl}${AuthEndPoints.POST_YOUR_PROPERTY}`, propertyData, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Update Property Error (PUT method):', err);
          
          // If PUT also fails, try with property ID in URL
          if (err.status === 0 || err.status === 404 || err.status === 405) {
            console.log('PUT failed, trying with property ID in URL...');
            return this.updatePropertyDataWithIdInUrl(propertyData, headers);
          }
          
          const errorMessage = err.error?.headers?.message || err.error?.message || err.message || 'An error occurred while updating property data';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Fallback method with property ID in URL
  private updatePropertyDataWithIdInUrl(propertyData: any, headers: HttpHeaders): Observable<any> {
    console.log(' Attempting update with property ID in URL...');
    
    const updateUrl = `${this.baseApiUrl}${AuthEndPoints.POST_YOUR_PROPERTY}/${propertyData.propertyId}`;
    console.log('Update URL with ID:', updateUrl);
    
    return this.http.put<any>(updateUrl, propertyData, { headers })
      .pipe(
        catchError((err) => {
          console.error(' Update Property Error (with ID in URL):', err);
          
          const errorMessage = err.error?.headers?.message || err.error?.message || err.message || 'Failed to update property. Please try again or contact support.';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
