# Implementation Plan

- [ ] 1. Set up core authentication infrastructure
  - Create directory structure for auth services, guards, and interceptors
  - Set up TypeScript interfaces and models for authentication
  - Configure Angular dependency injection for auth services
  - _Requirements: 1.1, 3.1_

- [ ] 1.1 Create authentication models and interfaces
  - Define AuthState, User, TokenStorage, and LoginCredentials interfaces
  - Create StorageKeys enum with consistent naming convention
  - Define IStorageUtility, IAuthFacade, and IAuthGuard interfaces
  - _Requirements: 1.2, 3.1_

- [ ]* 1.2 Write property test for interface consistency
  - **Property 11: State change notifications**
  - **Validates: Requirements 3.2**

- [ ] 2. Implement Storage Utility Service
  - Create StorageUtilityService with type-safe localStorage operations
  - Implement JSON serialization/deserialization with error handling
  - Add methods for setItem, getItem, removeItem, clear, and hasItem
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ] 2.1 Implement core storage operations
  - Write setItem and getItem methods with generic type support
  - Add error handling for corrupted JSON data
  - Implement removeItem and clear methods
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 2.2 Write property test for storage utility
  - **Property 1: Storage operations use unified utility**
  - **Validates: Requirements 1.1**

- [ ]* 2.3 Write property test for consistent key usage
  - **Property 2: Token storage uses consistent keys**
  - **Validates: Requirements 1.2**

- [ ]* 2.4 Write property test for corrupted data handling
  - **Property 3: Corrupted data handling**
  - **Validates: Requirements 1.3**

- [ ]* 2.5 Write property test for JSON serialization
  - **Property 5: JSON serialization round-trip**
  - **Validates: Requirements 1.5**

- [ ] 3. Create Auth Facade Service
  - Implement AuthFacadeService with observable-based state management
  - Add login, logout, refreshToken, and isAuthenticated methods
  - Integrate with StorageUtilityService for token management
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.1 Implement authentication state management
  - Create BehaviorSubject for auth state with AuthState interface
  - Implement getCurrentUser and isAuthenticated methods
  - Add token expiration validation logic
  - _Requirements: 3.2, 3.5_

- [ ] 3.2 Implement login and logout operations
  - Create login method with credential validation and token storage
  - Implement logout method with data cleanup and navigation
  - Add error handling and user feedback mechanisms
  - _Requirements: 3.3, 3.4_

- [ ]* 3.3 Write property test for auth state notifications
  - **Property 11: State change notifications**
  - **Validates: Requirements 3.2**

- [ ]* 3.4 Write property test for login storage
  - **Property 12: Successful login storage**
  - **Validates: Requirements 3.3**

- [ ]* 3.5 Write property test for logout cleanup
  - **Property 13: Logout cleanup and navigation**
  - **Validates: Requirements 3.4**

- [ ] 4. Implement Route Guards
  - Create AuthGuard for protecting user-dashboard routes
  - Create PublicGuard for redirecting authenticated users from login/register
  - Add token refresh logic in guards before denying access
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4.1 Create AuthGuard implementation
  - Implement CanActivate interface with authentication checking
  - Add redirect logic for unauthenticated users
  - Integrate token refresh attempt before denying access
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4.2 Create PublicGuard implementation
  - Implement guard to redirect authenticated users away from login/register
  - Add logic to preserve intended destination URLs
  - _Requirements: 8.1_

- [ ]* 4.3 Write property test for unauthenticated protection
  - **Property 6: Unauthenticated route protection**
  - **Validates: Requirements 2.1**

- [ ]* 4.4 Write property test for authenticated access
  - **Property 7: Authenticated route access**
  - **Validates: Requirements 2.2**

- [ ]* 4.5 Write property test for token refresh in guards
  - **Property 8: Expired token refresh attempt**
  - **Validates: Requirements 2.3**

- [ ] 5. Update route configuration
  - Apply AuthGuard to user-dashboard and all child routes
  - Apply PublicGuard to login and register routes
  - Ensure consistent protection across nested routes
  - _Requirements: 2.5_

