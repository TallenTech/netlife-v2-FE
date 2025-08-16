import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, Search, Navigation } from 'lucide-react';
import {
  getCurrentLocation,
  isGeolocationSupported,
  formatCoordinates
} from '@/utils/geolocation';
import { searchGooglePlaces, reverseGeocodeGoogle } from '@/utils/googleMaps';

const LocationSearch = ({ field, value, onLocationSelect }) => {
  const [searchTerm, setSearchTerm] = useState(value?.address || value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    const handleResize = () => {
      checkMobile();
    };

    checkMobile();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSuggestions, isMobile]);

  // Debounced Google Places search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm && searchTerm.length >= 2) { // Reduced from 3 to 2 characters
      setSearchLoading(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchGooglePlaces(searchTerm, 6); // Reduced from 8 to 6 results
          setSuggestions(results);
          setShowSuggestions(results.length > 0 || searchTerm.length >= 3);
        } catch (error) {
          console.warn('Google Places search failed:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setSearchLoading(false);
        }
      }, 150); // Reduced from 300ms to 150ms
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (suggestion) => {
    const address = suggestion.address || suggestion;
    setSearchTerm(address);

    // Haptic feedback for mobile devices
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Immediately hide suggestions
    setShowSuggestions(false);
    setSuggestions([]);

    // If we have a place_id but no coordinates, get the details
    let coordinates = null;
    if (suggestion.place_id && (!suggestion.lat || !suggestion.lng)) {
      try {
        const geocodeResult = await geocodeGoogleAddress(address);
        coordinates = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng
        };
      } catch (error) {
        console.warn('Failed to get coordinates for selected place:', error);
      }
    } else if (suggestion.lat && suggestion.lng) {
      coordinates = {
        lat: suggestion.lat,
        lng: suggestion.lng
      };
    }

    // Create location object
    const locationData = {
      address: address,
      coordinates: coordinates,
      details: {
        source: coordinates ? 'google' : 'manual',
        timestamp: new Date().toISOString(),
        place_id: suggestion.place_id || null,
        types: suggestion.types || null
      }
    };

    onLocationSelect(locationData);
  };

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();

      // Try to get readable address from coordinates using Google
      let readableAddress;
      try {
        readableAddress = await reverseGeocodeGoogle(location.lat, location.lng);
      } catch (geocodeError) {
        console.warn('Google reverse geocoding failed:', geocodeError);
        readableAddress = `Current Location (${formatCoordinates(location.lat, location.lng, 4)})`;
      }

      const locationData = {
        address: readableAddress,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        },
        details: {
          accuracy: location.accuracy,
          source: 'gps',
          timestamp: location.timestamp
        }
      };

      setSearchTerm(locationData.address);
      onLocationSelect(locationData);
      setShowSuggestions(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    setSearchTerm(address);

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Handle mobile backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSuggestions(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSuggestions) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSuggestions]);

  return (
    <div key={field.name} className="space-y-3 relative" ref={containerRef}>
      <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Desktop Layout - Side by side */}
      <div className="hidden sm:flex gap-2">
        <div className="relative flex-1">
          <Input
            id={field.name}
            type="text"
            placeholder={field.placeholder}
            value={searchTerm}
            onChange={handleAddressChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-12 h-14 text-base bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {isGeolocationSupported() && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex items-center gap-2 whitespace-nowrap h-14 px-4"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {loading ? 'Getting...' : 'Use My Location'}
          </Button>
        )}
      </div>

      {/* Mobile Layout - Improved */}
      <div className="sm:hidden space-y-3">
        <div className="relative">
          <Input
            ref={inputRef}
            id={`${field.name}-mobile`}
            type="text"
            placeholder={field.placeholder}
            value={searchTerm}
            onChange={handleAddressChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="pl-12 h-14 text-base bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 w-full"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {isGeolocationSupported() && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex items-center justify-center gap-3 h-14 w-full text-base font-medium"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
            {loading ? 'Getting Your Location...' : '📍 Use My Current Location'}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {value?.coordinates && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>
              Location: {formatCoordinates(value.coordinates.lat, value.coordinates.lng, 4)}
              {value.details?.accuracy && (
                <span className="text-gray-500 ml-2">
                  (±{Math.round(value.details.accuracy)}m)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Desktop dropdown */}
      {!isMobile && showSuggestions && (searchLoading || suggestions.length > 0 || (searchTerm.length >= 3 && suggestions.length === 0 && !searchLoading)) ? (
        <div className="absolute z-50 w-full">
          <div className="w-full bg-white border-2 border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto">
            <ul>
              {searchLoading ? (
                <li className="p-4 flex items-center space-x-3 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                  <span className="text-base">Searching addresses...</span>
                </li>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => {
                  const address = suggestion.address || suggestion;
                  const hasCoordinates = suggestion.lat && suggestion.lng;

                  return (
                    <li
                      key={index}
                      onClick={() => handleSelect(suggestion)}
                      className="p-4 hover:bg-primary/10 cursor-pointer text-gray-700 transition-colors duration-150 flex items-start space-x-3"
                    >
                      <div className={`flex-shrink-0 mt-1 ${suggestion.place_id ? 'text-blue-500' : 'text-gray-400'}`}>
                        {suggestion.place_id ? (
                          <MapPin className="h-5 w-5" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {suggestion.name && suggestion.formatted_address ? (
                          <div>
                            <span className="text-base font-medium text-gray-900 block truncate">
                              {suggestion.name}
                            </span>
                            <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                              {suggestion.formatted_address}
                            </div>
                            {hasCoordinates && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <span>📍</span>
                                <span>{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-base block truncate">
                              {address}
                            </span>
                            {hasCoordinates && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <span>📍</span>
                                <span>{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <li
                  onClick={() => handleSelect({ address: searchTerm })}
                  className="p-4 hover:bg-primary/10 cursor-pointer text-gray-700 transition-colors duration-150 flex items-start space-x-3"
                >
                  <div className="flex-shrink-0 mt-1 text-blue-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-base font-medium">
                      Use "{searchTerm}"
                    </span>
                    <div className="text-xs text-gray-500 mt-2">
                      📝 Manual address (no coordinates)
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Mobile dropdown - attached to input */}
      {isMobile && showSuggestions && (searchLoading || suggestions.length > 0 || (searchTerm.length >= 3 && suggestions.length === 0 && !searchLoading)) ? (
        <div className="absolute z-50 w-full top-full mt-1">
          <div className="w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-hidden">
            <ul className="max-h-60 overflow-y-auto">
              {searchLoading ? (
                <>
                  <li className="p-4 flex items-center space-x-3 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                    <span className="text-base">Searching addresses...</span>
                  </li>

                </>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => {
                  const address = suggestion.address || suggestion;
                  const hasCoordinates = suggestion.lat && suggestion.lng;

                  return (
                    <li
                      key={index}
                      onClick={() => handleSelect(suggestion)}
                      className={`${isMobile ? 'p-4 border-b border-gray-100 active:bg-primary/10' : 'p-4 hover:bg-primary/10'} cursor-pointer text-gray-700 transition-colors duration-150 flex items-start space-x-3`}
                    >
                      <div className={`flex-shrink-0 mt-1 ${suggestion.place_id ? 'text-blue-500' : 'text-gray-400'}`}>
                        {suggestion.place_id ? (
                          <MapPin className="h-5 w-5" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {suggestion.name && suggestion.formatted_address ? (
                          // Show business name prominently with address below
                          <div>
                            <span className={`${isMobile ? 'text-lg' : 'text-base'} font-medium text-gray-900 block truncate`}>
                              {suggestion.name}
                            </span>
                            <div className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-600 mt-1 leading-relaxed`}>
                              {suggestion.formatted_address}
                            </div>
                            {hasCoordinates && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <span>📍</span>
                                <span>{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Regular address display
                          <div>
                            <span className={`${isMobile ? 'text-lg' : 'text-base'} block truncate`}>
                              {address}
                            </span>
                            {hasCoordinates && (
                              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <span>📍</span>
                                <span>{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                // Show "Use this address" option when no results found
                <li
                  onClick={() => handleSelect({ address: searchTerm })}
                  className={`${isMobile ? 'p-4 border-b border-gray-100 active:bg-primary/10' : 'p-4 hover:bg-primary/10'} cursor-pointer text-gray-700 transition-colors duration-150 flex items-start space-x-3`}
                >
                  <div className="flex-shrink-0 mt-1 text-blue-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className={`${isMobile ? 'text-lg' : 'text-base'} font-medium`}>
                      Use "{searchTerm}"
                    </span>
                    <div className="text-xs text-gray-500 mt-2">
                      📝 Manual address (no coordinates)
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LocationSearch;