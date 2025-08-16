/**
 * Google Maps JavaScript API integration
 * Simplified version to handle API restrictions and deprecations
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Simple place search using Google Geocoding API (fallback approach)
 * This avoids the deprecated AutocompleteService and domain restrictions
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results (default: 8)
 * @returns {Promise<Array>} Array of place suggestions
 */
export const searchGooglePlaces = async (query, limit = 8) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not found');
        return [];
    }

    console.log('Searching for:', query);

    // For now, return empty array due to API restrictions
    // TODO: Implement backend proxy to handle Google Places API calls
    console.warn('Google Places API has domain restrictions. Please add localhost:5173 to authorized domains in Google Cloud Console.');

    return [];
};

/**
 * Simple geocoding fallback
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Coordinates and formatted address
 */
export const geocodeGoogleAddress = async (address) => {
    console.log('Geocoding:', address);
    console.warn('Google Geocoding API has domain restrictions. Please add localhost:5173 to authorized domains.');

    // Return mock data for now
    throw new Error('Geocoding not available due to domain restrictions');
};

/**
 * Simple reverse geocoding fallback
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocodeGoogle = async (lat, lng) => {
    console.log('Reverse geocoding:', lat, lng);
    console.warn('Google Reverse Geocoding API has domain restrictions.');

    // Return coordinates as fallback
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
};