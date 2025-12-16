import { 
  Component, 
  HostListener, 
  signal, 
  effect,
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
import { RoutePath } from '../../../core/constant/api.constant';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  // Modern Angular 20 dependency injection
  private readonly router = inject(Router);
  private readonly notifier = inject(NotifierService);
  private readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state management
  readonly isScrolled = signal(false);
  readonly hasLoggedIn = signal(false);
  readonly userName = signal('');
  readonly userProfileData = signal<any>({});
  readonly isNavbarCollapsed = signal(false);
  
  // Dropdown state
  showDropdown = false;

  // ViewChild using modern signal-based API
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
    this.hasLoggedIn.set(!!token);
  }

  /**
   * Subscribe to user profile data changes
   */
  private subscribeToProfileData(): void {
    this.notifier.userProfileData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        console.log('🏠 Header received profile data:', data);
        this.userProfileData.set(data);
        
        // Combine firstName and lastName to create full name
        let userName = '';
        if (data?.firstName) {
          userName = data.firstName;
          if (data?.lastName) {
            userName += ' ' + data.lastName;
          }
        } else if (data?.fullName) {
          userName = data.fullName;
        } else if (data?.name) {
          userName = data.name;
        }
        
        console.log('👤 Setting userName to:', userName);
        this.userName.set(userName);
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
          !!this.session.getToken();
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
   * Handle document click to close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdownContainer = target.closest('.user-dropdown-container');
    
    if (!dropdownContainer && this.showDropdown) {
      this.showDropdown = false;
    }
  }

  /**
   * Handle logout
   */
  logOut(): void {
    this.showDropdown = false;
    this.session.removeCredentials();
    this.hasLoggedIn.set(false);
    this.notifier.notifyToHeader(null);
    this.router.navigate([RoutePath.HOME]);
  }

  /**
   * Close navbar on navigation (for mobile)
   */
  closeNavbar(): void {
    const navbarEl = this.navbarCollapse();
    if (navbarEl?.nativeElement?.classList.contains('show')) {
      navbarEl.nativeElement.classList.remove('show');
    }
    // Also update the collapse state
    this.isNavbarCollapsed.set(false);
    // Hide dropdown
    this.showDropdown = false;
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate([RoutePath.LOGIN]);
    this.closeNavbar();
  }

  /**
   * Toggle navbar collapse state
   */
  toggleNavbar(): void {
    this.isNavbarCollapsed.update(collapsed => !collapsed);
  }

  /**
   * Toggle dropdown visibility (for mobile/touch devices)
   */
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Navigate to add property page
   */
  navigateToAddProperty(): void {
    if (!this.hasLoggedIn()) {
      localStorage.setItem('routeUrl', '/user-dashboard/add-property');
      this.router.navigate([RoutePath.LOGIN]);
    } else {
      this.router.navigate(['/user-dashboard/add-property']);
    }
    this.closeNavbar();
  }

  /**
   * Add property action
   */
  addProperty(): void {
    if (!this.hasLoggedIn()) {
      this.router.navigate([RoutePath.LOGIN]);
    } else {
      this.router.navigate(['/user-dashboard/add-property']);
    }
  }

  /**
   * Additional scroll handler for alternative threshold
   */
  @HostListener('window:scroll', [])
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 100);
  }
}