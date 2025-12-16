import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastService } from '../Toast-service/toast.service';
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
  
  baseApiUrl: string = environment.baseApiUrl;
  private headers: HttpHeaders;
  countryCodes: any = countryData;
  currencyData: any = currencyDataJson;  
  states: any = stateData;  

  constructor() {
    this.headers = new HttpHeaders();
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
    const token = localStorage.getItem('AccessToken');
    let headers = this.headers;
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No authentication token found. User may not be logged in.');
    }
    
    console.log('Sending property data:', basicDtlReq);
    console.log('API URL:', `${this.baseApiUrl}${AuthEndPoints.POST_YOUR_PROPERTY}`);
    console.log('Has token:', !!token);
    
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
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.AMENITIES}`, featureData, { headers: this.headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving property feature';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save facility data
  saveFacilityData(facilityData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.MANAGE_FACILITY}`, facilityData, { headers: this.headers })
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
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.NEARBY_DETAIL}`, data, { headers: this.headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving nearby details';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Delete nearby detail
  deleteNearByDetail(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.DELETE_NEARBY_DATA}`, data, { headers: this.headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting nearby detail';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  

  // Get property details by filter
  getPropertyDetailsByFilter(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SERARCH_PUBLISHED_PROPERTY}`, data)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while fetching property details';
          return throwError(() => new Error(errorMessage));
        })
      );
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
    return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_PROPERTY_DETAIL_BY_PROP_ID}${propertyId}`, { headers: this.headers })
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
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.BEDROOMS}`, data, { headers: this.headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving room details';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Publish property
  publishProperty(propertyId: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.PUBLISH_PROPERTY}${propertyId}`, { headers: this.headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while publishing property';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Save property to wishlist
  savePropertyToWishList(wishListData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}${AuthEndPoints.SAVE_WISHLIST_PROPERTY}`, wishListData, { headers: this.headers })
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while saving property to wishlist';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Delete wishlist property
  deleteWishListProperty(propertyId: string): Observable<any> {
    const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_WISHLIST_PROPERTY}/${propertyId}`;
    return this.http.delete<any>(endpoint)
      .pipe(
        catchError((err) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred while deleting wishlist property';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Get wishlist data
getWishlistData(): Observable<any> {
  return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_WISHLIST_PROPERTY}`, { headers: this.headers })
    .pipe(
      catchError((err) => {
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
