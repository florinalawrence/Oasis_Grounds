# Authentication System Design Document

## Overview

The authentication system for OasisGrounds will implement a comprehensive security layer using Angular's built-in security features, JWT tokens, and a clean facade pattern. The system will handle both public and protected routes, automatic token refresh, and seamless user experience flows.

## Architecture

The system follows a layered architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   Route Guards  │    │  HTTP Requests  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────┐
                    │     Auth Facade        │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────▼───────────┐
                    │   Storage Utility      │
                    └─────────────────────────┘
```

## Components and Interfaces

### 1. Storage Utility Service

**Purpose:** Centralized local storage management with type safety and error handling.

**Interface:**
```typescript
interface IStorageUtility {
  setItem<T>(key: string, value: T): void;
  getItem<T>(key: string): T | null;
  removeItem(key: string): void;
  clear(): void;
  hasItem(key: string): boolean;
}
```

**Key Features:**
- JSON serialization/deserialization
- Error handling for corrupted data
- Type-safe operations
- Consistent key naming convention

### 2. Auth Facade Service

**Purpose:** Main interface for all authentication operations, abstracting complexity from components.

**Interface:**
```typescript
interface IAuthFacade {
  login(credentials: LoginCredentials): Observable<AuthResult>;
  logout(): void;
  refreshToken(): Observable<string>;
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  authState$: Observable<AuthState>;
}
```

**Key Features:**
- Observable-based state management
- Token validation and refresh
- User session management
- Navigation handling

### 3. Route Guards

**Purpose:** Protect routes based on authentication status.

**Guards:**
- `AuthGuard`: Protects routes requiring authentication
- `PublicGuard`: Redirects authenticated users away from login/register pages

**Interface:**
```typescript
interface IAuthGuard extends CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>;
}
```

### 4. HTTP Interceptor

**Purpose:** Automatically handle authentication headers and token refresh.

**Interface:**
```typescript
interface IAuthInterceptor extends HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>;
}
```

**Key Features:**
- Automatic Authorization header injection
- 401 error handling with token refresh
- Request retry mechanism
- Duplicate refresh prevention

## Data Models

### Authentication State
```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

