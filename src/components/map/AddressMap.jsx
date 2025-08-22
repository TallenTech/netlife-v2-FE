import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    MapPin,
    Loader2,
    AlertCircle,
    Search,
    Navigation,
    Map,
    X,
    Maximize2,
    Minimize2,
    Building2,
    Home,
    Store,
    Landmark,
    MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    getCurrentLocation,
    isGeolocationSupported,
    formatCoordinates
} from '@/utils/geolocation';
import {
    searchGooglePlaces,
    reverseGeocodeGoogle,
    geocodeGoogleAddress,
    initializeGoogleMap,
    isGoogleMapsConfigured
} from '@/utils/googleMaps';

const AddressMap = ({ field, value, onLocationSelect }) => {
    const [searchTerm, setSearchTerm] = useState(value?.address || value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const [marker, setMarker] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(value || null);
    const [isMobile, setIsMobile] = useState(false);

    // Function to get category icon
    const getCategoryIcon = (category, types) => {
        if (types?.includes('establishment') || types?.includes('point_of_interest')) {
            return Building2;
        }
        if (types?.includes('store') || types?.includes('shopping')) {
            return Store;
        }
        if (types?.includes('landmark') || types?.includes('tourist_attraction')) {
            return Landmark;
        }
        if (types?.includes('residential') || types?.includes('home_goods_store')) {
            return Home;
        }
        return MapIcon;
    };

    const containerRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const mapContainerRef = useRef(null);
    const inputRef = useRef(null);
    const searchInputRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Debounced Google Places search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchTerm && searchTerm.length >= 2) {
            setSearchLoading(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const results = await searchGooglePlaces(searchTerm, 6);
                    setSuggestions(results);
                    setShowSuggestions(results.length > 0 || searchTerm.length >= 3);
                } catch (error) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                } finally {
                    setSearchLoading(false);
                }
            }, 150);
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

    // Initialize Google Maps
    const initializeMap = useCallback(async () => {
        if (!isGoogleMapsConfigured()) {
            setError('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
            return;
        }

        try {
            const mapOptions = {
                center: selectedLocation?.coordinates || { lat: 0.3476, lng: 32.5825 }, // Kampala, Uganda
                zoom: selectedLocation?.coordinates ? 15 : 13,
            };

            const map = await initializeGoogleMap(mapContainerRef.current, mapOptions);
            setMapInstance(map);

            // Add click listener to map
            map.addListener('click', handleMapClick);

            // Add marker if location is selected
            if (selectedLocation?.coordinates) {
                addMarkerToMap(map, selectedLocation.coordinates);
            }

            return map;
        } catch (error) {
            console.error('Failed to initialize map:', error);
            setError('Failed to load interactive map. Please check your internet connection.');
        }
    }, [selectedLocation]);

    // Initialize map when showMap changes
    useEffect(() => {
        if (showMap && mapContainerRef.current) {
            initializeMap();
        }
    }, [showMap, initializeMap]);

    const handleMapClick = useCallback(async (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        try {
            const address = await reverseGeocodeGoogle(lat, lng);
            const locationData = {
                address,
                coordinates: { lat, lng },
                details: {
                    source: 'map_click',
                    timestamp: new Date().toISOString()
                }
            };

            setSelectedLocation(locationData);
            setSearchTerm(address);
            addMarkerToMap(mapInstance, { lat, lng });
            onLocationSelect(locationData);
        } catch (error) {
            console.error('Failed to reverse geocode:', error);
            const locationData = {
                address: `Selected Location (${formatCoordinates(lat, lng, 4)})`,
                coordinates: { lat, lng },
                details: {
                    source: 'map_click',
                    timestamp: new Date().toISOString()
                }
            };
            setSelectedLocation(locationData);
            setSearchTerm(locationData.address);
            addMarkerToMap(mapInstance, { lat, lng });
            onLocationSelect(locationData);
        }
    }, [mapInstance, onLocationSelect]);

    const addMarkerToMap = useCallback((map, coordinates) => {
        // Remove existing marker
        if (marker) {
            marker.setMap(null);
        }

                 const newMarker = new window.google.maps.Marker({
             position: coordinates,
             map: map,
             draggable: true,
             animation: window.google.maps.Animation.DROP,
             icon: {
                 url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
           <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#8e3bff"/>
             <circle cx="12" cy="12" r="6" fill="white"/>
             <circle cx="12" cy="12" r="3" fill="#8e3bff"/>
           </svg>
         `),
                 scaledSize: new window.google.maps.Size(24, 32),
                 anchor: new window.google.maps.Point(12, 32)
             }
         });

        // Add drag listener
        newMarker.addListener('dragend', async (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            try {
                const address = await reverseGeocodeGoogle(lat, lng);
                const locationData = {
                    address,
                    coordinates: { lat, lng },
                    details: {
                        source: 'marker_drag',
                        timestamp: new Date().toISOString()
                    }
                };
                setSelectedLocation(locationData);
                setSearchTerm(address);
                onLocationSelect(locationData);
            } catch (error) {
                console.error('Failed to reverse geocode dragged marker:', error);
            }
        });

        setMarker(newMarker);
    }, [marker, onLocationSelect]);

    const handleSelect = async (suggestion) => {
        const address = suggestion.address || suggestion;
        setSearchTerm(address);
        setShowSuggestions(false);
        setSuggestions([]);

        let coordinates = null;
        if (suggestion.place_id && (!suggestion.lat || !suggestion.lng)) {
            try {
                const geocodeResult = await geocodeGoogleAddress(address);
                coordinates = {
                    lat: geocodeResult.lat,
                    lng: geocodeResult.lng
                };
            } catch (error) {
                console.error('Failed to geocode address:', error);
            }
        } else if (suggestion.lat && suggestion.lng) {
            coordinates = {
                lat: suggestion.lat,
                lng: suggestion.lng
            };
        }

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

        setSelectedLocation(locationData);
        onLocationSelect(locationData);

        // Update map if visible
        if (mapInstance && coordinates) {
            mapInstance.setCenter(coordinates);
            mapInstance.setZoom(15);
            addMarkerToMap(mapInstance, coordinates);
        }
    };

    const handleGetCurrentLocation = async () => {
        setLoading(true);
        setError(null);

        try {
            const location = await getCurrentLocation();
            let readableAddress;

            try {
                readableAddress = await reverseGeocodeGoogle(location.lat, location.lng);
            } catch (geocodeError) {
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
            setSelectedLocation(locationData);
            onLocationSelect(locationData);
            setShowSuggestions(false);

            // Update map if visible
            if (mapInstance) {
                mapInstance.setCenter(locationData.coordinates);
                mapInstance.setZoom(15);
                addMarkerToMap(mapInstance, locationData.coordinates);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddressChange = (e) => {
        const address = e.target.value;
        setSearchTerm(address);
        if (error) setError(null);
    };

    const calculateDropdownPosition = useCallback(() => {
        const inputElement = searchInputRef.current;
        if (inputElement) {
            const rect = inputElement.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width
            });
        }
    }, []);

    const handleInputFocus = () => {
        calculateDropdownPosition();
        if (searchTerm.length >= 2) {
            setShowSuggestions(true);
        }
    };

    const handleInputBlur = () => {
        setTimeout(() => setShowSuggestions(false), 200);
    };

    const toggleMap = () => {
        setShowMap(!showMap);
    };

    const clearLocation = () => {
        setSelectedLocation(null);
        setSearchTerm('');
        onLocationSelect(null);
        if (marker) {
            marker.setMap(null);
            setMarker(null);
        }
    };

    // Handle click outside and scroll
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        const handleScroll = () => {
            if (showSuggestions) {
                calculateDropdownPosition();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [showSuggestions, calculateDropdownPosition]);

    return (
        <div key={field.name} className="space-y-3 relative" ref={containerRef}>
            <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* Search and Controls */}
            <div className="space-y-3">
                {/* Desktop Layout */}
                <div className="hidden sm:flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            ref={searchInputRef}
                            id={field.name}
                            type="text"
                            placeholder={field.placeholder}
                            value={searchTerm}
                            onChange={handleAddressChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            className="pl-12 h-14 text-base bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${showSuggestions ? 'text-primary' : 'text-gray-400'}`} />

                        {/* Search Suggestions for Desktop */}
                        <AnimatePresence>
                            {showSuggestions && (searchLoading || suggestions.length > 0 || (searchTerm.length >= 3 && suggestions.length === 0 && !searchLoading)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute z-[9999] w-full"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        transformOrigin: 'top center'
                                    }}
                                >
                                    <div className="w-full bg-white/95 backdrop-blur-md border-2 border-gray-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-hidden">
                                        <ul>
                                            {searchLoading ? (
                                                <li className="p-4 flex items-center space-x-3 text-gray-500 bg-gray-50">
                                                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                                                    <span className="text-base font-medium">Searching addresses...</span>
                                                </li>
                                            ) : suggestions.length > 0 ? (
                                                suggestions.map((suggestion, index) => {
                                                    const address = suggestion.address || suggestion;
                                                    const hasCoordinates = suggestion.lat && suggestion.lng;
                                                    const isVerified = suggestion.place_id;

                                                    return (
                                                        <li
                                                            key={index}
                                                            onClick={() => handleSelect(suggestion)}
                                                            className="p-4 hover:bg-primary/5 cursor-pointer text-gray-700 transition-all duration-200 flex items-start space-x-3 border-b border-gray-100 last:border-b-0 group"
                                                        >
                                                            <div className={`flex-shrink-0 mt-1 ${isVerified ? 'text-blue-500' : 'text-gray-400'}`}>
                                                                {isVerified ? (
                                                                    <div className="p-1 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                                                        {(() => {
                                                                            const IconComponent = getCategoryIcon(suggestion.category, suggestion.types);
                                                                            return <IconComponent className="h-4 w-4" />;
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-1 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors">
                                                                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                                                            <div className="h-1.5 w-1.5 bg-gray-400 rounded-full"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {suggestion.name && suggestion.formatted_address ? (
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-base font-semibold text-gray-900 block truncate">
                                                                                {suggestion.name}
                                                                            </span>
                                                                            {isVerified && (
                                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                                                    Verified
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                                            {suggestion.formatted_address}
                                                                        </div>
                                                                        {hasCoordinates && (
                                                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                                                <span>📍</span>
                                                                                <span className="font-mono">{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-base font-semibold text-gray-900 block truncate">
                                                                                {address}
                                                                            </span>
                                                                            {isVerified && (
                                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                                                    Verified
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {hasCoordinates && (
                                                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                                                <span>📍</span>
                                                                                <span className="font-mono">{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                            </div>
                                                        </li>
                                                    );
                                                })
                                            ) : (
                                                <li
                                                    onClick={() => handleSelect({ address: searchTerm })}
                                                    className="p-4 hover:bg-primary/5 cursor-pointer text-gray-700 transition-all duration-200 flex items-start space-x-3 border-b border-gray-100 last:border-b-0 group"
                                                >
                                                    <div className="flex-shrink-0 mt-1 text-blue-500">
                                                        <div className="p-1 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                                            <MapPin className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-semibold text-gray-900">
                                                                Use "{searchTerm}"
                                                            </span>
                                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                                                Manual
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            📝 Manual address entry (no coordinates)
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                <Navigation className="h-4 w-4" />
                            )}
                            {loading ? 'Getting...' : 'Current Location'}
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleMap}
                        className="flex items-center gap-2 h-14 px-4"
                    >
                        {showMap ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        {showMap ? 'Hide Map' : 'Show Map'}
                    </Button>

                    {selectedLocation && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearLocation}
                            className="flex items-center gap-2 h-14 px-4 text-red-600 hover:text-red-700"
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden space-y-3">
                    <div className="relative">
                        <Input
                            ref={isMobile ? inputRef : searchInputRef}
                            id={`${field.name}-mobile`}
                            type="text"
                            placeholder={field.placeholder}
                            value={searchTerm}
                            onChange={handleAddressChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            className="pl-12 h-14 text-base bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 w-full"
                        />
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200 ${showSuggestions ? 'text-primary' : 'text-gray-400'}`} />

                        {/* Search Suggestions for Mobile */}
                        <AnimatePresence>
                            {showSuggestions && (searchLoading || suggestions.length > 0 || (searchTerm.length >= 3 && suggestions.length === 0 && !searchLoading)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute z-[9999] w-full"
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        transformOrigin: 'top center'
                                    }}
                                >
                                    <div className="w-full bg-white/95 backdrop-blur-md border-2 border-gray-200 rounded-xl mt-1 shadow-2xl max-h-60 overflow-hidden">
                                        <ul>
                                            {searchLoading ? (
                                                <li className="p-4 flex items-center space-x-3 text-gray-500 bg-gray-50">
                                                    <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
                                                    <span className="text-base font-medium">Searching addresses...</span>
                                                </li>
                                            ) : suggestions.length > 0 ? (
                                                suggestions.map((suggestion, index) => {
                                                    const address = suggestion.address || suggestion;
                                                    const hasCoordinates = suggestion.lat && suggestion.lng;
                                                    const isVerified = suggestion.place_id;

                                                    return (
                                                        <li
                                                            key={index}
                                                            onClick={() => handleSelect(suggestion)}
                                                            className="p-4 hover:bg-primary/5 cursor-pointer text-gray-700 transition-all duration-200 flex items-start space-x-3 border-b border-gray-100 last:border-b-0 group"
                                                        >
                                                            <div className={`flex-shrink-0 mt-1 ${isVerified ? 'text-blue-500' : 'text-gray-400'}`}>
                                                                {isVerified ? (
                                                                    <div className="p-1 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                                                        {(() => {
                                                                            const IconComponent = getCategoryIcon(suggestion.category, suggestion.types);
                                                                            return <IconComponent className="h-4 w-4" />;
                                                                        })()}
                                                                    </div>
                                                                ) : (
                                                                    <div className="p-1 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors">
                                                                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                                                            <div className="h-1.5 w-1.5 bg-gray-400 rounded-full"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {suggestion.name && suggestion.formatted_address ? (
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-base font-semibold text-gray-900 block truncate">
                                                                                {suggestion.name}
                                                                            </span>
                                                                            {isVerified && (
                                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                                                    Verified
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                                            {suggestion.formatted_address}
                                                                        </div>
                                                                        {hasCoordinates && (
                                                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                                                <span>📍</span>
                                                                                <span className="font-mono">{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-base font-semibold text-gray-900 block truncate">
                                                                                {address}
                                                                            </span>
                                                                            {isVerified && (
                                                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                                                    Verified
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {hasCoordinates && (
                                                                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                                                <span>📍</span>
                                                                                <span className="font-mono">{formatCoordinates(suggestion.lat, suggestion.lng, 4)}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                            </div>
                                                        </li>
                                                    );
                                                })
                                            ) : (
                                                <li
                                                    onClick={() => handleSelect({ address: searchTerm })}
                                                    className="p-4 hover:bg-primary/5 cursor-pointer text-gray-700 transition-all duration-200 flex items-start space-x-3 border-b border-gray-100 last:border-b-0 group"
                                                >
                                                    <div className="flex-shrink-0 mt-1 text-blue-500">
                                                        <div className="p-1 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                                            <MapPin className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-semibold text-gray-900">
                                                                Use "{searchTerm}"
                                                            </span>
                                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                                                Manual
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            📝 Manual address entry (no coordinates)
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-2">
                        {isGeolocationSupported() && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGetCurrentLocation}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 flex-1 h-14"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Navigation className="h-5 w-5" />
                                )}
                                {loading ? 'Getting...' : 'Current Location'}
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={toggleMap}
                            className="flex items-center gap-2 h-14 px-4"
                        >
                            {showMap ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            {showMap ? 'Hide' : 'Map'}
                        </Button>
                    </div>

                    {selectedLocation && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearLocation}
                            className="flex items-center justify-center gap-2 w-full h-14 text-red-600 hover:text-red-700"
                        >
                            <X className="h-4 w-4" />
                            Clear Location
                        </Button>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            {/* Selected Location Display */}
            {selectedLocation?.coordinates && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                            Location: {formatCoordinates(selectedLocation.coordinates.lat, selectedLocation.coordinates.lng, 4)}
                            {selectedLocation.details?.accuracy && (
                                <span className="text-gray-500 ml-2">
                                    (±{Math.round(selectedLocation.details.accuracy)}m)
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            )}

            {/* Interactive Map */}
            <AnimatePresence>
                {showMap && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Map className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Interactive Map</span>
                                </div>
                                <span className="text-xs text-gray-500">Click to set location</span>
                            </div>
                            <div
                                ref={mapContainerRef}
                                className="w-full h-80 md:h-96"
                                style={{ minHeight: '320px' }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
};

export default AddressMap;
