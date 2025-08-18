import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, AlertCircle, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateOfBirthPicker } from "@/components/ui/DateOfBirthPicker";
import { geocodeGoogleAddress } from "@/utils/googleMaps";

const ErrorMessage = ({ error }) =>
  error ? (
    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
      <AlertCircle size={14} /> {error}
    </p>
  ) : null;

// Helper function to extract district from address components
const extractDistrict = (addressComponents) => {
  if (addressComponents) {
    // Extract district (administrative_area_level_1 or locality)
    const districtComponent = addressComponents.find(
      (component) =>
        component.types.includes("administrative_area_level_1") ||
        component.types.includes("locality")
    );
    if (districtComponent) {
      return districtComponent.long_name;
    }
  }
  return "";
};

export const Step1Details = ({
  profileData,
  setProfileData,
  errors,
  validateField,
  checkUsername,
  usernameChecking,
  isNewDependent,
}) => {
  const [showDistrictSearch, setShowDistrictSearch] = useState(false);
  const [districtSuggestions, setDistrictSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Handle district search
  const handleDistrictSearch = async (query) => {
    if (!query || query.length < 3) {
      setDistrictSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const geocodeResult = await geocodeGoogleAddress(query);
      const district = extractDistrict(geocodeResult.address_components);

      if (district) {
        setDistrictSuggestions([{
          district,
          address: geocodeResult.formatted_address
        }]);
      } else {
        setDistrictSuggestions([]);
      }
    } catch (error) {
      setDistrictSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle district selection
  const handleDistrictSelect = (suggestion) => {
    setProfileData((prev) => ({
      ...prev,
      district: suggestion.district,
    }));
    validateField("district", suggestion.district);
    setShowDistrictSearch(false);
    setDistrictSuggestions([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-5 md:space-y-6 max-w-none"
    >
      <div className="space-y-2">
        <label className="block text-gray-800 font-medium text-sm md:text-base">
          Username
        </label>
        <div className="relative">
          <Input
            placeholder="Choose a unique username"
            value={profileData.username}
            onChange={(e) => {
              const newValue = e.target.value;
              setProfileData((p) => ({ ...p, username: newValue }));
              validateField("username", newValue);
            }}
            onBlur={() => checkUsername(profileData.username)}
            className="h-11 md:h-12 text-base pr-10"
          />
          {usernameChecking && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        <ErrorMessage error={errors.username} />
      </div>

      <div className="space-y-2">
        <label className="block text-gray-800 font-medium text-sm md:text-base">
          Birth Date
        </label>
        <DateOfBirthPicker
          value={profileData.birthDate}
          onChange={(date) => {
            setProfileData((p) => ({ ...p, birthDate: date }));
            validateField("birthDate", date);
          }}
        />
        <ErrorMessage error={errors.birthDate} />
      </div>

      <div className="space-y-3">
        <label className="block text-gray-800 font-medium text-sm md:text-base">
          Gender
        </label>
        <div className="grid grid-cols-2 gap-3">
          {["Male", "Female", "Other", "Prefer not to say"].map((gender) => (
            <button
              key={gender}
              onClick={() => {
                setProfileData((p) => ({ ...p, gender }));
                validateField("gender", gender);
              }}
              className={`p-3 md:p-4 rounded-lg font-medium border-2 text-sm md:text-base transition-colors min-h-[44px] ${profileData.gender === gender
                ? "bg-primary/10 text-primary border-primary"
                : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                }`}
            >
              {gender}
            </button>
          ))}
        </div>
        <ErrorMessage error={errors.gender} />
      </div>

      {!isNewDependent && (
        <div className="space-y-3">
          <label className="block text-gray-800 font-medium text-sm md:text-base flex items-center">
            <MapPin className="w-4 h-4 mr-2" /> Location
          </label>

          {/* District Search */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Search for your district or location"
                value={profileData.district}
                onChange={(e) => {
                  const value = e.target.value;
                  setProfileData((p) => ({ ...p, district: value }));
                  validateField("district", value);

                  if (value.length >= 3) {
                    handleDistrictSearch(value);
                    setShowDistrictSearch(true);
                  } else {
                    setShowDistrictSearch(false);
                    setDistrictSuggestions([]);
                  }
                }}
                onFocus={() => {
                  if (profileData.district.length >= 3) {
                    setShowDistrictSearch(true);
                  }
                }}
                className="h-11 md:h-12 text-base pl-12"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
              )}
            </div>

            {/* District Suggestions */}
            {showDistrictSearch && districtSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1">
                <div className="w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-hidden">
                  <ul className="max-h-60 overflow-y-auto">
                    {districtSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleDistrictSelect(suggestion)}
                        className="p-4 border-b border-gray-100 active:bg-primary/10 cursor-pointer text-gray-700 transition-colors duration-150 flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0 mt-1 text-blue-500">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-base font-medium text-gray-900 block truncate">
                            {suggestion.district}
                          </span>
                          <div className="text-sm text-gray-600 mt-1">
                            {suggestion.address}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sub-county Input (Optional) */}
          <div className="space-y-1">
            <Input
              placeholder="Sub County (Optional)"
              value={profileData.subCounty}
              onChange={(e) =>
                setProfileData((p) => ({ ...p, subCounty: e.target.value }))
              }
              className="h-11 md:h-12 text-base"
            />
          </div>

          <ErrorMessage error={errors.district} />
        </div>
      )}
    </motion.div>
  );
};
