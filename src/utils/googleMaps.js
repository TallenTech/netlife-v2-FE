/**
 * Google Maps JavaScript API integration
 * Now with actual API calls since domain restrictions are removed
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Track if Google Maps is loaded
let isGoogleMapsLoaded = false;
let googleMapsPromise = null;

/**
 * Check if Google Maps API key is configured
 * @returns {boolean}
 */
export const isGoogleMapsConfigured = () => {
    return !!GOOGLE_MAPS_API_KEY &&
        GOOGLE_MAPS_API_KEY !== "your_google_maps_api_key_here" &&
        GOOGLE_MAPS_API_KEY.startsWith("AIza");
};

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

    if (!isGoogleMapsConfigured()) {
        return Promise.reject(new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.'));
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

    if (!isGoogleMapsConfigured()) {
        console.warn('Google Maps API key not configured - returning empty results');
        return [];
    }

    try {
        await loadGoogleMaps();

        // Note: Using AutocompleteService for now as AutocompleteSuggestion API is not fully available
        // TODO: Migrate to AutocompleteSuggestion when it becomes stable
        return new Promise((resolve) => {
            const service = new window.google.maps.places.AutocompleteService();

            service.getPlacePredictions({
                input: query,
                componentRestrictions: { country: 'ug' }, // Uganda only
                types: ['geocode', 'establishment'] // Focus on addresses and businesses
            }, async (predictions, status) => {
                if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
                    resolve([]);
                    return;
                }

                // Return predictions with enhanced information
                const results = predictions.slice(0, limit).map(prediction => {
                    const mainText = prediction.structured_formatting?.main_text || '';
                    const secondaryText = prediction.structured_formatting?.secondary_text || '';

                    // Determine if this is a business/establishment or address
                    const isEstablishment = prediction.types?.some(type =>
                        ['establishment', 'point_of_interest', 'business'].includes(type)
                    );

                    return {
                        address: prediction.description,
                        lat: null, // Will be filled when user selects
                        lng: null, // Will be filled when user selects
                        place_id: prediction.place_id,
                        types: prediction.types,
                        source: 'google',
                        name: isEstablishment ? mainText : null,
                        formatted_address: isEstablishment ? secondaryText : prediction.description,
                        isEstablishment: isEstablishment,
                        category: prediction.types?.[0] || 'geocode'
                    };
                });

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
    if (!isGoogleMapsConfigured()) {
        throw new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
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
    if (!isGoogleMapsConfigured()) {
        throw new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
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

/**
 * Initialize Google Maps for interactive map component
 * @param {HTMLElement} container - Map container element
 * @param {Object} options - Map options
 * @returns {Promise<Object>} Map instance
 */
export const initializeGoogleMap = async (container, options = {}) => {
    if (!isGoogleMapsConfigured()) {
        throw new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
    }

    try {
        await loadGoogleMaps();

        const defaultOptions = {
            center: { lat: 0.3476, lng: 32.5825 }, // Kampala, Uganda
            zoom: 13,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ],
            ...options
        };

        return new window.google.maps.Map(container, defaultOptions);
    } catch (error) {
        console.error('Failed to initialize Google Map:', error);
        throw error;
    }
};