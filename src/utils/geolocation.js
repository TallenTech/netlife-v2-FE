/**
 * Geolocation utilities for delivery location services
 */

/**
 * Get user's current location using browser geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export const getCurrentLocation = (options = {}) => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            ...options
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                });
            },
            (error) => {
                let errorMessage = 'Failed to get location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                    default:
                        errorMessage = 'Unknown location error';
                        break;
                }

                reject(new Error(errorMessage));
            },
            defaultOptions
        );
    });
};

/**
 * Check if geolocation is supported and available
 * @returns {boolean}
 */
export const isGeolocationSupported = () => {
    return 'geolocation' in navigator;
};

/**
 * Request location permission (for better UX)
 * @returns {Promise<string>} Permission state: 'granted', 'denied', or 'prompt'
 */
export const checkLocationPermission = async () => {
    if (!navigator.permissions) {
        return 'unknown';
    }

    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state;
    } catch (error) {
        return 'unknown';
    }
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default: 6)
 * @returns {string}
 */
export const formatCoordinates = (lat, lng, precision = 6) => {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};