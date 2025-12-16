# Leaflet Marker Shadow Fix

## Problem
When using Leaflet maps in Angular applications, you may encounter a 404 error for `marker-shadow.png`:
```
GET http://localhost:4200/media/marker-shadow.png 404 (Not Found)
```

## Root Cause
Leaflet tries to load marker images from a default path that doesn't exist in Angular applications. The marker images (marker-icon.png, marker-icon-2x.png, marker-shadow.png) are not automatically copied from node_modules to the build output.

## Solution Implemented

### 1. Copy Marker Images to Public Folder
The Leaflet marker images have been copied to `public/leaflet/` folder:
- `public/leaflet/marker-icon.png`
- `public/leaflet/marker-icon-2x.png` 
- `public/leaflet/marker-shadow.png`
- `public/leaflet/layers.png`
- `public/leaflet/layers-2x.png`

### 2. Configure Leaflet Icon Paths
In the `MapLocation` component (`src/app/pages/map-location/map-location.ts`):

```typescript
private configureLeafletIconsGlobally(): void {
  if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }
}
```

### 3. Custom Icon Configuration
Additional custom icon configuration for markers:

```typescript
private configureLeafletIcons(): void {
  const iconDefault = L.icon({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  L.Marker.prototype.options.icon = iconDefault;
}
```

## Files Modified
- `src/app/pages/map-location/map-location.ts` - Added icon configuration methods
- `public/leaflet/` - Added marker image files

## Result
- ✅ No more 404 errors for marker images
- ✅ Proper marker shadows display on the map
- ✅ Consistent marker appearance across all map instances
- ✅ Compatible with Angular 20 and modern build systems

## Alternative Solutions
If you prefer a different approach, you can also:
1. Configure assets in `angular.json` to copy from node_modules
2. Use a custom webpack configuration
3. Import images as assets and reference them directly

The current solution using the public folder is the most straightforward and reliable approach.