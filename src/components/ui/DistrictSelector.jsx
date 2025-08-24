import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ugandaDistricts } from "@/data/districts";

export const DistrictSelector = ({
    value,
    onChange,
    placeholder = "Select District",
    error,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showMobileModal, setShowMobileModal] = useState(false);

    const handleSelect = (district) => {
        onChange(district);
        setIsOpen(false);
        setShowMobileModal(false);
    };

    const handleMobileOpen = () => {
        setShowMobileModal(true);
    };

    const handleMobileClose = () => {
        setShowMobileModal(false);
    };

    return (
        <>
            {/* Desktop Dropdown */}
            <div className="hidden md:block relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full h-11 md:h-12 px-3 py-2 text-left bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${error ? "border-red-500" : "border-gray-300"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}`}
                >
                    <div className="flex items-center justify-between">
                        <span className={value ? "text-gray-900" : "text-gray-500"}>
                            {value || placeholder}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-hidden"
                        >
                            <div className="max-h-60 overflow-y-auto">
                                {ugandaDistricts.map((district) => (
                                    <button
                                        key={district}
                                        type="button"
                                        onClick={() => handleSelect(district)}
                                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${value === district ? "bg-primary/10 text-primary" : "text-gray-700"
                                            }`}
                                    >
                                        {district}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Button (triggers modal) */}
            <button
                type="button"
                onClick={handleMobileOpen}
                disabled={disabled}
                className={`md:hidden w-full h-11 md:h-12 px-3 py-2 text-left bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${error ? "border-red-500" : "border-gray-300"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}`}
            >
                <div className="flex items-center justify-between">
                    <span className={value ? "text-gray-900" : "text-gray-500"}>
                        {value || placeholder}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </button>

            {/* Mobile Slide-up Modal */}
            <AnimatePresence>
                {showMobileModal && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleMobileClose}
                            className="md:hidden fixed inset-0 bg-black/50 z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[80vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Select District</h3>
                                <button
                                    onClick={handleMobileClose}
                                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* District List */}
                            <div className="flex-1 overflow-y-auto">
                                {ugandaDistricts.map((district) => (
                                    <button
                                        key={district}
                                        type="button"
                                        onClick={() => handleSelect(district)}
                                        className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center ${value === district ? "bg-primary/10 text-primary" : "text-gray-700"
                                            }`}
                                    >
                                        <MapPin className={`w-4 h-4 mr-3 ${value === district ? "text-primary" : "text-gray-400"}`} />
                                        {district}
                                    </button>
                                ))}
                            </div>

                            {/* Cancel Button */}
                            <div className="p-4 border-t border-gray-200">
                                <Button
                                    onClick={handleMobileClose}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
