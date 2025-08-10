import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

const mockLocations = [
  "Kampala, Central Parish",
  "Gulu, Laroo Division",
  "Mbarara, Kakoba Division",
  "Jinja, Central Division",
  "Entebbe, Central Division",
  "Lira, Adyel Division",
  "Arua, Arua Hill Division",
  "Masaka, Katwe-Butego Division",
  "Mbale, Industrial Division",
  "Fort Portal, Central Division",
  "Soroti, Eastern Division",
  "Wakiso, Wakiso Town Council",
  "Mukono, Central Division",
  "Hoima, Kahoora Division",
  "Busia, Western Division",
];

const LocationSearch = ({ field, value, onLocationSelect }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (searchTerm) {
      const filtered = mockLocations.filter(loc =>
        loc.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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

  const handleSelect = (location) => {
    setSearchTerm(location);
    onLocationSelect(location);
    setShowSuggestions(false);
  };

  return (
    <div key={field.name} className="space-y-2 relative" ref={containerRef}>
      <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">{field.label}</Label>
      <div className="relative">
        <Input
          id={field.name}
          type="text"
          placeholder={field.placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="pl-12 h-14 text-base bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border-2 border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((loc, index) => (
            <li
              key={index}
              onClick={() => handleSelect(loc)}
              className="p-4 hover:bg-primary/10 cursor-pointer text-gray-700 transition-colors duration-150 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-base">{loc}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;