import { 
  Component, 
  HostListener, 
  signal, 
  inject,
  viewChild,
  ElementRef,
  DestroyRef 
} from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionService } from '../../../services/Session-service/session.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { RoutePath } from '../../../core/constant/api.constant';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  // Dependency injection
  private readonly router = inject(Router);
  private readonly notifier = inject(NotifierService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state management
  readonly isScrolled = signal(false);
  readonly hasLoggedIn = signal(false);
  readonly userName = signal('');
  readonly userProfileData = signal<any>({});
  readonly isNavbarCollapsed = signal(false);
  
  // Dropdown state
  showDropdown = false;

  // Expose RoutePath for template
  readonly RoutePath = RoutePath;

  // ViewChild for navbar collapse element
  readonly navbarCollapse = viewChild<ElementRef>('navbarCollapse');

  constructor() {
    this.initializeAuthState();
    this.subscribeToProfileData();
    this.subscribeToAuthState();
  }

  /**
   * Initialize authentication state from session
   */
  private initializeAuthState(): void {
    const token = this.session.getToken();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.hasLoggedIn.set(!!token || isLoggedIn);
  }

  /**
   * Subscribe to user profile data changes
   */
  private subscribeToProfileData(): void {
    this.notifier.userProfileData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.userProfileData.set(data);

        // Check if this is a new registration (should show "Welcome" only)
        if (data?.isNewRegistration) {
          this.userName.set(''); // Empty name will make getWelcomeText() return "Welcome"
          return;
        }

        // Extract FIRST NAME ONLY with fallbacks for different login types
        let firstName = '';
        
        if (data?.firstName) {
          firstName = data.firstName;
        } else if (data?.given_name) {
          firstName = data.given_name;
        } else if (data?.name) {
          firstName = data.name.split(' ')[0];
        } else if (data?.displayName) {
          firstName = data.displayName.split(' ')[0];
        } else if (data?.email) {
          firstName = data.email.split('@')[0];
        }
        
        this.userName.set(firstName);
      });
  }

  /**
   * Subscribe to authentication state changes
   */
  private subscribeToAuthState(): void {
    this.notifier.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((authenticated) => {
        const isAuth = 
          authenticated === true || 
          !!this.session.getToken() ||
          localStorage.getItem('isLoggedIn') === 'true';
        this.hasLoggedIn.set(isAuth);
      });
  }

  /**
   * Handle window scroll event
   */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 50);
  }

  /**
   * Handle escape key to close navbar and dropdown
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isNavbarCollapsed()) {
      this.closeNavbar();
    }
    if (this.showDropdown) {
      this.showDropdown = false;
    }
  }

  /**
   * Handle document click to close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdownContainer = target.closest('.user-dropdown-container, .has-dropdown');
    const navbarContainer = target.closest('.navbar-collapse, .navbar-toggler');
    
    // Close dropdown if clicking outside
    if (!dropdownContainer && this.showDropdown) {
      this.showDropdown = false;
    }
    
    // Close navbar if clicking outside and it's currently open
    if (!navbarContainer && this.isNavbarCollapsed()) {
      this.closeNavbar();
    }
  }

  /**
   * Get display text for welcome message
   * Matches old logic: "Hi [FirstName]" if name exists, otherwise "Welcome"
   */
  getWelcomeText(): string {
    return this.userName() ? `Hi ${this.userName()}` : 'Welcome';
  }

  /**
   * Handle logout - matches old implementation
   */
  logOut(): void {
    console.log('🚪 Header: User logout initiated');
    
    // Close dropdown first
    this.showDropdown = false;
    
    // Clear session data
    this.session.removeCredentials();
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.setItem('isGoogleUser', 'false');
    
    // Clear local component data
    this.hasLoggedIn.set(false);
    this.userName.set('');
    this.userProfileData.set({});
    
    // Notify other components about logout
    this.notifier.isAuthenticatedSubject.next(false);
    this.notifier.notifyUserData(null);
    this.notifier.notifyToHeader(null);
    
    // Show logout success message
    this.toast.showToast('Logged out successfully', 'success');
    
    // Scroll to top
    this.scrollToTop();
    
    // Navigate to home page
    this.router.navigate([RoutePath.HOME]);
    
    // Reload window (matches old behavior)
    setTimeout(() => {
      window.location.reload();
    }, 200);
    
    console.log('✅ Header: User logged out successfully');
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  /**
   * Close navbar on navigation (for mobile)
   */
  closeNavbar(): void {
    const navbarEl = this.navbarCollapse();
    if (navbarEl?.nativeElement?.classList.contains('show')) {
      navbarEl.nativeElement.classList.remove('show');
    }
    // Update the collapse state
    this.isNavbarCollapsed.set(false);
    // Hide dropdown
    this.showDropdown = false;
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.scrollToTop();
    this.router.navigate([RoutePath.LOGIN]);
    this.closeNavbar();
  }

  /**
   * Toggle navbar collapse state
   */
  toggleNavbar(): void {
    const navbarEl = this.navbarCollapse();
    const isCurrentlyOpen = this.isNavbarCollapsed();
    
    if (isCurrentlyOpen) {
      // Close the navbar
      if (navbarEl?.nativeElement?.classList.contains('show')) {
        navbarEl.nativeElement.classList.remove('show');
      }
      this.isNavbarCollapsed.set(false);
      this.showDropdown = false;
    } else {
      // Open the navbar
      if (navbarEl?.nativeElement) {
        navbarEl.nativeElement.classList.add('show');
      }
      this.isNavbarCollapsed.set(true);
    }
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Navigate to add property page
   */
  navigateToAddProperty(): void {
    if (!this.hasLoggedIn()) {
      // Store the intended route and redirect to login
      localStorage.setItem('routeUrl', '/user-dashboard/add-property');
      this.toast.showToast('Please login to add a property', 'info');
      this.router.navigate([RoutePath.LOGIN]);
    } else {
      // User is logged in, navigate to add property page
      this.router.navigate(['/user-dashboard/add-property']);
    }
    this.closeNavbar();
  }

  /**
   * Add property action - simplified version
   */
  addProperty(): void {
    this.navigateToAddProperty();
  }
}