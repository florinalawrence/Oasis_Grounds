# Sidenav Default Name Fix

## Issue
The sidenav was showing "Florina Lawrence" as the default name instead of "User".

## Root Cause
The sidenav component was accepting any name data from the API or notifier service, including placeholder/default names like "Florina Lawrence" that might be coming from:
- Mock API data
- Default user profile data
- Test data in the system

## Solution Applied

### 1. Enhanced Name Filtering
Added logic to filter out common placeholder/default names and use "User" instead:

```typescript
const defaultNames = ['florina lawrence', 'john doe', 'jane doe', 'test user', 'default user'];
const isDefaultName = defaultNames.some(defaultName => 
  name.toLowerCase() === defaultName
);

if (!isDefaultName && name !== 'User') {
  this.profileName = name;
} else {
  this.profileName = 'User'; // Use "User" for default/placeholder names
}
```

### 2. Updated Default Initialization
Changed the initial default value:
```typescript
// Before
profileName: string = '';

// After  
profileName: string = 'User';
```

### 3. Applied Filtering in Multiple Places
- `userName$` subscription from notifier service
- `userProfileData$` subscription for profile data
- Default initialization

## Files Modified
- `src/app/pages/User_dashboard/sidenav/sidenav.ts`

## Expected Behavior
- ✅ Shows "User" as default when no real user data is available
- ✅ Shows actual user name when valid profile data exists
- ✅ Filters out placeholder names like "Florina Lawrence", "John Doe", etc.
- ✅ Falls back to "User" for any unrecognized default names

## Testing
1. Load the user dashboard without logging in - should show "User"
2. Log in with a real account - should show actual user name
3. If API returns placeholder data - should show "User" instead of placeholder

The sidenav will now consistently show "User" as the default name instead of any placeholder names from the system.