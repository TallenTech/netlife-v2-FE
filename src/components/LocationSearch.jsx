import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
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
  const containerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Debounced Google Places search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm && searchTerm.length >= 3) {
      setSearchLoading(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchGooglePlaces(searchTerm, 8);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (error) {
          console.warn('Google Places search failed:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
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

  const handleSelect = (suggestion) => {
    const address = suggestion.address || suggestion;
    setSearchTerm(address);
    
    // Immediately hide suggestions
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Create location object with coordinates if available
    const locationData = {
      address: address,
      coordinates: suggestion.lat && suggestion.lng ? {
        lat: suggestion.lat,
        lng: suggestion.lng
      } : null,
      details: {
        source: suggestion.lat && suggestion.lng ? 'google' : 'manual',
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
            onFocus={() => {
              if (searchTerm.length >= 3) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on suggestions
              setTimeout(() => setShowSuggestions(false), 150);
            }}
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

      {/* Mobile Layout - Stacked */}
      <div className="sm:hidden space-y-3">
        <div className="relative">
          <Input
            id={`${field.name}-mobile`}
            type="text"
            placeholder={field.placeholder}
            value={searchTerm}
            onChange={handleAddressChange}
            onFocus={() => {
              if (searchTerm.length >= 3) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow click on suggestions
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            className="pl-12 h-14 text-base bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 w-full"
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        
        {isGeolocationSupported() && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-12 w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {loading ? 'Getting Location...' : 'Use My Location'}
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

      {showSuggestions && (searchLoading || suggestions.length > 0 || (searchTerm.length >= 3 && suggestions.length === 0 && !searchLoading)) ? (
        <ul className="absolute z-50 w-full bg-white border-2 border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto">
          {searchLoading ? (
            <li className="p-4 flex items-center space-x-3 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
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
                  className="p-4 hover:bg-primary/10 cursor-pointer text-gray-700 transition-colors duration-150 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                >
                  <MapPin className={`h-4 w-4 flex-shrink-0 ${hasCoordinates ? 'text-green-500' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    {suggestion.name && suggestion.formatted_address ? (
                      // Show business name prominently with address below
                      <div>
                        <span className="text-base font-medium text-gray-900">{suggestion.name}</span>
                        <div className="text-sm text-gray-600 mt-1">{suggestion.formatted_address}</div>
                        {hasCoordinates && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {formatCoordinates(suggestion.lat, suggestion.lng, 4)}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular address display
                      <div>
                        <span className="text-base">{address}</span>
                        {hasCoordinates && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {formatCoordinates(suggestion.lat, suggestion.lng, 4)}
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
              className="p-4 hover:bg-primary/10 cursor-pointer text-gray-700 transition-colors duration-150 flex items-center space-x-3"
            >
              <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
              <div className="flex-1">
                <span className="text-base">Use "{searchTerm}"</span>
                <div className="text-xs text-gray-500 mt-1">
                  📝 Manual address (no coordinates)
                </div>
              </div>
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
};

export default LocationSearch;