- [ ] 5.1 Modify app.routes.ts with guard configuration
  - Add AuthGuard to user-dashboard route and children
  - Add PublicGuard to login and register routes
  - Update route configuration imports
  - _Requirements: 2.5_

- [ ] 6. Implement HTTP Interceptor
  - Create AuthInterceptor for automatic header injection
  - Add 401 error handling with token refresh logic
  - Implement request retry mechanism after successful refresh
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6.1 Create basic interceptor structure
  - Implement HttpInterceptor interface
  - Add Authorization header injection for authenticated requests
  - Implement Bearer token formatting
  - _Requirements: 4.1, 4.2_

- [ ] 6.2 Add 401 error handling and token refresh
  - Implement 401 error detection and token refresh logic
  - Add request retry mechanism after successful refresh
  - Prevent duplicate refresh requests for concurrent failures
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 6.3 Add comprehensive error handling
  - Handle refresh token expiration scenarios
  - Add cleanup and redirect logic for failed refresh
  - Implement proper error logging and user feedback
  - _Requirements: 5.3, 5.5, 7.1, 7.2_

- [ ]* 6.4 Write property test for header injection
  - **Property 15: Automatic header injection**
  - **Validates: Requirements 4.1**

- [ ]* 6.5 Write property test for Bearer formatting
  - **Property 16: Bearer token formatting**
  - **Validates: Requirements 4.2**

- [ ]* 6.6 Write property test for 401 refresh handling
  - **Property 20: 401 error refresh attempt**
  - **Validates: Requirements 5.1**

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement wishlist authentication logic
  - Add authentication checks to wishlist actions
  - Implement redirect to login for unauthenticated wishlist attempts
  - Add post-login return navigation to original property page
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 8.1 Create wishlist authentication service
  - Implement service to check authentication before wishlist actions
  - Add redirect logic with URL preservation
  - Integrate with AuthFacade for authentication status
  - _Requirements: 6.3, 6.4_

- [ ] 8.2 Update property components with wishlist protection
  - Modify AllProperty and MainPropertyPage components
  - Add authentication checks before wishlist operations
  - Implement user feedback for authentication requirements
  - _Requirements: 6.1, 6.2, 6.5_

- [ ]* 8.3 Write property test for wishlist redirect
  - **Property 25: Unauthenticated wishlist redirect**
  - **Validates: Requirements 6.3**

- [ ]* 8.4 Write property test for post-login navigation
  - **Property 26: Post-login return navigation**
  - **Validates: Requirements 6.4**

- [ ] 9. Enhance error handling and user experience
  - Add comprehensive error logging throughout auth system
  - Implement user-friendly error messages for all scenarios
  - Add loading indicators for authentication operations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.2, 8.5_

- [ ] 9.1 Implement error logging service
  - Create logging service for authentication errors
  - Add structured logging with error details and context
  - Integrate logging throughout auth services and guards
  - _Requirements: 7.1_

- [ ] 9.2 Add user feedback mechanisms
  - Implement toast/notification service for auth errors
  - Add loading states to auth facade observables
  - Create user-friendly error message mapping
  - _Requirements: 7.2, 8.2, 8.5_

- [ ]* 9.3 Write property test for error logging
  - **Property 28: Error logging**
  - **Validates: Requirements 7.1**

- [ ]* 9.4 Write property test for user-friendly errors
  - **Property 29: User-friendly error messages**
  - **Validates: Requirements 7.2**

- [ ] 10. Configure application providers
  - Register all auth services in app.config.ts
  - Configure HTTP interceptor in provider chain
  - Set up proper dependency injection for all auth components
  - _Requirements: All_

- [ ] 10.1 Update app.config.ts with auth providers
  - Add AuthFacadeService, StorageUtilityService to providers
  - Register AuthGuard and PublicGuard
  - Configure AuthInterceptor in HTTP_INTERCEPTORS
  - _Requirements: All_

- [ ] 11. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.