import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../Toast-service/toast.service';
import { AuthEndPoints } from '../../core/constant/api.constant';
import { SessionService } from '../Session-service/session.service';

import * as countryData from '../../../assets/countryCodes.json';

@Injectable({
  providedIn: 'root'
})
export class UserProfilesService {
  private http = inject(HttpClient); 
  private swalToast = inject(ToastService); 
  private session = inject(SessionService);

  baseApiUrl: string = environment.baseApiUrl;
  authApiUrl: string = environment.authApiUrl;
  countryCodes: any = (countryData as any).default;
  private userDataSubject = new BehaviorSubject<any>(null);

  constructor() {}

  // Get Country Codes
  getCountryCodes() {
    return this.countryCodes;
  }

  /**
   * Get headers with current access token
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    const token = this.session.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('🔑 UserProfile API: Token found and added to headers');
    } else {
      console.warn('⚠️ UserProfile API: No access token found in localStorage');
    }
    
    return headers;
  }

  /**
   * Load User Profile
   * @returns Observable<any>
   */
  loadUserProfile(): Observable<any> {
    const headers = this.getHeaders();
    console.log('Making /profile API call with headers:', headers.keys());
    
    return this.http.get<any>(`${this.authApiUrl}${AuthEndPoints.LOAD_USER_PROFILE}`, { headers })
      .pipe(
        catchError((err: any) => {
          console.error('Profile API Error:', err);
          console.error(' Error Status:', err.status);
          console.error(' Error Message:', err.error?.headers?.message || err.message);
          
          const errorMessage = err.error?.headers?.message || 'An error occurred';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Update User Profile
   * @param updateReq - Request payload
   * @returns Observable<any>
   */
  updateUserProfile(updateReq: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.UPDATE_USER_PROFILE}`, updateReq, { headers })
      .pipe(
        catchError((err: any) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred on updating user profile';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Update Profile Picture
   * @param updateReq - FormData payload
   * @returns Observable<any>
   */
  updateProfilePicture(updateReq: FormData): Observable<any> {
    // For file uploads, we need to get headers WITHOUT Content-Type
    // Let the browser set the Content-Type with boundary for multipart/form-data
    const token = this.session.getToken();
    
    if (!token) {
      console.error('No authentication token available for profile picture upload');
      return throwError(() => new Error('Authentication required. Please log in again.'));
    }
    
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log(' Profile Picture Upload: Token added to headers');
    
    // Don't set Content-Type for FormData - let browser handle it
    const options = { headers };
    
    console.log(' Uploading profile picture to:', `${this.authApiUrl}${AuthEndPoints.UPDATE_PROFILE_PICTURE}`);
    console.log(' FormData contents:');
    updateReq.forEach((value, key) => {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    });
    
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.UPDATE_PROFILE_PICTURE}`, updateReq, options)
      .pipe(
        catchError((err: any) => {
          console.error(' Profile picture upload error:', err);
          console.error(' Error status:', err.status);
          console.error(' Error response:', err.error);
          console.error(' Request URL:', `${this.authApiUrl}${AuthEndPoints.UPDATE_PROFILE_PICTURE}`);
          
          // Log FormData contents for debugging
          console.error(' FormData contents:');
          if (updateReq instanceof FormData) {
            updateReq.forEach((value, key) => {
              console.error(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value);
            });
          }
          
          let errorMessage = 'An error occurred while uploading the image';
          
          // Log the complete error structure for debugging
          console.error(' Complete error object:', JSON.stringify(err.error, null, 2));
          
          // Specifically log the errorList to understand validation errors
          if (err.error?.errorList) {
            console.error(' API Validation Errors (errorList):', err.error.errorList);
            console.error(' ErrorList type:', typeof err.error.errorList);
            console.error(' ErrorList keys:', Object.keys(err.error.errorList));
          }
          
          // Log headers for additional context
          if (err.error?.headers) {
            console.error(' API Response Headers:', err.error.headers);
          }
          
          // Extract error message from various possible locations
          try {
            if (err.error?.headers?.message) {
              errorMessage = err.error.headers.message;
            } else if (err.error?.errorList) {
              // Handle errorList as object or array
              if (typeof err.error.errorList === 'object' && err.error.errorList !== null) {
                if (Array.isArray(err.error.errorList)) {
                  errorMessage = err.error.errorList.join(', ');
                } else {
                  // If errorList is an object, extract its values
                  const errorValues = Object.values(err.error.errorList);
                  errorMessage = errorValues.length > 0 ? errorValues.join(', ') : 'Validation error occurred';
                }
              } else {
                errorMessage = String(err.error.errorList);
              }
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            } else if (err.message) {
              errorMessage = err.message;
            } else if (err.status === 400) {
              errorMessage = 'Invalid request. Please check the image file and try again.';
            } else if (err.status === 401) {
              errorMessage = 'Authentication failed. Please log in again.';
            } else if (err.status === 413) {
              errorMessage = 'Image file is too large. Please choose a smaller image.';
            } else if (err.status === 415) {
              errorMessage = 'Unsupported image format. Please use JPG, PNG, or GIF.';
            }
          } catch (parseError) {
            console.error(' Error parsing error message:', parseError);
            errorMessage = `Upload failed with status ${err.status}. Please try again.`;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Delete Profile Picture
   * @param deleteReq - Request payload
   * @returns Observable<any>
   */
  deleteProfilePicture(deleteReq: any): Observable<any> {
    const headers = this.getHeaders();
    const options = { headers, body: deleteReq };
    return this.http.delete<any>(`${this.authApiUrl}${AuthEndPoints.DELETE_PROFILE_PICTURE}`, options)
      .pipe(
        catchError((err: any) => {
          const errorMessage = err.error?.errorList || err.error?.headers?.message || 'An error occurred on delete an image';
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
