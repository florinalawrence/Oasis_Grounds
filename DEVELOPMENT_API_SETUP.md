# Development API Configuration

## ✅ Configuration Complete

Your application is now configured to use the **Development API** for login and register operations.

## API Configuration Details

### Production API Server (Updated)
- **Base URL**: `https://api.oasisgrounds.com/jmr-properties-api/v1/`
- **Environment**: Production
- **Google Client ID**: `835703408341-njkljmpcr9l9tkhf90o9ds87pffl8lbk.apps.googleusercontent.com`

### API Endpoints Now Using Development Server

| Operation | Endpoint | Full URL |
|-----------|----------|----------|
| **Login** | `/auth/login` | `https://api.oasisgrounds.com/jmr-properties-api/v1/auth/login` |
| **Register** | `/auth/register` | `https://api.oasisgrounds.com/jmr-properties-api/v1/auth/register` |
| **Google Login** | `/auth/google` | `https://api.oasisgrounds.com/jmr-properties-api/v1/auth/google` |
| **OTP Verification** | `/auth/otpactivation` | `https://api.oasisgrounds.com/jmr-properties-api/v1/auth/otpactivation` |
| **Resend OTP** | `/auth/resendotp` | `https://api.oasisgrounds.com/jmr-properties-api/v1/auth/resendotp` |

## Changes Made

### 1. Environment Configuration (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  applicationId: 'e071a4fe8b8850fdab8dd4e7ec0c18c1',
  
  // Development API Configuration
  // baseApiUrl: 'https://jmrpropertiesapi.techneatsolutions.com/jmr-properties-api/v1/',
  // clientIdForGoogleLogin: '25768610896-hdksqe0a8mccp8521u96m409r04b6af1.apps.googleusercontent.com',
  baseApiUrl:'https://api.oasisgrounds.com/jmr-properties-api/v1/',
clientIdForGoogleLogin:'835703408341-njkljmpcr9l9tkhf90o9ds87pffl8lbk.apps.googleusercontent.com',
  // Other configurations...
};
```

### 2. Proxy Configuration (`proxy.conf.json`)
Updated to point to development server:
```json
{
  "/jmr-properties-api": {
    "target": "https://jmrpropertiesapi.techneatsolutions.com",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### 3. Enhanced Logging
- Added detailed logging in AuthService and UserService
- Console logs show which API endpoints are being used
- Debug tools available in development mode

## Verification Steps

### 1. Check Console Logs
When you load the application, you should see:
```
🔧 AuthService initialized with API URL: https://jmrpropertiesapi.techneatsolutions.com/jmr-properties-api/v1/
📍 Login endpoint: https://jmrpropertiesapi.techneatsolutions.com/jmr-properties-api/v1/auth/login
📍 Register endpoint: https://jmrpropertiesapi.techneatsolutions.com/jmr-properties-api/v1/auth/register
```

### 2. Use Debug Tools (Development Mode)
On the login page, click:
- **"Verify API Config"** - Shows current API configuration
- **"Test API"** - Tests connectivity to development server
- **"Debug Form"** - Shows current form and session state

### 3. Network Tab Verification
1. Open DevTools > Network tab
2. Try login/register
3. Check that requests go to `jmrpropertiesapi.techneatsolutions.com`

## Testing Login & Register

### Login Test
1. Go to login page
2. Enter your registered credentials
3. Check console for API request logs
4. Verify request goes to development server

### Register Test
1. Go to register page
2. Fill in registration form
3. Check console for API request logs
4. Verify request goes to development server

## Troubleshooting

### If Still Using Production API
1. **Clear browser cache** and reload
2. **Restart development server**: `npm start` or `ng serve`
3. **Check console logs** for API URL confirmation
4. **Use "Verify API Config" button** to confirm settings

### If Getting CORS Errors
The proxy configuration should handle CORS, but if you get errors:
1. Make sure development server is restarted
2. Check that proxy.conf.json is correctly configured
3. Verify the development API server allows your domain

### If Authentication Fails
1. **Check console logs** for detailed error messages
2. **Verify development server is running** and accessible
3. **Use debug tools** to inspect request/response data
4. **Check network tab** for actual HTTP requests

## Switching Back to Production

If you need to switch back to production API:
```typescript
// In src/environments/environment.ts
baseApiUrl: 'https://api.oasisgrounds.com/jmr-properties-api/v1/',
clientIdForGoogleLogin: '835703408341-njkljmpcr9l9tkhf90o9ds87pffl8lbk.apps.googleusercontent.com'
```

## Support

If you encounter issues:
1. Check browser console for error messages
2. Use the debug tools in development mode
3. Verify network requests in DevTools
4. Check that development API server is accessible

Your application is now ready to use the development API for all authentication operations! 🚀