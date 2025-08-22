import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    SUPPORTED_LANGUAGES,
    getLanguageByCode,
    getDefaultLanguage
} from '@/data/languages';

const LanguageModal = ({
    isOpen,
    onClose,
    selectedLanguages = [],
    onLanguageChange,
    availableLanguages = []
}) => {
    const handleLanguageSelect = (languageCode) => {
        // Single selection - just select the tapped language
        onLanguageChange([languageCode]);
        onClose();
    };

    const handleSelectAll = () => {
        // For single selection, "Select All" means show all videos (no language filter)
        const allLanguageCodes = availableLanguages.length > 0
            ? availableLanguages.map(lang => lang.code)
            : SUPPORTED_LANGUAGES.map(lang => lang.code);
        onLanguageChange(allLanguageCodes);
        onClose();
    };

    const handleClearAll = () => {
        // Clear means go back to default language
        const defaultLang = getDefaultLanguage();
        onLanguageChange([defaultLang.code]);
        onClose();
    };

    const isAllSelected = selectedLanguages.length === (availableLanguages.length > 0 ? availableLanguages.length : SUPPORTED_LANGUAGES.length);
    const isOnlyDefaultSelected = selectedLanguages.length === 1 &&
        selectedLanguages[0] === getDefaultLanguage().code;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Select Language
                                    </h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="px-6 py-3 border-b border-gray-100">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    className="flex-1 h-9 text-sm"
                                >
                                    Show All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAll}
                                    disabled={isOnlyDefaultSelected}
                                    className="flex-1 h-9 text-sm"
                                >
                                    Default
                                </Button>
                            </div>
                        </div>

                        {/* Language Options */}
                        <div className="max-h-96 overflow-y-auto px-6 py-4">
                            <div className="space-y-2">
                                {(availableLanguages.length > 0 ? availableLanguages : SUPPORTED_LANGUAGES).map((language) => {
                                    const isSelected = selectedLanguages.includes(language.code);
                                    const isDefault = language.isDefault;

                                    return (
                                        <button
                                            key={language.code}
                                            onClick={() => handleLanguageSelect(language.code)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isSelected
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="text-2xl">{language.flag}</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {language.name}
                                                    </span>
                                                    {language.nativeName !== language.name && (
                                                        <span className="text-xs text-gray-500">
                                                            {language.nativeName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isDefault && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Default
                                                    </Badge>
                                                )}
                                                {isSelected && (
                                                    <Check className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom padding for safe area */}
                        <div className="h-6"></div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LanguageModal;
