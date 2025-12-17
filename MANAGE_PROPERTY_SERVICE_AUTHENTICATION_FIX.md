# ManagePropertyService Authentication Fix

## Issue
The ManagePropertyService was causing 401 "Invalid request initiated" errors because it wasn't properly handling authentication headers for API calls.

## Root Cause
The service was using a static `headers` property initialized as empty `HttpHeaders()` in the constructor, which never included the authentication token. This is different from other services like `UserProfileService` that dynamically create headers with tokens.

## Comprehensive Fix Applied

### 1. Added SessionService Injection
```typescript
// Added SessionService import and injection
import { SessionService } from '../Session-service/session.service';

export class ManagePropertyService {
  private http = inject(HttpClient);  
  private swalToast = inject(ToastService);
  private session = inject(SessionService); // Added this
  
  // Removed the static headers property
  // private headers: HttpHeaders; // REMOVED
}
```

### 2. Added Dynamic getHeaders() Method
```typescript
/**
 * Get headers with current access token
 * @returns HttpHeaders
 */
private getHeaders(): HttpHeaders {
  const token = this.session.getToken();
  let headers = new HttpHeaders();
  
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log('🔑 ManageProperty API: Token found and added to headers');
  } else {
    console.warn('⚠️ ManageProperty API: No access token found');
  }
  
  return headers;
}
```

### 3. Updated getWishlistData() Method
**Before (No Authentication):**
```typescript
getWishlistData(): Observable<any> {
  return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_WISHLIST_PROPERTY}`, { headers: this.headers })
}
```

**After (With Dynamic Authentication):**
```typescript
getWishlistData(): Observable<any> {
  const headers = this.getHeaders();
  console.log('📡 Making wishlist API call with headers:', headers.keys());
  
  return this.http.get<any>(`${this.baseApiUrl}${AuthEndPoints.GET_WISHLIST_PROPERTY}`, { headers })
}
```

### 4. Updated deleteWishListProperty() Method
**Before (No Authentication):**
```typescript
deleteWishListProperty(propertyId: string): Observable<any> {
  const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_WISHLIST_PROPERTY}/${propertyId}`;
  return this.http.delete<any>(endpoint) // No headers
}
```

**After (With Dynamic Authentication):**
```typescript
deleteWishListProperty(propertyId: string): Observable<any> {
  const headers = this.getHeaders();
  const endpoint = `${this.baseApiUrl}${AuthEndPoints.DELETE_WISHLIST_PROPERTY}/${propertyId}`;
  
  return this.http.delete<any>(endpoint, { headers })
}
```

### 5. Updated savePropertyData() Method
**Before (Manual Token Handling):**
```typescript
savePropertyData(basicDtlReq: any): Observable<any> {
  const token = localStorage.getItem('AccessToken');
  let headers = this.headers;
  
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  // ... rest of method
}
```

**After (Using getHeaders()):**
```typescript
savePropertyData(basicDtlReq: any): Observable<any> {
  const headers = this.getHeaders();
  // ... rest of method uses headers
}
```

## Key Improvements

### ✅ Consistent Authentication Pattern
- All methods now use the same `getHeaders()` approach
- Matches the pattern used in `UserProfileService`
- Dynamic token retrieval for each API call

### ✅ Proper Token Management
- Uses `SessionService.getToken()` instead of direct localStorage access
- Consistent with other services in the application
- Automatic token inclusion in all authenticated requests

### ✅ Enhanced Debugging
- Added comprehensive logging for API calls
- Headers logging for troubleshooting
- Better error tracking and reporting

### ✅ Centralized Header Management
- Single `getHeaders()` method for all authentication
- Easy to maintain and update
- Consistent behavior across all methods

## Files Modified
- `src/app/services/ManageProperty-service/manage-property.service.ts`

## Expected Results
- ✅ **No More 401 Errors**: All API calls now include proper authentication headers
- ✅ **Consistent Behavior**: Matches other services like UserProfileService
- ✅ **200 Status Codes**: Wishlist API should return proper status codes
- ✅ **Better Debugging**: Enhanced logging for troubleshooting API issues

## Testing Steps
1. **Wishlist Load**: Access my-favourites → Should load without 401 errors
2. **Empty Wishlist**: User with no favorites → Should show 200 status and empty message
3. **Delete Favorite**: Remove a favorite → Should work with proper authentication
4. **Property Operations**: Add/edit properties → Should work with consistent authentication
5. **Token Expiry**: When token expires → Should show proper authentication errors

## Comparison with Other Services
This fix brings `ManagePropertyService` in line with other properly implemented services:
- ✅ **UserProfileService**: Uses `getHeaders()` method ✓
- ✅ **ManagePropertyService**: Now uses `getHeaders()` method ✓
- ✅ **Consistent Pattern**: All services follow the same authentication approach ✓

The service now properly handles authentication for all API calls, eliminating 401 errors and providing consistent behavior across the application.