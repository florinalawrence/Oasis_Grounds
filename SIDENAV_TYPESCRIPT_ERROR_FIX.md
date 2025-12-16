# Sidenav TypeScript Error Fix

## Error
```
TS2339: Property 'userProfileData' does not exist on type 'Sidenav'.
```

## Root Cause
The code was trying to call `this.userProfileData()` as if it was a method, but this property/method didn't exist on the Sidenav component.

## Solution Applied

### 1. Added Private Property to Store User Data
```typescript
private currentUserData: any = null;
```

### 2. Updated Subscription to Store Data
Modified the `subscribeToUserProfileData()` method to store the received user data:
```typescript
subscribeToUserProfileData() {
  const userDataSubscription = this.notifier.userProfileData$.subscribe((userData: any) => {
    // Store the current user data for use in other methods
    this.currentUserData = userData;
    
    // ... rest of the logic
  });
}
```

### 3. Fixed the Error Line
Changed the problematic line from:
```typescript
// Before (ERROR)
const currentUserData = this.userProfileData();

// After (FIXED)
const currentUserData = this.currentUserData;
```

## Files Modified
- `src/app/pages/User_dashboard/sidenav/sidenav.ts`

## Result
- ✅ TypeScript compilation error resolved
- ✅ User profile data is properly stored and accessible
- ✅ Profile picture upload can access userId from stored user data
- ✅ Component maintains all existing functionality

The sidenav component now properly stores and accesses user profile data without TypeScript errors.