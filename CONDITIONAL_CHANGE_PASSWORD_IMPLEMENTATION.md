# Conditional Change Password Implementation

## Overview
Implemented conditional visibility for the "Change Password" menu item in the sidenav based on the user's login method. The menu item is hidden for Google login users and visible for email/password login users.

## Implementation Details

### 1. Session Service Updates (`session.service.ts`)

#### Enhanced Credential Interface
```typescript
interface OasisCredential {
  token?: string;
  refreshToken?: string;
  loginMethod?: 'email' | 'google';  // Added login method tracking
}
```

#### New Methods Added
```typescript
// Set login method
setLoginMethod(method: 'email' | 'google'): void

// Get login method
getLoginMethod(): 'email' | 'google' | null

// Check if Google login
isGoogleLogin(): boolean

// Check if email login
isEmailLogin(): boolean

// Enhanced setToken method
setToken(token: string, loginMethod: 'email' | 'google' = 'email'): void

// Clear credentials
removeCredentials(): void
```

### 2. Login Method Tracking

#### Google Login (`login.ts`)
```typescript
// Set login method as 'google' when Google login succeeds
if (data.accessToken) {
  this.session.setToken(data.accessToken, 'google');
}
```

#### Email/Password Login (`login.ts`)
```typescript
// Set login method as 'email' when regular login succeeds
if (response.accessToken) {
  this.session.setToken(response.accessToken, 'email');
}
```

#### Google Registration (`register.ts`)
```typescript
// Set login method as 'google' when Google registration succeeds
if (data.accessToken) {
  this.session.setToken(data.accessToken, 'google');
}
```

#### Email Registration Completion (`opt-verification-screen.ts`)
```typescript
// Set login method as 'email' when OTP verification succeeds
if (responseBody.accessToken) {
  this.session.setToken(responseBody.accessToken, 'email');
}
```

### 3. Sidenav Conditional Logic (`sidenav.ts`)

#### Added Property
```typescript
// Login method tracking
showChangePassword: boolean = true;
```

#### Login Method Check
```typescript
private checkLoginMethod(): void {
  const loginMethod = this.session.getLoginMethod();
  console.log('🔍 Sidenav: Login method detected:', loginMethod);
  
  // Show change password only for email/password login, hide for Google login
  this.showChangePassword = loginMethod === 'email';
  
  console.log('🔑 Sidenav: Change password visibility:', this.showChangePassword);
}
```

#### Integration in ngOnInit
```typescript
ngOnInit() {
  // ... existing code ...
  
  // Check login method to determine if change password should be shown
  this.checkLoginMethod();
}
```

### 4. Template Conditional Rendering (`sidenav.html`)

```html
@if (showChangePassword) {
  <a class="nav-item password-icon" routerLink="/user-dashboard/change-password" routerLinkActive="active">
    <i class="bi bi-key"></i>
    <span>Change Password</span>
  </a>
}
```

## User Experience Flow

### Google Login/Registration Users
1. User logs in/registers with Google
2. Session stores `loginMethod: 'google'`
3. Sidenav checks login method
4. `showChangePassword = false`
5. Change Password menu item is **hidden**
6. User cannot access change password functionality

### Email/Password Login/Registration Users
1. User logs in with email/password OR completes email registration via OTP
2. Session stores `loginMethod: 'email'`
3. Sidenav checks login method
4. `showChangePassword = true`
5. Change Password menu item is **visible**
6. User can access change password functionality

## Logic Reasoning

### Why Hide for Google Users?
- Google manages the user's password
- Users should change their password through Google's systems
- No need for in-app password change functionality
- Prevents confusion and potential security issues

### Why Show for Email Users?
- Application manages the user's password
- Users need a way to update their credentials
- Standard security practice to allow password changes
- Users expect this functionality for email-based accounts

## Data Storage

### Session Storage Structure
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "loginMethod": "email" // or "google"
}
```

### Storage Location
- **Key**: `oasisCredential`
- **Location**: `localStorage`
- **Persistence**: Until user logs out or clears browser data

## Error Handling

### Fallback Behavior
- If `loginMethod` is not set or null, defaults to showing Change Password
- Ensures backward compatibility with existing sessions
- Graceful degradation for edge cases

### Session Cleanup
- Login method is cleared when user logs out
- Fresh login method is set on each new login
- No stale data persists between sessions

## Security Considerations

### No Sensitive Data
- Only stores login method type, not actual credentials
- Login method is not sensitive information
- Safe to store in localStorage

### Proper Cleanup
- All session data is cleared on logout
- No data leakage between different user sessions
- Clean state for each new login

## Files Modified

1. **`src/app/services/Session-service/session.service.ts`**
   - Enhanced credential interface
   - Added login method tracking methods
   - Updated setToken method

2. **`src/app/pages/login/login.ts`**
   - Set 'google' method for Google login
   - Set 'email' method for regular login

3. **`src/app/pages/register/register.ts`**
   - Set 'google' method for Google registration

4. **`src/app/pages/opt-verification-screen/opt-verification-screen.ts`**
   - Set 'email' method for email registration completion

5. **`src/app/pages/User_dashboard/sidenav/sidenav.ts`**
   - Added showChangePassword property
   - Added checkLoginMethod method
   - Integrated login method check

6. **`src/app/pages/User_dashboard/sidenav/sidenav.html`**
   - Added conditional rendering for change password menu item

7. **`test-conditional-change-password.html`**
   - Demo page showing the conditional behavior

## Testing

### Test Scenarios
1. **Google Login**: Verify Change Password is hidden
2. **Email Login**: Verify Change Password is visible
3. **Google Registration**: Verify Change Password is hidden
4. **Email Registration**: Verify Change Password is visible after OTP
5. **Session Persistence**: Verify behavior persists across page refreshes
6. **Logout/Login**: Verify correct behavior after switching login methods

The implementation provides a seamless user experience by showing relevant functionality based on how the user authenticated, improving both usability and security.