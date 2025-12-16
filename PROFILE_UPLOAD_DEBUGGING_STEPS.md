# Profile Picture Upload Debugging Steps

## Current Status
- Getting 400 Bad Request error with `{headers: {…}, errorList: {…}}`
- API is responding but rejecting our FormData structure
- Need to identify what the API expects exactly

## Debugging Steps

### 1. Check Console Logs
When you try to upload a profile picture, check the browser console for:
- `❌ Complete error object:` - Shows the full API response
- `❌ API Validation Errors (errorList):` - Shows specific validation errors
- `❌ FormData contents:` - Shows what we're sending

### 2. Test Different Field Names
The API might expect a different field name. Current test: `file`
Other options to try:
- `profilePicture` (used by edit-profile)
- `image`
- `avatar`
- `profileImage`

### 3. Test With/Without UserId
Current approach includes userId. Try:
- Without userId at all
- With userId from different sources
- With userId as a separate request parameter

### 4. Check API Response Structure
Look for these in the console:
```javascript
// What we expect to see in errorList:
{
  "fieldName": "Expected field name is 'xyz'",
  "userId": "UserId is required/invalid",
  "fileType": "Invalid file type",
  "fileSize": "File too large"
}
```

### 5. Compare with Working Examples
- Check if edit-profile component actually works
- Compare with property image uploads (which work)
- Look for differences in headers, FormData structure

## Quick Test Script
Use the `debug-profile-upload.js` script in browser console to test different configurations quickly.

## Expected Solutions

### If errorList shows field name issues:
```typescript
formData.append('correctFieldName', file);
```

### If errorList shows userId issues:
```typescript
// Remove userId entirely, or
// Get userId from correct source, or
// Pass userId differently
```

### If errorList shows file validation issues:
```typescript
// Check file type validation
// Check file size limits
// Check file format requirements
```

## Next Steps
1. Run the upload and check console logs
2. Identify what errorList contains
3. Adjust FormData based on error details
4. Test systematically until we find the correct format