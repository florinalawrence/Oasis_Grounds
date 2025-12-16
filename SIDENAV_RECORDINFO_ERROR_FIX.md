# Sidenav RecordInfo TypeScript Error Fix

## Error
```
TS2339: Property 'recordInfo' does not exist on type 'any[]'.
```

## Root Cause
The `loadUserProfile()` method in `UserProfilesService` returns `Observable<any[]>` (an array), but the code was trying to access `profile?.recordInfo` as if `profile` could be an object with a `recordInfo` property.

Since the method signature is:
```typescript
loadUserProfile(): Observable<any[]>
```

The `profile` parameter is always an array, so accessing `.recordInfo` on it is invalid.

## Solution Applied

### Before (ERROR):
```typescript
// Handle different response structures
let profileData = null;
if (profile?.[0]) {
  // Array response structure
  profileData = profile[0];
} else if (profile?.recordInfo) {  // ❌ ERROR: arrays don't have recordInfo
  // Object with recordInfo structure (like edit-profile)
  profileData = profile.recordInfo;
} else if (profile) {
  // Direct object structure
  profileData = profile;
}
```

### After (FIXED):
```typescript
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
```

## Key Changes

1. **Removed Invalid Array Access** - Removed `profile?.recordInfo` since arrays don't have this property
2. **Proper Array Handling** - Check `profile.length > 0` instead of `profile?.[0]`
3. **Nested RecordInfo Check** - Check if the array element has `recordInfo` structure

## Files Modified
- `src/app/pages/User_dashboard/sidenav/sidenav.ts`

## Result
- ✅ TypeScript compilation error resolved
- ✅ Proper handling of array response from `loadUserProfile()`
- ✅ Support for nested `recordInfo` structure if present in array elements
- ✅ Maintains all existing functionality

The sidenav component now properly handles the array response from the user profile service without TypeScript errors.