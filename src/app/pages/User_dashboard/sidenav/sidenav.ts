import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../services/Session-service/session.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { UserProfilesService } from '../../../services/UserProfile-service/user-profile.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav implements OnInit, OnDestroy {

  breadcrumbHtml: string = '<a [routerLink]="[\'/home\']">Home</a>&nbsp;/&nbsp;<span class="active">My Profile</span>';
  profileImageUrl: string | null = null;
  profileName: string = 'User';
  profileRole: string = 'Home Buyer';
  
  private subscriptions: Subscription = new Subscription();
  private currentUserData: any = null;


  
  showChangePassword: boolean = true;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    private session: SessionService,
    private toast: ToastService,
    private notifier: NotifierService,
    private userProfileService: UserProfilesService
  ) {}

  ngOnInit() {
    
    this.updateBreadcrumb();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumb();
    });
    
    // this.loadProfileData();
    
    this.subscribeToUserRoleChanges();
    
    this.subscribeToUserProfileData();
    
    this.checkLoginMethod();
    
    this.initializeProfileData();
    
  
    
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }


  
  private getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    const baseUrl = this.userProfileService.authApiUrl || this.userProfileService.baseApiUrl;
    if (baseUrl && imageUrl.startsWith('/')) {
      return baseUrl + imageUrl;
    }
    
    return imageUrl;
  }

 

  subscribeToUserRoleChanges() {
  const nameSubscription = this.notifier.userName$.subscribe((name: string) => {
    if (name && name.trim()) {
      this.profileName = name.split(' ')[0];
    }
  });

  this.subscriptions.add(nameSubscription);
}


  subscribeToUserProfileData() {
    const userDataSubscription = this.notifier.userProfileData$.subscribe((userData: any) => {
      
      this.currentUserData = userData;
      
      if (userData) {
      const loginMethod = this.session.getLoginMethod();
        
        let firstName = '';
        
        if (userData.firstName) {
          firstName = userData.firstName.trim();
        } else if (userData.given_name) {
          firstName = userData.given_name.trim();
        } else if (userData.name) {
          firstName = userData.name.split(' ')[0].trim();
        } else if (userData.displayName) {
          firstName = userData.displayName.split(' ')[0].trim();
        } else if (userData.email) {
          firstName = userData.email.split('@')[0];
        }
        
        const defaultNames = ['test', 'user', 'default'];
        const isDefaultName = defaultNames.some(defaultName => 
          firstName.toLowerCase() === defaultName
        );
        
        if (firstName && !isDefaultName && firstName !== 'User') {
          this.profileName = firstName;
          
          this.notifier.notifyUserNameChange(firstName);
        } else {
          this.profileName = 'User'; 
          
          
        }
        
        
        
        const possibleImageFields = [
          userData.profilePicUrl,
          userData.profileImageUrl, 
          userData.profileImage,
          userData.profilePicture,
          userData.imageUrl,
          userData.avatar,
          userData.picture
        ];
        
        const imageUrl = possibleImageFields.find(url => url && url.trim() !== '');
        if (imageUrl) {
          this.profileImageUrl = this.getAbsoluteImageUrl(imageUrl);
        }
      }
    });
    this.subscriptions.add(userDataSubscription);
  }

  onEditProfileImage() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      console.log(' File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      });
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        this.toast.showToast('Please select a valid image file (JPG, PNG, or GIF only)', 'error');
        return;
      }
      
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        this.toast.showToast('Please select a file with .jpg, .png, or .gif extension', 'error');
        return;
      }
      
      const maxSize = 2 * 1024 * 1024; 
      if (file.size > maxSize) {
        this.toast.showToast(`Image size should be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'error');
        return;
      }
      
      if (file.size < 1024) { 
        
        this.toast.showToast('Image file seems to be corrupted or too small', 'error');
        return;
      }
      
      console.log(' File validation passed, proceeding with upload');
      
    
      
      this.uploadProfileImage(file);
    }
  }

  private uploadProfileImage(file: File) {
   
    
    if (!this.session.getToken()) {
      this.toast.showToast('Please log in to upload profile image', 'error');
      return;
    }

    
    
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      this.toast.showToast('Invalid file format. Please use JPG, PNG, or GIF.', 'error');
      return;
    }

    const fileSize = file.size / 1024 / 1024; 
    
    if (fileSize > 2) {
      this.toast.showToast('Image file size must be less than 2 MB', 'error');
      return;
    }

  

    const formData = new FormData();
    
    
    
    formData.append('profilePicture', file);
    
    const currentUserData = this.currentUserData;
    let userId = null;
    
    if (currentUserData?.id) {
      userId = currentUserData.id;
    } else if (currentUserData?.userId) {
      userId = currentUserData.userId;
    }
    
    if (userId) {
      formData.append('userId', userId);
    } else {
      this.toast.showToast('Unable to get user ID. Please refresh the page and try again.', 'error');
      return;
    }
    
    formData.forEach((value, key) => {
    });
    
    this.userProfileService.updateProfilePicture(formData).subscribe({
      next: (response) => {
        
        if (response?.profilePicUrl || response?.profileImageUrl || response?.imageUrl) {
          const serverImageUrl = response.profilePicUrl || response.profileImageUrl || response.imageUrl;
          this.profileImageUrl = serverImageUrl;
        } else {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
              this.profileImageUrl = e.target.result as string;
            }
          };
          reader.readAsDataURL(file);
        }
        

        this.loadUserProfileFromServer();
        
        this.toast.showToast('Profile image updated successfully', 'success');
      },
      error: (error) => {
        
        let errorMessage = 'Failed to upload profile image';
        
        if (error.message && error.message !== '[object Object]') {
          errorMessage = error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid image file. Please try a different image file (JPG, PNG, or GIF format).';
        } else if (error.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.status === 413) {
          errorMessage = 'Image file is too large. Please choose a smaller image.';
        } else if (error.status === 415) {
          errorMessage = 'Unsupported image format. Please use JPG, PNG, or GIF.';
        }
        
        this.toast.showToast(errorMessage, 'error');
        
        if (error.status === 400) {
        }
      }
    });
  }
  private loadUserProfileFromServer() {
    if (!this.session.getToken()) {
      return;
    }

    this.userProfileService.loadUserProfile().subscribe({
      next: (response) => {
     
        
        let profileData = null;
        
        if (response && typeof response === 'object') {
          if (response.recordInfo) {
            profileData = response.recordInfo;
          }
          else if (Array.isArray(response) && response.length > 0) {
            const firstElement = response[0];
            if (firstElement && firstElement.recordInfo) {
              profileData = firstElement.recordInfo;
            } else if (firstElement && (firstElement.firstName || firstElement.name || firstElement.email || firstElement.id)) {
              profileData = firstElement;
            }
          }
          else if (response.firstName || response.name || response.email || response.id) {
            profileData = response;
          }
          else if (response.data) {
            if (response.data.recordInfo) {
              profileData = response.data.recordInfo;
            } else if (response.data.firstName || response.data.name || response.data.email) {
              profileData = response.data;
            }
          }
        }
        
        if (profileData && typeof profileData === 'object') {
          
          
          this.session.setUserData(profileData);
          
          const possibleImageFields = [
            profileData.profilePicUrl,
            profileData.profileImageUrl, 
            profileData.profileImage,
            profileData.profilePicture,
            profileData.imageUrl,
            profileData.avatar,
            profileData.picture
          ];
          
          const imageUrl = possibleImageFields.find(url => url && url.trim() !== '');
          if (imageUrl) {
            this.profileImageUrl = this.getAbsoluteImageUrl(imageUrl);
          } else {
          }
          
          
          
          const loginMethod = this.session.getLoginMethod();
          this.applyUserDataToProfile(profileData, loginMethod || 'email');
          
        
          
          this.notifier.notifyUserData(profileData);
          
         
          
          this.notifier.isAuthenticatedSubject.next(true);
          
        } else {
          

          if (response) {
            if (Array.isArray(response)) {
              if (response.length > 0) {
              }
            }
          }
        }
      },
      error: (err) => {
      
        
        if (err.status === 401) {
          this.session.removeCredentials();
          this.notifier.isAuthenticatedSubject.next(false);
          this.router.navigate(['/login']);
        } else {
          console.warn(' Sidenav: Profile load failed, maintaining current state');
        }
      }
    });
  }

  updateBreadcrumb() {
    const url = this.router.url;
    if (url.includes('my-property')) {
      this.breadcrumbHtml = '<a [routerLink]="[\'/home\']">Home</a>&nbsp;/&nbsp;<a [routerLink]="[\'edit-profile\']">My Profile</a>&nbsp;/&nbsp;<span class="active">My Properties</span>';
    } else if (url.includes('edit-profile')) {
      this.breadcrumbHtml = '<a [routerLink]="[\'/home\']">Home</a>&nbsp;/&nbsp;<span class="active">My Profile</span>';
    } else if (url.includes('favorites')) {
      this.breadcrumbHtml = '<a [routerLink]="[\'/home\']">Home</a>&nbsp;/&nbsp;<a [routerLink]="[\'edit-profile\']">My Profile</a>&nbsp;/&nbsp;<span class="active">My Favorites</span>';
    } else if (url.includes('add-property')) {
      this.breadcrumbHtml = '<a [routerLink]="[\'/home\']">Home</a>&nbsp;/&nbsp;<a [routerLink]="[\'edit-profile\']">My Profile</a>&nbsp;/&nbsp;<span class="active">Add Property</span>';
    } else {
      this.breadcrumbHtml = '<a [routerLink]="[\'/home\']">Home</a>&nbsp;/&nbsp;<span class="active">My Profile</span>';
    }
  }

 
  
  logout() {
    
    this.session.removeCredentials();
    
    this.profileName = 'User';
    this.profileRole = 'Home Buyer';
    this.profileImageUrl = null;
    this.currentUserData = null;
    
    this.notifier.isAuthenticatedSubject.next(false);
    this.notifier.notifyUserData(null);
    this.notifier.notifyToHeader(null);
    
    this.toast.showToast('Logged out successfully', 'success');
    
    this.router.navigate(['/home']);
    
  }

 
  private initializeProfileData(): void {
    const token = this.session.getToken();
    const loginMethod = this.session.getLoginMethod();
    
   
    
    if (!token) {
      this.profileName = 'User';
      this.profileRole = 'Home Buyer';
      this.profileImageUrl = null;
      return;
    }
    
    const cachedUserData = this.session.getUserData();
    if (cachedUserData) {
      this.applyUserDataToProfile(cachedUserData, loginMethod || 'email');
    }
    
  
    setTimeout(() => {
      this.loadUserProfileFromServer();
    }, 300);
  }
  

  private applyUserDataToProfile(userData: any, loginMethod: string): void {
    if (!userData) {
      return;
    }
    
   
    
    let firstName = '';
    if (userData.firstName) {
      firstName = userData.firstName.trim();
    } else if (userData.given_name) {
      firstName = userData.given_name.trim();
    } else if (userData.name) {
      firstName = userData.name.split(' ')[0].trim();
    } else if (userData.displayName) {
      firstName = userData.displayName.split(' ')[0].trim();
    }
    
    this.profileName = firstName || 'User';
    
    
    if (userData.userType) {
      this.profileRole = userData.userType;
    } else if (userData.role) {
      this.profileRole = userData.role;
    }
    
    const possibleImageFields = [
      userData.profilePicUrl,
      userData.profileImageUrl, 
      userData.profileImage,
      userData.profilePicture,
      userData.imageUrl,
      userData.avatar,
      userData.picture
    ];
    
    const imageUrl = possibleImageFields.find(url => url && url.trim() !== '');
    if (imageUrl) {
      this.profileImageUrl = this.getAbsoluteImageUrl(imageUrl);
    }
  }


  
  private checkLoginMethod(): void {
    const loginMethod = this.session.getLoginMethod();
    
  
    
    this.showChangePassword = loginMethod === 'email';
    
  }

 
  public refreshProfile(): void {
    this.loadUserProfileFromServer();
  }
}