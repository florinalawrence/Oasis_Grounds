
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ToastService } from '../Toast-service/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthEndPoints } from '../../core/constant/api.constant';

@Injectable({
  providedIn: 'root'
})
export class NotifierService {
  
  private http = inject(HttpClient);  
  private swalToast = inject(ToastService);  


  public notifyHeader: Subject<any> = new Subject<any>();
  public dataSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public propertyId: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public userData: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public propertyData: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public propertyDataById: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public paginationNo: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public isAuthenticatedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private canDisablePublishToSite: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private userRoleSubject: BehaviorSubject<string> = new BehaviorSubject<string>('Home Buyer');
  private userNameSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  // Observable streams for data sharing
  propertyID$: Observable<any> = this.propertyId.asObservable();
  propertyData$: Observable<any> = this.propertyData.asObservable();
  userProfileData$: Observable<any> = this.userData.asObservable();
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  paginationNo$: Observable<any> = this.paginationNo.asObservable();
  canDisablePublishToSite$: Observable<any> = this.canDisablePublishToSite.asObservable();
  userRole$: Observable<string> = this.userRoleSubject.asObservable();
  userName$: Observable<string> = this.userNameSubject.asObservable();

  baseApiUrl: string = environment.baseApiUrl;

  // Constructor is not needed to inject dependencies anymore
  // Dependencies are injected directly via `inject()`

  // Methods to update different data streams
  notifyToHeader(req: any): void {
    this.notifyHeader.next(req);
  }

  notifyUserData(req: any): void {
    this.userData.next(req);
  }

  notifyDisablePublishToSite(req: any): void {
    this.canDisablePublishToSite.next(req);
  }

  sendPaginationNo(req: any): void {
    this.paginationNo.next(req);
  }

  sendData(req: any): void {
    this.dataSubject.next(req);
  }

  sendPropertyId(req: any): void {
    this.propertyId.next(req);
  }

  passSelectedProperty(req: any): void {
    this.propertyData.next(req);
  }

  notifyUserRoleChange(role: string): void {
    this.userRoleSubject.next(role);
  }

  notifyUserNameChange(name: string): void {
    this.userNameSubject.next(name);
  }

  // Utility method to scroll to top of the page
  scrollToTop(): void {
    window.scrollTo(0, 0);
  }
}
