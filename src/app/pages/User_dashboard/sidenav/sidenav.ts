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

  // Login method tracking
  showChangePassword: boolean = true;

  /**
   * Convert relative image URL to absolute URL if needed
   */
  private getAbsoluteImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // If it's already an absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // If it's a relative URL, prepend the API base URL
    const baseUrl = this.userProfileService.authApiUrl || this.userProfileService.baseApiUrl;
    if (baseUrl && imageUrl.startsWith('/')) {
      return baseUrl + imageUrl;
    }
    
    return imageUrl;
  }
  
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
    
    // Load profile data from session
    this.loadProfileData();
    
    // Subscribe to user role and name changes
    this.subscribeToUserRoleChanges();
    
    // Subscribe to user profile data changes
    this.subscribeToUserProfileData();
    
    // Only load profile data if user is authenticated
    if (this.session.getToken()) {
      this.loadUserProfileFromServer();
    }

    // Check login method to determine if change password should be shown
    this.checkLoginMethod();
  }
  
  loadProfileData() {
    // Profile data should come from NotifierService or be loaded from API
    // This method can be removed or simplified since profile data 
    // is now managed through the user profile service and notifier
    this.profileName = 'User'; // Default name
  }
  
  subscribeToUserRoleChanges() {
    // Listen for user role changes from the notifier service
    const roleSubscription = this.notifier.userRole$.subscribe((role: string) => {
      if (role) {
        this.profileRole = role;
      }
    });
    this.subscriptions.add(roleSubscription);

    // Listen for user name changes from the notifier service
    const nameSubscription = this.notifier.userName$.subscribe((name: string) => {
      if (name) {
        // Don't use default/placeholder names - keep "User" instead
        const defaultNames = ['florina lawrence', 'john doe', 'jane doe', 'test user', 'default user'];
        const isDefaultName = defaultNames.some(defaultName => 
          name.toLowerCase() === defaultName
        );
        
        if (!isDefaultName && name !== 'User') {
          this.profileName = name;
        } else {
          this.profileName = 'User'; // Use "User" for default/placeholder names
        }
      }
    });
    this.subscriptions.add(nameSubscription);
  }

  subscribeToUserProfileData() {
    // Listen for user profile data changes from the notifier service
    const userDataSubscription = this.notifier.userProfileData$.subscribe((userData: any) => {
      // Store the current user data for use in other methods
      this.currentUserData = userData;
      
      if (userData) {
        // Set profile name - only if we have valid, non-default user data
        if (userData.firstName && userData.lastName) {
          const fullName = `${userData.firstName} ${userData.lastName}`.trim();
          
          // Don't use default/placeholder names - keep "User" instead
          const defaultNames = ['florina lawrence', 'john doe', 'jane doe', 'test user', 'default user'];
          const isDefaultName = defaultNames.some(defaultName => 
            fullName.toLowerCase() === defaultName
          );
          
          if (!isDefaultName && fullName !== 'User') {
            this.profileName = fullName;
          } else {
            this.profileName = 'User'; // Use "User" for default/placeholder names
          }
        } else {
          this.profileName = 'User'; // Default when no name data
        }
        
        // Set profile image from API data - try multiple possible field names
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
          console.log('📸 Sidenav: Profile image loaded from user data:', this.profileImageUrl);
        } else {
          console.log('📸 Sidenav: No profile image found in user data');
        }
      } else {
        // No user data - set defaults
        this.profileName = 'User';
      }
    });
    this.subscriptions.add(userDataSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  onEditProfileImage() {
    // Trigger file input click
    this.fileInput.nativeElement.click();
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      console.log('📁 File selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      });
      
      // Validate file type - use only the most common formats that APIs typically support
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        this.toast.showToast('Please select a valid image file (JPG, PNG, or GIF only)', 'error');
        return;
      }
      
      // Also validate file extension as additional check
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        this.toast.showToast('Please select a file with .jpg, .png, or .gif extension', 'error');
        return;
      }
      
      // Validate file size (max 2MB for better compatibility)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        this.toast.showToast(`Image size should be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'error');
        return;
      }
      
      // Validate minimum file size (avoid empty files)
      if (file.size < 1024) { // 1KB minimum
        this.toast.showToast('Image file seems to be corrupted or too small', 'error');
        return;
      }
      
      console.log('✅ File validation passed, proceeding with upload');
      
      // Upload the image to server
      this.uploadProfileImage(file);
    }
  }

  private uploadProfileImage(file: File) {
    // Check authentication before upload
    if (!this.session.getToken()) {
      this.toast.showToast('Please log in to upload profile image', 'error');
      return;
    }

    // Validate file type and size
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      this.toast.showToast('Invalid file format. Please use JPG, PNG, or GIF.', 'error');
      return;
    }

    const fileSize = file.size / 1024 / 1024; // Convert to MB
    if (fileSize > 2) {
      this.toast.showToast('Image file size must be less than 2 MB', 'error');
      return;
    }

    console.log('📤 Preparing to upload profile image:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Create FormData exactly like the working edit-profile component
    const formData = new FormData();
    
    console.log('🧪 Sidenav: Preparing FormData exactly like edit-profile...');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Use the exact same field name as edit-profile component
    formData.append('profilePicture', file);
    console.log('📋 Sidenav: Added file with field name "profilePicture"');
    
    // Get userId for logging but don't add it yet
    const currentUserData = this.currentUserData;
    let userId = null;
    
    if (currentUserData?.id) {
      userId = currentUserData.id;
    } else if (currentUserData?.userId) {
      userId = currentUserData.userId;
    }
    
    if (userId) {
      formData.append('userId', userId);
      console.log('📋 Sidenav: Added userId to FormData:', userId);
    } else {
      console.error('❌ Sidenav: No userId available - this is required for upload');
      this.toast.showToast('Unable to get user ID. Please refresh the page and try again.', 'error');
      return;
    }
    
    console.log('📋 FormData prepared for upload with fields:', Array.from(formData.keys()));
    console.log('🔍 Sidenav: About to call API with FormData containing:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes, ${value.type})` : value);
    });
    
    this.userProfileService.updateProfilePicture(formData).subscribe({
      next: (response) => {
        console.log('✅ Profile image uploaded successfully:', response);
        
        // Check if the response contains the new image URL
        if (response?.profilePicUrl || response?.profileImageUrl || response?.imageUrl) {
          const serverImageUrl = response.profilePicUrl || response.profileImageUrl || response.imageUrl;
          this.profileImageUrl = serverImageUrl;
          console.log('📸 Sidenav: Updated profile image URL from server response:', serverImageUrl);
        } else {
          // Fallback: Use FileReader for immediate display, but rely on server reload for persistence
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
              this.profileImageUrl = e.target.result as string;
              console.log('📸 Sidenav: Using temporary FileReader URL (will be replaced by server URL)');
            }
          };
          reader.readAsDataURL(file);
        }
        
        // Always reload user profile to get the latest data from server
        // This ensures the profile picture URL is properly persisted
        this.loadUserProfileFromServer();
        
        this.toast.showToast('Profile image updated successfully', 'success');
      },
      error: (error) => {
        console.error('❌ Failed to upload profile image:', error);
        console.error('❌ Sidenav: Full error object:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Failed to upload profile image';
        
        // Extract the actual error message from the service
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
        
        // If still getting 400 error, let's try different field names
        if (error.status === 400) {
          console.log('🔄 Sidenav: 400 error received. The API might expect a different field name.');
          console.log('💡 Sidenav: Consider trying "profilePicture", "profileImage", or "image" as field names.');
        }
      }
    });
  }

  private loadUserProfileFromServer() {
    // Check if user has a valid token before making API call
    if (!this.session.getToken()) {
      console.warn('⚠️ No authentication token available, skipping profile load');
      return;
    }

    this.userProfileService.loadUserProfile().subscribe({
      next: (profile) => {
        console.log('✅ Sidenav: Profile loaded successfully:', profile);
        
        // Handle array response structure (loadUserProfile returns any[])
        let profileData = null;
        if (profile && profile.length > 0) {
          // Array response structure - get first element
          profileData = profile[0];
          
          // Check if the first element has recordInfo structure
          if (profileData?.recordInfo) {
            profileData = profileData.recordInfo;
          }
        }
        
        if (profileData) {
          console.log('📋 Sidenav: Updating notifier with profile data:', profileData);
          
          // Also directly update the profile image URL to ensure it's set immediately
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
            console.log('📸 Sidenav: Profile image URL set directly from server data:', this.profileImageUrl);
          }
          
          this.notifier.notifyUserData(profileData);
        } else {
          console.warn('⚠️ Sidenav: No valid profile data found in response');
        }
      },
      error: (err) => {
        console.error('❌ Failed to reload user profile:', err);
        
        // If it's a 401 error, the token might be expired
        if (err.status === 401) {
          console.warn('🔒 Authentication failed - token may be expired');
          // Optionally redirect to login or refresh token
          // this.router.navigate(['/login']);
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
  /**
   * Handle user logout
   */
  logout() {
    console.log('🚪 Sidenav: User logout initiated');
    
    // Clear session data
    this.session.removeCredentials();
    
    // Clear local component data
    this.profileName = 'User';
    this.profileImageUrl = null;
    this.currentUserData = null;
    
    // Notify other components about logout (use both methods for comprehensive cleanup)
    this.notifier.isAuthenticatedSubject.next(false);
    this.notifier.notifyUserData(null);
    this.notifier.notifyToHeader(null);
    
    // Show logout success message
    this.toast.showToast('Logged out successfully', 'success');
    
    // Navigate to home page
    this.router.navigate(['/home']);
    
    console.log('✅ Sidenav: User logged out successfully');
  }

  /**
   * Check login method and set change password visibility
   */
  private checkLoginMethod(): void {
    const loginMethod = this.session.getLoginMethod();
    console.log('🔍 Sidenav: Login method detected:', loginMethod);
    
    // Show change password only for email/password login, hide for Google login
    this.showChangePassword = loginMethod === 'email';
    
    console.log('🔑 Sidenav: Change password visibility:', this.showChangePassword);
  }
}
