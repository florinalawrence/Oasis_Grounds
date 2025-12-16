# Google Authentication Troubleshooting Guide

## Issue
Getting "Error occurred while Authenticating/Authorizing Google User Account. Please try again." message when trying to sign in with Google.

## Common Causes & Solutions

### 1. Google Client ID Configuration

**Check if Client ID is properly configured:**
- Open browser console (F12)
- Look for logs starting with "Google Client ID is configured:"
- Verify the Client ID ends with `.apps.googleusercontent.com`

**Fix:**
```typescript
// In src/environments/environment.ts
export const environment = {
  // ... other config
  clientIdForGoogleLogin: 'YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com'
};
```

### 2. Domain Authorization in Google Console

**Problem:** Current domain is not authorized in Google Cloud Console

**Check:**
- Current domain: `window.location.hostname`
- Authorized domains should include: `localhost`, your production domain

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add authorized domains:
   - `http://localhost:4200` (for development)
   - `https://yourdomain.com` (for production)

### 3. API Endpoint Issues

**Check API Configuration:**
```typescript
// Current API endpoint
const apiUrl = environment.baseApiUrl + 'auth/google';
// Should be: https://api.oasisgrounds.com/jmr-properties-api/v1/auth/google
```

**Common API Issues:**
- Server not responding (500 error)
- Invalid token format (400 error)
- Authentication service down (503 error)

### 4. Token Validation Problems

**Server-side token validation might fail due to:**
- Expired Google token
- Invalid token signature
- Clock skew between client and server
- Missing required token claims

### 5. CORS Issues

**If using localhost for development:**
```json
// In proxy.conf.json - make sure this matches your API
{
  "/jmr-properties-api": {
    "target": "https://api.oasisgrounds.com",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

## Debugging Steps

### Step 1: Check Browser Console
Look for these log messages:
- ✅ "Google Auth is ready!"
- ❌ "Google Auth Service is not available"
- 🔄 "Google auth state changed"
- 📤 "Sending Google login payload to API"

### Step 2: Test Google Service
In the login page (development mode only):
1. Click "Test Google Service" button
2. Check console for detailed information
3. Click "Manual Google Sign In" to test direct authentication

### Step 3: Network Tab Analysis
1. Open DevTools > Network tab
2. Try Google sign in
3. Look for request to `/auth/google`
4. Check response status and body

### Step 4: Verify Token
```javascript
// In browser console, after Google sign in attempt:
console.log('Google user:', user);
console.log('Token length:', user?.idToken?.length);
console.log('Token preview:', user?.idToken?.substring(0, 50) + '...');
```

## Error Code Meanings

| Status Code | Meaning | Solution |
|-------------|---------|----------|
| 400 | Bad Request - Invalid token | Check token format, try signing in again |
| 401 | Unauthorized - Token validation failed | Verify Google Client ID configuration |
| 403 | Forbidden - Account not authorized | Contact support or check account permissions |
| 404 | Not Found - API endpoint missing | Verify API URL configuration |
| 500 | Server Error - Backend issue | Try again later or contact support |

## Quick Fixes

### Fix 1: Clear Google Auth State
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then refresh the page
```

### Fix 2: Reset Google Sign-In
```javascript
// In browser console:
gapi.load('auth2', function() {
  gapi.auth2.getAuthInstance().signOut();
});
```

### Fix 3: Check Environment Variables
```bash
# Verify environment configuration
echo "Client ID: ${GOOGLE_CLIENT_ID}"
echo "API URL: ${API_BASE_URL}"
```

## Testing Checklist

- [ ] Google Client ID is configured and valid
- [ ] Current domain is authorized in Google Console
- [ ] API endpoint is accessible
- [ ] Browser console shows no JavaScript errors
- [ ] Network requests are successful
- [ ] Token is being generated and sent to API

## Production Deployment Notes

1. **Update Client ID** for production domain
2. **Add production domain** to Google Console
3. **Update API URLs** in environment.prod.ts
4. **Test on actual domain** (not localhost)

## Contact Support

If the issue persists after trying these solutions:

1. **Collect Debug Information:**
   - Browser console logs
   - Network request/response details
   - Current environment configuration
   - Error messages and timestamps

2. **Include in Support Request:**
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Browser and OS information
   - Whether issue occurs on all devices/browsers

## Development Tools

### Enable Debug Mode
```typescript
// In login component, add this for extra logging:
private enableDebugMode(): void {
  console.log('🐛 Debug mode enabled');
  console.log('Environment:', this.environment);
  console.log('Google Client ID:', this.environment.clientIdForGoogleLogin);
  console.log('API Base URL:', this.environment.baseApiUrl);
}
```

### Test API Directly
```bash
# Test the Google auth endpoint directly
curl -X POST https://api.oasisgrounds.com/jmr-properties-api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "e071a4fe8b8850fdab8dd4e7ec0c18c1",
    "token": "YOUR_GOOGLE_TOKEN",
    "attemptingFrom": "login"
  }'
```

This guide should help identify and resolve most Google authentication issues.