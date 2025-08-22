import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
    Globe,
    Filter,
    Check,
    Languages
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    SUPPORTED_LANGUAGES,
    getLanguageByCode,
    getDefaultLanguage
} from '@/data/languages';
import LanguageModal from './LanguageModal';

const LanguageFilter = ({
    selectedLanguages = [],
    onLanguageChange,
    availableLanguages = [],
    showCount = true,
    maxDisplay = 3,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initialize with default language if none selected
    useEffect(() => {
        if (selectedLanguages.length === 0) {
            const defaultLang = getDefaultLanguage();
            onLanguageChange([defaultLang.code]);
        }
    }, [selectedLanguages.length, onLanguageChange]);

    const handleLanguageSelect = (languageCode) => {
        // Single selection - just select the tapped language
        onLanguageChange([languageCode]);

        // Close dropdown after selection
        setIsOpen(false);
    };

    const handleSelectAll = () => {
        // For single selection, "Select All" means show all videos (no language filter)
        const allLanguageCodes = availableLanguages.length > 0
            ? availableLanguages.map(lang => lang.code)
            : SUPPORTED_LANGUAGES.map(lang => lang.code);
        onLanguageChange(allLanguageCodes);
        setIsOpen(false);
    };

    const handleClearAll = () => {
        // Clear means go back to default language
        const defaultLang = getDefaultLanguage();
        onLanguageChange([defaultLang.code]);
        setIsOpen(false);
    };



    const isAllSelected = selectedLanguages.length === (availableLanguages.length > 0 ? availableLanguages.length : SUPPORTED_LANGUAGES.length);
    const isOnlyDefaultSelected = selectedLanguages.length === 1 &&
        selectedLanguages[0] === getDefaultLanguage().code;

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {/* Mobile: Modal Trigger */}
            <div className="md:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 h-8 px-2.5"
                >
                    <Globe className="h-3.5 w-3.5" />
                    <Filter className="h-2.5 w-2.5" />
                </Button>
            </div>

            {/* Desktop: Language Filter Dropdown */}
            <div className="hidden md:block">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 h-9 px-3"
                        >
                            <Globe className="h-4 w-4" />
                            <span className="text-sm">Languages</span>
                            <Filter className="h-3 w-3" />
                            {selectedLanguages.length === 1 && selectedLanguages[0] !== getDefaultLanguage().code && (
                                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                                    {getLanguageByCode(selectedLanguages[0])?.name || selectedLanguages[0]}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" className="w-64 sm:w-72">
                        <DropdownMenuLabel className="flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            Select Languages
                        </DropdownMenuLabel>

                        <DropdownMenuSeparator />

                        {/* Select All / Clear All */}
                        <div className="flex gap-1 p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAll}
                                className="flex-1 h-7 text-xs"
                            >
                                Show All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                disabled={isOnlyDefaultSelected}
                                className="flex-1 h-7 text-xs"
                            >
                                Default
                            </Button>
                        </div>

                        <DropdownMenuSeparator />

                        {/* Language Options */}
                        {(availableLanguages.length > 0 ? availableLanguages : SUPPORTED_LANGUAGES).map((language) => {
                            const isSelected = selectedLanguages.includes(language.code);
                            const isDefault = language.isDefault;

                            return (
                                <DropdownMenuCheckboxItem
                                    key={language.code}
                                    checked={isSelected}
                                    onCheckedChange={() => handleLanguageSelect(language.code)}
                                    className="flex items-center gap-3 py-2 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 flex-1">
                                        <span className="text-lg">{language.flag}</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {language.name}
                                            </span>
                                            {language.nativeName !== language.name && (
                                                <span className="text-xs text-gray-500">
                                                    {language.nativeName}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}

                                    {isDefault && (
                                        <Badge variant="outline" className="text-xs">
                                            Default
                                        </Badge>
                                    )}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Language Modal for Mobile */}
            <LanguageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedLanguages={selectedLanguages}
                onLanguageChange={onLanguageChange}
                availableLanguages={availableLanguages}
            />
        </div>
    );
};

export default LanguageFilter;