### User Model
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
}
```

### Token Storage
```typescript
interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: 'Bearer';
}
```

### Storage Keys
```typescript
enum StorageKeys {
  ACCESS_TOKEN = 'oasis_access_token',
  REFRESH_TOKEN = 'oasis_refresh_token',
  USER_DATA = 'oasis_user_data',
  TOKEN_EXPIRES_AT = 'oasis_token_expires_at',
  REDIRECT_URL = 'oasis_redirect_url'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Storage Utility Properties

**Property 1: Storage operations use unified utility**
*For any* authentication data operation, the system should use the Storage_Utility interface rather than direct localStorage calls
**Validates: Requirements 1.1**

**Property 2: Token storage uses consistent keys**
*For any* token storage operation, the system should use predefined StorageKeys constants for access_token and refresh_token
**Validates: Requirements 1.2**

**Property 3: Corrupted data handling**
*For any* corrupted or invalid JSON data in localStorage, the Storage_Utility should return null or default values without throwing exceptions
**Validates: Requirements 1.3**

**Property 4: Authentication data cleanup**
*For any* clear operation, all authentication-related keys should be removed from localStorage
**Validates: Requirements 1.4**

**Property 5: JSON serialization round-trip**
*For any* valid object stored via Storage_Utility, retrieving it should return an equivalent object
**Validates: Requirements 1.5**

### Route Guard Properties

**Property 6: Unauthenticated route protection**
*For any* protected route navigation without valid authentication, the Route_Guard should redirect to login page
**Validates: Requirements 2.1**

**Property 7: Authenticated route access**
*For any* protected route navigation with valid access_token, the Route_Guard should allow access
**Validates: Requirements 2.2**

**Property 8: Expired token refresh attempt**
*For any* route navigation with expired access_token, the Route_Guard should attempt token refresh before denying access
**Validates: Requirements 2.3**

**Property 9: Failed refresh handling**
*For any* failed token refresh attempt, the Route_Guard should clear authentication data and redirect to login
**Validates: Requirements 2.4**

**Property 10: Consistent child route protection**
*For any* user-dashboard child route, the same authentication requirements should apply consistently
**Validates: Requirements 2.5**

### Auth Facade Properties

**Property 11: State change notifications**
*For any* authentication state change, the Auth_Facade should emit observable updates to all subscribers
**Validates: Requirements 3.2**

**Property 12: Successful login storage**
*For any* successful login, tokens and user data should be stored through the Storage_Utility
**Validates: Requirements 3.3**

**Property 13: Logout cleanup and navigation**
*For any* logout operation, all authentication data should be cleared and navigation to home page should occur
**Validates: Requirements 3.4**

**Property 14: Authentication status validation**
*For any* authentication status check, token expiration should be validated and current state returned accurately
**Validates: Requirements 3.5**

### HTTP Interceptor Properties

**Property 15: Automatic header injection**
*For any* HTTP request to protected endpoints with valid access_token, Authorization header should be automatically added
**Validates: Requirements 4.1**

**Property 16: Bearer token formatting**
*For any* request with access_token, the Authorization header should be formatted as "Bearer {token}"
**Validates: Requirements 4.2**

**Property 17: Public endpoint header exclusion**
*For any* request to public endpoints, no authentication headers should be added
**Validates: Requirements 4.3**

**Property 18: Consistent API headers**
*For any* API request, consistent standard headers should be added for proper communication
**Validates: Requirements 4.4**

**Property 19: Unauthenticated request passthrough**
*For any* request made without authentication tokens, the request should proceed normally
**Validates: Requirements 4.5**

### Token Refresh Properties

**Property 20: 401 error refresh attempt**
*For any* API request returning 401 unauthorized, the HTTP_Interceptor should attempt token refresh using refresh_token
**Validates: Requirements 5.1**

**Property 21: Successful refresh retry**
*For any* successful token refresh, the original request should be retried with the new access_token
**Validates: Requirements 5.2**

**Property 22: Failed refresh cleanup**
*For any* failed token refresh, authentication data should be cleared and redirect to login should occur
**Validates: Requirements 5.3**

**Property 23: Duplicate refresh prevention**
*For any* multiple concurrent 401 responses, only one token refresh attempt should be made
**Validates: Requirements 5.4**

**Property 24: Expired refresh token handling**
*For any* expired refresh_token, immediate redirect to login should occur without retry attempts
**Validates: Requirements 5.5**

### Wishlist Action Properties

**Property 25: Unauthenticated wishlist redirect**
*For any* wishlist action attempted without authentication, redirect to login page should occur
**Validates: Requirements 6.3**

**Property 26: Post-login return navigation**
*For any* login completion after wishlist redirect, user should be returned to the original property page
**Validates: Requirements 6.4**

**Property 27: Authenticated wishlist access**
*For any* wishlist action with valid authentication, the action should be allowed to proceed
**Validates: Requirements 6.5**

### Error Handling Properties

**Property 28: Error logging**
*For any* authentication error, detailed error information should be logged for debugging purposes
**Validates: Requirements 7.1**

**Property 29: User-friendly error messages**
*For any* network error during authentication, user-friendly error messages should be displayed
**Validates: Requirements 7.2**

**Property 30: Token parsing error recovery**
*For any* token parsing failure, the error should be handled gracefully and invalid tokens cleared
**Validates: Requirements 7.3**

**Property 31: API error message extraction**
*For any* API response containing error details, relevant error messages should be extracted and displayed
**Validates: Requirements 7.4**

**Property 32: Inconsistent state recovery**
*For any* inconsistent authentication state, the system should reset to a clean unauthenticated state
**Validates: Requirements 7.5**

### User Experience Properties

**Property 33: Redirect URL preservation**
*For any* redirect to login, the intended destination URL should be preserved for post-login navigation
**Validates: Requirements 8.1**

**Property 34: Loading state indication**
*For any* authentication operation in progress, loading indicators should be provided to prevent user confusion
**Validates: Requirements 8.2**

**Property 35: Post-login navigation**
*For any* successful login, navigation should occur to the appropriate dashboard or intended page
**Validates: Requirements 8.3**

**Property 36: Logout state cleanup**
*For any* logout operation, navigation to home page should occur and all user-specific UI state should be cleared
**Validates: Requirements 8.4**

**Property 37: Authentication failure handling**
*For any* authentication failure, clear error messages should be displayed and retry attempts should be allowed
**Validates: Requirements 8.5**

## Error Handling

The authentication system implements comprehensive error handling at multiple levels:

### Storage Layer Errors
- Corrupted JSON data recovery
- Missing key handling
- Storage quota exceeded scenarios
- Browser storage disabled cases

### Network Layer Errors
- Connection timeouts
- Server unavailability
- Invalid response formats
- Rate limiting responses

### Authentication Errors
- Invalid credentials
- Expired tokens
- Malformed tokens
- Server-side validation failures

### State Management Errors
- Inconsistent authentication state
- Race conditions in token refresh
- Concurrent login attempts
- Session conflicts

## Testing Strategy

The authentication system will use a dual testing approach combining unit tests and property-based tests:

### Unit Testing Approach
- Specific authentication flows (login, logout, token refresh)
- Error scenarios with known inputs
- Integration points between services
- Component interaction with auth facade
- Route guard behavior with specific states

### Property-Based Testing Approach
- **Testing Library:** fast-check for TypeScript/Angular
- **Minimum Iterations:** 100 iterations per property test
- **Property Test Tagging:** Each property-based test must include a comment with format: `**Feature: auth-system, Property {number}: {property_text}**`

**Property-based tests will verify:**
- Storage utility operations across all valid input types
- Route guard behavior across all authentication states
- HTTP interceptor behavior across all request types
- Token refresh logic across all error scenarios
- State management consistency across all state transitions

**Unit tests will cover:**
- Specific login/logout flows
- Known error conditions
- Component integration points
- Service method contracts
- Angular-specific behaviors

Both testing approaches are essential: unit tests catch concrete implementation bugs while property tests verify the system behaves correctly across the entire input space, ensuring robust authentication security.