# API Setup Instructions

## Issue
The Featured Properties section is not showing because the API is not returning data.

## What I Fixed

1. **Created proxy configuration** (`proxy.conf.json`)
   - Routes `/jmr-properties-api` requests to `http://localhost:8080`
   - This prevents CORS issues

2. **Updated angular.json**
   - Added proxy configuration to the serve options

3. **Improved error handling in Properties component**
   - Added console logs to debug API responses
   - Added fallback to try filter method if random API fails
   - Shows helpful error message if backend is not running

## How to Fix

### Option 1: Start Your Backend Server
Make sure your backend API server is running on `http://localhost:8080`

### Option 2: Update Proxy Configuration
If your backend runs on a different port, update `proxy.conf.json`:

```json
{
  "/jmr-properties-api": {
    "target": "http://localhost:YOUR_PORT",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### Option 3: Use Production API
If you want to use a production API, update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  baseApiUrl: 'https://your-api-domain.com/v1/',
  // ... other config
};
```

And remove the proxy configuration from `angular.json`.

## Testing

1. **Restart your Angular dev server** (the proxy config requires a restart):
   ```bash
   npm start
   ```
   or
   ```bash
   ng serve
   ```

2. **Check browser console** for:
   - "API Response:" - Shows what the API returned
   - "JMR Properties found:" - Shows how many JMR properties were filtered
   - Any error messages

3. **Check Network tab** in browser DevTools:
   - Look for requests to `/jmr-properties-api/v1/public/browse/property/random`
   - Check the response status and data

## API Endpoints Being Used

- **Featured Properties**: `GET /jmr-properties-api/v1/public/browse/property/random`
- **Fallback**: `POST /jmr-properties-api/v1/public/browse/property/open/search`

## Expected API Response Format

```json
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "featuredImage": "string",
      "status": "For Sale",
      "propertyOwnerShip": "Jmr Owned Property",
      "type": "string",
      "bedRooms": 3,
      "price": 1000000,
      "currency": "INR",
      "valueUnit": "string",
      "area": 1500,
      "size": "sqft",
      "listPropertyAs": "Owner",
      "availability": {
        "readyToMove": true,
        "availableDate": "2024-01-01"
      },
      "addressInfo": {
        "city": "string",
        "state": "string",
        "country": "string"
      }
    }
  ]
}
```

## Troubleshooting

1. **"Failed to load properties" error**
   - Backend server is not running
   - Wrong port in proxy configuration
   - API endpoint doesn't exist

2. **No properties showing**
   - API returns empty array
   - No properties with `propertyOwnerShip === 'Jmr Owned Property'`
   - Check console logs for actual API response

3. **CORS errors**
   - Make sure proxy is configured correctly
   - Restart Angular dev server after adding proxy

## Contact
If issues persist, check the browser console for detailed error messages.
