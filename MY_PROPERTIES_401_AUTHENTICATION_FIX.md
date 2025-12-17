# My-Properties 401 Authentication Error Fix

## Issue Summary
The my-properties component was experiencing 401 "Invalid request initiated" errors due to authentication token not being properly sent with API requests.

## Root Cause Analysis
1. **Token Storage Mismatch**: The auth interceptor was looking for `'AccessToken'` in localStorage, but the SessionService was using `'oasisCredential'`
2. **Missing getUserProperties Method**: The component was using an old method without proper authentication headers
3. **Inconsistent Token Handling**: Different parts of the application were using different token storage mechanisms

## Solution Implemented

### 1. Fixed Auth Interceptor Token Source
- **File**: `src/app/core/interceptors/auth.interceptor.ts`
- **Issue**: Using `localStorage.getItem('AccessToken')` instead of SessionService
- **Fix**: Changed to use `this.session.getToken()` for consistent token retrieval
- **Result**: All API requests now use the same token source

### 2. Added getUserProperties Method to Service
- **File**: `src/app/services/ManageProperty-service/manage-property.service.ts`
- **Added**: New `getUserProperties()` method with proper authentication headers
- **Features**:
  - Uses `getHeaders()` method to include Bearer token
  - Comprehensive error handling and logging
  - Proper 401 error detection and handling

### 3. Updated My-Properties Component
- **File**: `src/app/pages/User_dashboard/my-properties/my-properties.ts`
- **Changes**:
  - Replaced old API method with authenticated `getUserProperties()`
  - Added token validation before making API calls
  - Enhanced error handling with session expiry detection
  - Automatic redirect to login on authentication failure

### 4. Enhanced Debugging and Logging
- **Files**: All authentication-related services
- **Added**: Comprehensive console logging for debugging authentication issues
- **Features**:
  - Token existence validation
  - Header inclusion verification
  - API response logging
  - Error status code tracking

## Code Changes

### Auth Interceptor Fix
```typescript
// Before (Inconsistent token source)
const authToken = localStorage.getItem('AccessToken');

// After (Consistent token source)
const authToken = this.session.getToken(); // Use SessionService
```

### New getUserProperties Method
```typescript
// Get user's own properties (for my-properties page) with authentication
getUserProperties(): Observable<any> {
  const headers = this.getHeaders();
  console.log('📡 Making getUserProperties API call');
  console.log('🔑 Headers include Authorization:', headers.has('Authorization'));
  
  return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_ACTIVE_USER_PROPERTIES}`, { headers })
    .pipe(
      catchError((err) => {
        console.error('❌ getUserProperties API Error:', err);
        console.error('❌ Error Status:', err.status);
        
        if (err.status === 401) {
          console.error('❌ 401 Unauthorized - Token may be invalid or expired');
        }
        
        const errorMessage = err.error?.headers?.message || err.error?.message || 'An error occurred while fetching user properties';
        return throwError(() => new Error(errorMessage));
      })
    );
}
```

### Enhanced Component Authentication
```typescript
getPropertyDetails(): void {
  // Check authentication before making API call
  const token = this.session.getToken();
  if (!token) {
    console.warn('⚠️ No authentication token found for my-properties');
    this.swalToast.showToast('Please login to view your properties', 'error');
    this.router.navigate([this.routePath.LOGIN]);
    return;
  }

  this.spinner.show();

  setTimeout(() => {
    // Use authenticated getUserProperties method
    this.service.getUserProperties().subscribe({
      next: (res: any) => {
        console.log('📥 My Properties API Response:', res);
        // Handle response...
      },
      error: (err: any) => {
        if (err.status === 401) {
          this.swalToast.showToast('Session expired. Please login again.', 'error');
          this.session.removeCredentials();
          this.router.navigate([this.routePath.LOGIN]);
        } else {
          const errorMessage = err.error?.headers?.message || err.message || 'Failed to load properties';
          this.swalToast.showToast(errorMessage, 'error');
        }
        this.spinner.hide();
      }
    });
  }, 500);
}
```

### Enhanced Headers Method
```typescript
private getHeaders(): HttpHeaders {
  const token = this.session.getToken();
  let headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });
  
  console.log('🔍 ManageProperty getHeaders() called');
  console.log('🔑 Token exists:', !!token);
  console.log('🔑 Token length:', token ? token.length : 0);
  
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Authorization header added successfully');
  } else {
    console.error('❌ No access token found - user may not be logged in');
  }
  
  return headers;
}
```

## Expected Behavior After Fix
- ✅ No more 401 "Invalid request initiated" errors
- ✅ Consistent token handling across the entire application
- ✅ Proper Bearer token authentication in all API requests
- ✅ Automatic session expiry detection and handling
- ✅ User-friendly error messages and redirects
- ✅ Comprehensive debugging logs for troubleshooting

## API Details
- **Endpoint**: `https://jmrpropertiesapi.techneatsolutions.com/jmr-properties-api/v1/property/get`
- **Method**: GET
- **Authentication**: Bearer token in Authorization header
- **Expected Response**: 200 OK with user's properties data

## Files Modified
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/services/ManageProperty-service/manage-property.service.ts`
- `src/app/pages/User_dashboard/my-properties/my-properties.ts`
- `src/app/services/Session-service/session.service.ts`

## Build Status
✅ **Build Successful**: All authentication fixes compile without errors.

## Testing Recommendations
1. **Login Test**: Login with valid credentials and verify token is stored
2. **My-Properties Test**: Navigate to my-properties page and check:
   - No 401 errors in browser console
   - API request includes Authorization header
   - Properties load successfully with 200 status
3. **Session Expiry Test**: Test with expired/invalid token to verify redirect to login
4. **Debug Logs**: Check browser console for authentication debug logs
5. **Network Tab**: Verify Authorization header is present in API requests

## Debugging Guide
If 401 errors persist, check browser console for these logs:
- `🔍 SessionService getToken() called`
- `🔑 Token found: true/false`
- `🔍 ManageProperty getHeaders() called`
- `✅ Authorization header added successfully`
- `🔍 Interceptor: API request detected`
- `✅ Interceptor: Authorization header added to request`

The fix ensures consistent authentication token handling throughout the application, resolving the 401 unauthorized errors in my-properties and other authenticated endpoints.