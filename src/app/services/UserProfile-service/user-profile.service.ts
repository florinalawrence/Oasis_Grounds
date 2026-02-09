import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  baseApiUrl: string = environment.baseApiUrl;
  authApiUrl: string = environment.authApiUrl;
  countryCodes: any = (countryData as any).default;
  private userDataSubject = new BehaviorSubject<any>(null);

  constructor() {}

  /**
   * Check if user is authenticated with valid token
   */
  isAuthenticated(): boolean {
    const token = this.session.getToken();
    return !!token;
  }

  /**
   * Validate current token by making a test API call
   */
  validateToken(): Observable<boolean> {
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('No token found'));
    }

    return this.loadUserProfile().pipe(
      switchMap(() => {
        return [true];
      }),
      catchError((err) => {
        if (this.isTokenExpired(err)) {
          this.handleTokenExpiration();
        }
        return [false];
      })
    );
  }

  // Get Country Codes
  getCountryCodes() {
    return this.countryCodes;
  }

  /**
   * Handle token expiration and redirect to login
   */
  private handleTokenExpiration(): void {
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
    console.error(` ${operation} error:`, error);
    console.error('Error Status:', error.status);
    console.error('Error Message:', error.error?.headers?.message || error.message);
    
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
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log(' UserProfile API: Token found and added to headers');
    } else {
      console.warn(' UserProfile API: No access token found in localStorage');
      // If no token, redirect to login immediately
      this.handleTokenExpiration();
    }
    
    return headers;
  }

  /**
   * Load User Profile
   * @returns Observable<any>
   */
  loadUserProfile(): Observable<any> {
    const headers = this.getHeaders();
    console.log(' Making /profile API call with headers:', headers.keys());
    
    return this.http.get<any>(`${this.authApiUrl}${AuthEndPoints.LOAD_USER_PROFILE}`, { headers })
      .pipe(
        catchError((err: any) => this.handleApiError(err, 'Load User Profile'))
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
        catchError((err: any) => this.handleApiError(err, 'Update User Profile'))
      );
  }

  /**
   * Update Profile Picture
   * @param updateReq - FormData payload
   * @returns Observable<any>
   */
  updateProfilePicture(updateReq: FormData): Observable<any> {
    const token = this.session.getToken();
    
    if (!token) {
      console.error(' No authentication token available for profile picture upload');
      this.handleTokenExpiration();
      return throwError(() => new Error('Authentication required. Please log in again.'));
    }
    
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log(' Profile Picture Upload: Token added to headers');
    
    const options = { headers };
    
    console.log(' Uploading profile picture to:', `${this.authApiUrl}${AuthEndPoints.UPDATE_PROFILE_PICTURE}`);
    
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.UPDATE_PROFILE_PICTURE}`, updateReq, options)
      .pipe(
        catchError((err: any) => {
          console.error('Profile picture upload error:', err);
          
          // Check for token expiration first
          if (this.isTokenExpired(err)) {
            this.handleTokenExpiration();
            return throwError(() => new Error('Session expired. Please log in again.'));
          }
          
          let errorMessage = 'An error occurred while uploading the image';
          
          try {
            if (err.error?.headers?.message) {
              errorMessage = err.error.headers.message;
            } else if (err.error?.errorList) {
              if (typeof err.error.errorList === 'object' && err.error.errorList !== null) {
                if (Array.isArray(err.error.errorList)) {
                  errorMessage = err.error.errorList.join(', ');
                } else {
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
            } else {
              // Status-based error messages
              switch (err.status) {
                case 400:
                  errorMessage = 'Invalid request. Please check the image file and try again.';
                  break;
                case 401:
                  errorMessage = 'Authentication failed. Please log in again.';
                  break;
                case 413:
                  errorMessage = 'Image file is too large. Please choose a smaller image.';
                  break;
                case 415:
                  errorMessage = 'Unsupported image format. Please use JPG, PNG, or GIF.';
                  break;
                default:
                  errorMessage = `Upload failed with status ${err.status}. Please try again.`;
              }
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
        catchError((err: any) => this.handleApiError(err, 'Delete Profile Picture'))
      );
  }
}
