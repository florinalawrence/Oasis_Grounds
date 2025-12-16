import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap } from 'rxjs';
import { NotifierService } from '../Notifier-service/notifier.service';
import { environment } from '../../../environments/environment';
import { IUser } from '../../models/User_Model/IUser.model';
import { AuthEndPoints } from '../../core/constant/api.constant';

@Injectable({
  providedIn: 'root'
})
export class UserService {
 
  private http = inject(HttpClient);
  private notifier = inject(NotifierService);

  baseApiUrl: string = environment.baseApiUrl;
  authApiUrl: string = environment.authApiUrl;
  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor() {
    console.log('UserService initialized with API URL:', this.baseApiUrl);
    console.log('UserService initialized with Auth API URL:', this.authApiUrl);
    console.log('Register endpoint:', `${this.authApiUrl}${AuthEndPoints.REGISTER_USER}`);
    console.log('Verify OTP endpoint:', `${this.authApiUrl}${AuthEndPoints.VERIFY_OTP}`);
    console.log('Resend OTP endpoint:', `${this.authApiUrl}${AuthEndPoints.RESEND_OTP}`);
  }

  // Set user data in BehaviorSubject
  setUserData(data: any): void {
    this.userDataSubject.next(data);
  }

  // Get user data from BehaviorSubject
  getUserData(): any {
    return this.userDataSubject.value;
  }

 
  registerUser(userData: IUser): Observable<any> {
    console.log('API Request Details:');
    console.log('URL:', `${this.authApiUrl}${AuthEndPoints.REGISTER_USER}`);
    console.log('Request Body:', JSON.stringify(userData, null, 2));

    return this.http.post(this.authApiUrl + AuthEndPoints.REGISTER_USER, userData, { 
      headers: this.headers,
      observe: 'response'
    }).pipe(
      tap((response) => {
        console.log('Registration successful:', response);
      }),
      catchError((error: any) => {
        let errorMessage = 'Registration failed';
        let errorDetails = '';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorDetails = error.error;
          } else if (error.error.errorList) {
            errorDetails = JSON.stringify(error.error.errorList);
          } else if (error.error.message) {
            errorDetails = error.error.message;
          } else {
            errorDetails = JSON.stringify(error.error);
          }
        }

        console.log('Error details:', errorDetails);
        return throwError(() => ({
          message: errorMessage,
          details: errorDetails,
          status: error.status,
          fullError: error
        }));
      })
    );
  }

  // Verify user with OTP
  verifyUserWithOTP(userData: any): Observable<any> {
    return this.http.post(this.authApiUrl + AuthEndPoints.VERIFY_OTP, userData, { 
      headers: this.headers,
      observe: 'response'
    }).pipe(
      tap((response) => {
        if (response.status === 200) {
          this.notifier.isAuthenticatedSubject.next(true);
        }
      }),
      catchError((error: any) => {
        let errorMessage = 'OTP verification failed';
        
        if (error.error?.headers?.message) {
          errorMessage = error.error.headers.message;
        }
        
        return throwError(() => ({
          message: errorMessage,
          status: error.status,
          error: error.error
        }));
      })
    );
  }

  // Resend OTP
  resendOtp(otpKey: any): Observable<any> {
    return this.http.post(this.authApiUrl + AuthEndPoints.RESEND_OTP, otpKey, { 
      headers: this.headers 
    }).pipe(
      catchError((error: any) => {
        let errorMessage = 'Failed to resend OTP';
        
        if (error.error?.errorList) {
          errorMessage = error.error.errorList.join(', ');
        } else if (error.error?.headers?.message) {
          errorMessage = error.error.headers.message;
        }
        
        return throwError(() => ({
          message: errorMessage,
          status: error.status,
          error: error.error
        }));
      })
    );
  }
}
