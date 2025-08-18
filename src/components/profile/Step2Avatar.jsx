import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, Camera, Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const avatars = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-5",
  "avatar-6",
  "avatar-7",
  "avatar-8",
  "avatar-9",
  "avatar-10",
  "avatar-11",
  "avatar-12",
];

const getAvatarEmoji = (id) =>
({
  "avatar-1": "👨🏻",
  "avatar-2": "👩🏻",
  "avatar-3": "👨🏽",
  "avatar-4": "👩🏽",
  "avatar-5": "👨🏿",
  "avatar-6": "👩🏿",
  "avatar-7": "👦🏻",
  "avatar-8": "👧🏽",
  "avatar-9": "👨🏿‍🦱",
  "avatar-10": "👩🏿‍🦱",
  "avatar-11": "👨🏽‍🦲",
  "avatar-12": "👩🏿‍🦲",
}[id] || "👤");

export const Step2Avatar = ({
  profileData,
  setProfileData,
  onFileSelect,
  previewUrl,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = useCallback((file) => {
    if (!file) {
      onFileSelect(null);
      setError("");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image file.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleAvatarSelect = (avatarId) => {
    setProfileData((p) => ({ ...p, avatar: avatarId }));
    onFileSelect(null, true); // Clear any uploaded photo
    setError("");
  };

  const removePhoto = () => {
    onFileSelect(null, true);
    setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Profile Picture</h2>
        <p className="text-gray-600 mt-2">
          Choose how you'd like to appear in the app
        </p>
      </div>

      {/* Option 1: Avatar Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Choose an Avatar</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {avatars.map((avatarId) => (
            <button
              key={avatarId}
              onClick={() => handleAvatarSelect(avatarId)}
              className={`relative text-4xl bg-gray-100 rounded-full aspect-square flex items-center justify-center transition-all duration-200 hover:scale-105 ${profileData.avatar === avatarId && !previewUrl
                ? "ring-2 ring-primary ring-offset-2"
                : "hover:bg-gray-200"
                }`}
            >
              {getAvatarEmoji(avatarId)}
              {profileData.avatar === avatarId && !previewUrl && (
                <div className="absolute -top-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                  <Check size={12} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500 text-sm font-medium">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* Option 2: Personal Photo Upload */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Upload Your Photo</h3>
        </div>

        {/* Photo Preview */}
        {previewUrl && (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
              />
              <button
                onClick={removePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                aria-label="Remove photo"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Your profile picture is ready! Click the X to remove and choose another option.
            </p>
          </div>
        )}

        {/* Upload Area */}
        {!previewUrl && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
              }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="profile-photo-input"
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  {dragActive ? "Drop your photo here" : "Upload your photo"}
                </h4>
                <p className="text-gray-600">
                  {dragActive
                    ? "Release to upload your profile picture"
                    : "Drag and drop your photo here, or click to browse"
                  }
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("profile-photo-input")?.click()}
                className="mt-4"
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Photo
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum size: 5MB</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 flex items-center justify-center gap-2">
              <X size={16} />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 text-center">
          💡 <strong>Tip:</strong> Choose an avatar for a quick setup, or upload your own photo for a more personal touch.
          You can always change this later in your profile settings.
        </p>
      </div>
    </motion.div>
  );
};
