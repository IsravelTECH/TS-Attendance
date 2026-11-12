/**
 * Haversine formula to compute distance between two latitude/longitude points in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export interface GeofenceValidationResult {
  isInside: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  message: string;
}

export function validateCampusGeofence(
  userLat: number,
  userLng: number,
  campusLat: number,
  campusLng: number,
  allowedRadiusMeters: number
): GeofenceValidationResult {
  const distance = calculateDistanceMeters(userLat, userLng, campusLat, campusLng);
  const isInside = distance <= allowedRadiusMeters;

  return {
    isInside,
    distanceMeters: Math.round(distance),
    allowedRadiusMeters,
    message: isInside
      ? `Within school campus perimeter (${Math.round(distance)}m from center).`
      : `Outside school campus! Current distance: ${Math.round(distance)}m, allowed radius: ${allowedRadiusMeters}m.`
  };
}
