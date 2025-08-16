/**
 * Google Maps JavaScript API integration
 * Now with actual API calls since domain restrictions are removed
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Track if Google Maps is loaded
let isGoogleMapsLoaded = false;
let googleMapsPromise = null;

/**
 * Load Google Maps JavaScript API
 * @returns {Promise<void>}
 */
const loadGoogleMaps = () => {
    if (isGoogleMapsLoaded) {
        return Promise.resolve();
    }

    if (googleMapsPromise) {
        return googleMapsPromise;
    }

    googleMapsPromise = new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.google && window.google.maps) {
            isGoogleMapsLoaded = true;
            resolve();
            return;
        }

        // Create script tag with proper async loading
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;

        // Global callback function
        window.initGoogleMaps = () => {
            isGoogleMapsLoaded = true;
            resolve();
        };

        script.onerror = () => {
            reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
    });

    return googleMapsPromise;
};

/**
 * Search for places using Google Places Autocomplete Service
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

    try {
        await loadGoogleMaps();

        return new Promise((resolve) => {
            const service = new window.google.maps.places.AutocompleteService();

            service.getPlacePredictions({
                input: query,
                componentRestrictions: { country: 'ug' } // Uganda only
                // Removed types to allow all place types (addresses, businesses, landmarks)
            }, async (predictions, status) => {
                if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
                    console.warn('Google Places search status:', status);
                    resolve([]);
                    return;
                }

                // Get place details for coordinates
                const placesService = new window.google.maps.places.PlacesService(
                    document.createElement('div')
                );

                const results = await Promise.all(
                    predictions.slice(0, limit).map(prediction =>
                        new Promise((resolvePlace) => {
                            placesService.getDetails({
                                placeId: prediction.place_id,
                                fields: ['geometry', 'formatted_address', 'name']
                            }, (place, detailStatus) => {
                                if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                                    // For businesses, prioritize business name over formatted address
                                    const displayAddress = place.name && place.name !== place.formatted_address
                                        ? `${place.name}, ${place.formatted_address}`
                                        : place.formatted_address || prediction.description;

                                    resolvePlace({
                                        address: displayAddress,
                                        lat: place.geometry.location.lat(),
                                        lng: place.geometry.location.lng(),
                                        place_id: prediction.place_id,
                                        types: prediction.types,
                                        source: 'google',
                                        name: place.name,
                                        formatted_address: place.formatted_address
                                    });
                                } else {
                                    // Return without coordinates if details fail
                                    resolvePlace({
                                        address: prediction.description,
                                        lat: null,
                                        lng: null,
                                        place_id: prediction.place_id,
                                        types: prediction.types,
                                        source: 'google'
                                    });
                                }
                            });
                        })
                    )
                );

                resolve(results);
            });
        });

    } catch (error) {
        console.error('Google Places search failed:', error);
        return [];
    }
};

/**
 * Geocode an address using Google Geocoding Service
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Coordinates and formatted address
 */
export const geocodeGoogleAddress = async (address) => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not found');
    }

    try {
        await loadGoogleMaps();

        return new Promise((resolve, reject) => {
            const geocoder = new window.google.maps.Geocoder();

            geocoder.geocode({
                address: address,
                componentRestrictions: { country: 'UG' }
            }, (results, status) => {
                if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
                    const result = results[0];
                    const location = result.geometry.location;

                    resolve({
                        lat: location.lat(),
                        lng: location.lng(),
                        formatted_address: result.formatted_address,
                        place_id: result.place_id,
                        address_components: result.address_components
                    });
                } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });

    } catch (error) {
        console.error('Google Geocoding failed:', error);
        throw error;
    }
};

/**
 * Reverse geocode coordinates using Google Geocoding Service
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocodeGoogle = async (lat, lng) => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key not found');
    }

    try {
        await loadGoogleMaps();

        return new Promise((resolve, reject) => {
            const geocoder = new window.google.maps.Geocoder();
            const latlng = new window.google.maps.LatLng(lat, lng);

            geocoder.geocode({ location: latlng }, (results, status) => {
                if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    reject(new Error(`Reverse geocoding failed: ${status}`));
                }
            });
        });

    } catch (error) {
        console.error('Google Reverse Geocoding failed:', error);
        throw error;
    }
};