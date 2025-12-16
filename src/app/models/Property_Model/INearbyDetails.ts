export interface INearbyDetail {
  nearbyLocationInfo:[
    {
    location?: string,
    distance?: number,
    distanceUnit?: string,
    }
  ],
  type: string;
  propertyId?: string;
}