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
      <Label htmlFor={field.name} className="text-base">{field.label}</Label>
      <div className="relative">
        <Input
          id={field.name}
          type="text"
          placeholder={field.placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 h-14 text-base"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((loc, index) => (
            <li
              key={index}
              onClick={() => handleSelect(loc)}
              className="p-3 hover:bg-gray-100 cursor-pointer text-gray-700"
            >
              {loc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;