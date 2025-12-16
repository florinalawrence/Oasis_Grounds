import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthEndPoints } from '../../core/constant/api.constant';
import { ToastService } from '../Toast-service/toast.service';
import { SessionService } from '../Session-service/session.service';

@Injectable({
  providedIn: 'root'
})
export class PasswordManagementService {
  private http = inject(HttpClient);  
  private swalToast = inject(ToastService);  
  private session = inject(SessionService);
  
  baseApiUrl: string = environment.baseApiUrl;
  authApiUrl: string = environment.authApiUrl;

  /**
   * Get headers with current access token
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    const token = this.session.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Initiate the Forgot Password flow
   * @param initiateReq - The request data to initiate the forgot password process
   * @returns Observable<any>
   */
  InitiateForgotPassword(initiateReq: any): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.FORGOT_PWD_INITIATE}`, initiateReq, { headers: this.getHeaders() })
      .pipe(
        catchError((err: any) => {
          const errorMessage = err.error?.headers?.message || 'An error occurred';
          this.swalToast.showToast(errorMessage, 'error'); 
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Verify the Forgot Password request
   * @param req - The request data to verify the forgot password
   * @returns Observable<any>
   */
  verifyForgotPassword(req: any): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.FORGOT_PWD_VERIFY}`, req, { headers: this.getHeaders() })
      .pipe(
        catchError((err: any) => {
          const errorMessage = err.error?.headers?.message || 'An error occurred';
          this.swalToast.showToast(errorMessage, 'error');  
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Update the Forgot Password
   * @param updateReq - The request data to update the password
   * @returns Observable<any>
   */
  updateForgotPassword(updateReq: any): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.FORGOT_PWD_UPDATE}`, updateReq, { headers: this.getHeaders() })
      .pipe(
        catchError((err: any) => {
          const errorMessage = err.error?.headers?.message || 'An error occurred';
          this.swalToast.showToast(errorMessage, 'error');  
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Change the password
   * @param changeReq - The request data to change the password
   * @returns Observable<any>
   */
  changePassword(changeReq: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.authApiUrl}${AuthEndPoints.CHANGE_PWD}`, changeReq, { headers })
      .pipe(
        catchError((err: any) => {
          const errorMessage = err.error?.headers?.message || 'An error occurred';
          this.swalToast.showToast(errorMessage, 'error');  
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
