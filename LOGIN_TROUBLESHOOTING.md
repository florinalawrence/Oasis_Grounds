# Login Troubleshooting Guide

## Issue
Getting "Invalid credentials" error when trying to login with correct email and password.

## Common Causes & Solutions

### 1. API Connectivity Issues
**Check if API is reachable:**
- Open browser console (F12)
- Click "Test API" button in login form (development mode)
- Look for network requests in DevTools

### 2. Incorrect API Endpoint
**Current API endpoint:** `https://api.oasisgrounds.com/jmr-properties-api/v1/auth/login`

**Verify endpoint is correct:**
```bash
curl -X POST https://api.oasisgrounds.com/jmr-properties-api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"e071a4fe8b8850fdab8dd4e7ec0c18c1","email":"test@example.com","password":"test123"}'
```

### 3. Request Format Issues
**Expected request format:**
```json
{
  "applicationId": "e071a4fe8b8850fdab8dd4e7ec0c18c1",
  "email": "user@example.com",
  "password": "userpassword"
}
```

### 4. Password/Email Case Sensitivity
- Passwords are case-sensitive
- Email addresses should be lowercase
- Check for extra spaces in email/password

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for these messages:
   - "🚀 Attempting login with:"
   - "✅ Login API response:"
   - "❌ Login API error:"

### Step 2: Check Network Tab
1. Open DevTools > Network tab
2. Try logging in
3. Look for POST request to `/auth/login`
4. Check request payload and response

### Step 3: Use Debug Tools (Development Mode)
1. Click "Debug Form" to see current form values
2. Click "Test API" to check connectivity
3. Verify all values are correct

## Common Error Codes

| Status | Meaning | Solution |
|--------|---------|----------|
| 400 | Bad Request | Check request format |
| 401 | Invalid Credentials | Verify email/password |
| 403 | Account Locked | Contact support |
| 404 | Endpoint Not Found | Check API URL |
| 500 | Server Error | Try again later |

## Quick Fixes

### Fix 1: Clear Browser Data
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 2: Check Account Status
- Verify account is activated
- Check if email verification is required
- Ensure account is not suspended

### Fix 3: Password Reset
If you're sure the credentials are correct:
1. Try password reset
2. Use the new password to login
3. Check if account requires reactivation

## Contact Support
If issues persist, provide:
- Browser console logs
- Network request details
- Account email address
- Error messages and timestamps