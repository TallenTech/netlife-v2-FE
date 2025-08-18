import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, User, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarEmoji } from "@/lib/utils";
import { cn } from "@/lib/utils";

const avatarOptions = [
    "avatar-1", "avatar-2", "avatar-3", "avatar-4", "avatar-5", "avatar-6",
    "avatar-7", "avatar-8", "avatar-9", "avatar-10", "avatar-11", "avatar-12"
];

export const ProfilePictureEditor = ({
    currentPicture,
    username,
    onPictureChange,
    onAvatarSelect,
    isEditing = false,
    onToggleEdit,
    className = "",
    isUploading = false
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState(false);

    // Reset image error when currentPicture changes
    useEffect(() => {
        if (currentPicture) {
            setImageError(false);
        }
    }, [currentPicture]);

    const handleFileSelect = useCallback((file) => {
        setError("");

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setError("Please select a valid image file (JPEG, PNG, or WebP)");
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        onPictureChange(file);
    }, [onPictureChange]);

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

    const renderCurrentPicture = () => {
        if (!currentPicture) {
            return (
                <AvatarFallback className="text-5xl">
                    {username?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
            );
        }

        // Check if it's a URL (uploaded photo)
        if (currentPicture.startsWith("http") || currentPicture.startsWith("data:")) {
            return (
                <AvatarImage
                    src={currentPicture}
                    alt={username || "Profile"}
                    className="object-cover"
                    onLoad={() => setImageError(false)}
                    onError={() => setImageError(true)}
                />
            );
        }

        // Check if it's an avatar ID
        if (currentPicture.startsWith("avatar-")) {
            return (
                <AvatarFallback className="text-5xl bg-transparent">
                    {getAvatarEmoji(currentPicture)}
                </AvatarFallback>
            );
        }

        // Fallback to first letter
        return (
            <AvatarFallback className="text-5xl">
                {username?.charAt(0).toUpperCase() || "A"}
            </AvatarFallback>
        );
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Current Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <Avatar className="w-24 h-24 text-5xl border-4 border-white shadow-md">
                        {renderCurrentPicture()}
                    </Avatar>

                    {/* Edit Button */}
                    <button
                        onClick={onToggleEdit}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-center">
                    <h3 className="font-semibold text-gray-900">{username || "User"}</h3>
                    <p className="text-sm text-gray-500">Profile Picture</p>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onToggleEdit}
                            className="fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:rounded-2xl p-4 md:p-6 z-50 max-w-md w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex flex-col mb-6 flex-shrink-0">
                                {/* Mobile drag handle */}
                                <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Edit Profile Picture</h3>
                                    <button
                                        onClick={onToggleEdit}
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto">
                                {/* Upload Photo Section */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Upload Your Photo</h4>

                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        className={cn(
                                            "relative border-2 border-dashed rounded-xl p-4 md:p-6 text-center transition-all duration-200",
                                            dragActive
                                                ? "border-primary bg-primary/5"
                                                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                                        )}
                                    >
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={handleFileInput}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            id="profile-photo-input"
                                        />

                                        <div className="space-y-3">
                                            <div className="flex justify-center">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <Upload className="w-6 h-6 text-primary" />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <h5 className="font-medium text-gray-900">
                                                    {dragActive ? "Drop your photo here" : "Upload your photo"}
                                                </h5>
                                                <p className="text-sm text-gray-600">
                                                    {dragActive
                                                        ? "Release to upload your profile picture"
                                                        : "Drag and drop your photo here, or click to browse"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-sm text-red-600 text-center">{error}</p>
                                    )}
                                </div>

                                {/* Avatar Selection Section */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-gray-900">Or Choose an Avatar</h4>

                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
                                        {avatarOptions.map((avatarId) => (
                                            <button
                                                key={avatarId}
                                                onClick={() => {
                                                    if (!isUploading) {
                                                        onAvatarSelect(avatarId);
                                                    }
                                                }}
                                                disabled={isUploading}
                                                className={cn(
                                                    "relative text-2xl md:text-3xl bg-gray-100 rounded-full aspect-square flex items-center justify-center transition-all duration-200 hover:scale-105",
                                                    currentPicture === avatarId
                                                        ? "ring-2 ring-primary ring-offset-2 bg-primary/10"
                                                        : "hover:bg-gray-200",
                                                    isUploading && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {getAvatarEmoji(avatarId)}
                                                {currentPicture === avatarId && !isUploading && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                                {isUploading && currentPicture === avatarId && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 text-center">
                                        💡 <strong>Tip:</strong> Choose an avatar for a quick setup, or upload your own photo for a more personal touch.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
