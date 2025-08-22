import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Tag, Search, Video, BookOpen, AlertCircle, Globe, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { formatSmartTime } from "@/utils/timeUtils";
import { useVideos } from "@/hooks/useServiceQueries";
import VideoAnalytics from "@/components/video/VideoAnalytics";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import LanguageFilter from "@/components/video/LanguageFilter";
import VideoCard from "@/components/video/VideoCard";
import { getDefaultLanguage, getLanguageByCode } from "@/data/languages";

const Videos = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState([getDefaultLanguage().code]);

  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const { toast } = useToast();

  // Ensure page scrolls to top when navigated to
  useScrollToTop();

  const { data: videos = [], isLoading, error } = useVideos();

  const filters = useMemo(() => {
    const categories = [
      ...new Set(videos.map((video) => video.source).filter(Boolean)),
    ];
    return ["All", ...categories];
  }, [videos]);

  // Extract available languages from videos
  const availableLanguages = useMemo(() => {
    const languageMap = new Map();

    videos.forEach(video => {
      const langCode = video.language_code || 'en';
      const langName = video.language_name || 'English';

      if (!languageMap.has(langCode)) {
        languageMap.set(langCode, {
          code: langCode,
          name: langName,
          flag: getLanguageByCode(langCode)?.flag || '🌐',
          nativeName: getLanguageByCode(langCode)?.nativeName || langName,
          isDefault: langCode === getDefaultLanguage().code
        });
      }
    });

    return Array.from(languageMap.values()).sort((a, b) => {
      // Put default language first
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // Category filter
      const matchesFilter =
        activeFilter === "All" || video.source === activeFilter;

      // Search filter
      const matchesSearch = searchTerm === "" || video.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Language filter - check if video has any of the selected languages
      const videoLanguage = video.language_code || 'en';
      const matchesLanguage = selectedLanguages.includes(videoLanguage);

      return matchesFilter && matchesSearch && matchesLanguage;
    });
  }, [videos, activeFilter, searchTerm, selectedLanguages]);

  const formatDuration = (duration) => {
    if (!duration) return "0:00";
    if (typeof duration === "string" && duration.includes(":")) return duration;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Health Videos - NetLife</title>
        </Helmet>
        <div className="py-4 md:py-6 bg-white min-h-screen pt-16 md:pt-20">
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Health Library
            </h1>
            <p className="text-gray-500">Loading videos...</p>
          </header>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 bg-gray-50 border p-3 rounded-2xl animate-pulse"
              >
                <div className="w-28 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Health Videos - NetLife</title>
        </Helmet>
        <div className="py-4 md:py-6 bg-white min-h-screen pt-16 md:pt-20">
          <header className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Health Library
            </h1>
            <p className="text-gray-500">
              Hi {user?.email || "there"}, here's some content for you.
            </p>
          </header>
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to load videos
            </h3>
            <p className="text-gray-500 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Health Videos - NetLife</title>
      </Helmet>

      {/* Fixed Page Title and Search - Desktop Only */}
      <div className="hidden md:block fixed top-0 left-64 right-0 z-40 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center px-6 py-4 pb-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Health Library
            </h1>
            <p className="text-sm text-gray-600">
              Educational health videos and content
            </p>
          </div>

          {/* Search Bar - Desktop */}
          <div className="relative w-80 mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder-gray-400 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1"></div>
        </div>
      </div>

      {/* Mobile Header - Non-fixed */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Health Library
              </h1>
              <p className="text-xs text-gray-500">
                Educational health videos and content
              </p>
            </div>
          </div>


        </div>
      </div>

      <div className="py-4 md:py-6 bg-white min-h-screen md:pt-20">
        {/* Sticky Filter Component - Directly under header */}
        <div className="sticky top-0 md:top-24 z-20 pb-3 bg-white pt-2">
          {/* Mobile: Horizontal layout */}
          <div className="md:hidden px-4">
            {/* Search Bar - Mobile (Hidden by default) */}
            <div className="relative mb-3" id="mobile-search-container" style={{ display: 'none' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="mobile-search-input"
                type="text"
                placeholder="Search videos..."
                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder-gray-400 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => {
                  const searchContainer = document.getElementById('mobile-search-container');
                  const filtersRow = document.getElementById('mobile-filters-row');
                  if (searchContainer && filtersRow) {
                    searchContainer.style.display = 'none';
                    filtersRow.style.display = 'flex';
                    setSearchTerm('');
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Filters Row - Mobile */}
            <div className="flex items-center gap-2" id="mobile-filters-row">
              {/* Category Filters - Mobile - Auto width */}
              <div className="flex-auto">
                <div className="bg-gray-100 rounded-full p-1 inline-flex flex-wrap">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${activeFilter === filter
                        ? "bg-white text-primary shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Icon - Mobile */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    const searchContainer = document.getElementById('mobile-search-container');
                    const filtersRow = document.getElementById('mobile-filters-row');
                    const searchInput = document.getElementById('mobile-search-input');
                    if (searchContainer && searchInput && filtersRow) {
                      if (searchContainer.style.display === 'none' || !searchContainer.style.display) {
                        searchContainer.style.display = 'block';
                        filtersRow.style.display = 'none';
                        searchInput.focus();
                      } else {
                        searchContainer.style.display = 'none';
                        filtersRow.style.display = 'flex';
                        setSearchTerm('');
                      }
                    }
                  }}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Language Filter - Mobile - Extreme Right */}
              <div className="flex-shrink-0">
                <LanguageFilter
                  selectedLanguages={selectedLanguages}
                  onLanguageChange={setSelectedLanguages}
                  availableLanguages={availableLanguages}
                  className="max-w-full"
                  maxDisplay={2}
                />
              </div>
            </div>
          </div>

          {/* Desktop: Side-by-side layout */}
          <div className="hidden md:flex items-center justify-between gap-4 px-6">
            {/* Category Filters - Desktop */}
            <div className="flex-1 flex justify-center">
              <div className="bg-gray-100 rounded-full p-1 inline-flex">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${activeFilter === filter
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter - Desktop */}
            <div className="flex-shrink-0">
              <LanguageFilter
                selectedLanguages={selectedLanguages}
                onLanguageChange={setSelectedLanguages}
                availableLanguages={availableLanguages}
                maxDisplay={3}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-6 px-4 md:px-0">
          {/* Filter Status Indicator */}
          {(activeFilter !== "All" || searchTerm || (selectedLanguages.length === 1 && selectedLanguages[0] !== getDefaultLanguage().code)) && (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                <span>Filtered results</span>
                {activeFilter !== "All" && (
                  <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">
                    {activeFilter}
                  </span>
                )}
                {searchTerm && (
                  <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">
                    "{searchTerm}"
                  </span>
                )}
                {selectedLanguages.length === 1 && selectedLanguages[0] !== getDefaultLanguage().code && (
                  <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">
                    {getLanguageByCode(selectedLanguages[0])?.name || selectedLanguages[0]}
                  </span>
                )}
              </div>
            </div>
          )}
          {videos.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md mx-auto"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary to-secondary-teal rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Video className="h-10 w-10 md:h-12 md:w-12 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                  No Videos Available Yet
                </h3>
                <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6 px-4">
                  We're working on adding educational health videos to help you
                  stay informed. Check back soon for valuable content about HIV
                  prevention, testing, and treatment.
                </p>
                <div className="flex items-center justify-center space-x-3 md:space-x-4 text-xs md:text-sm text-gray-400">
                  <div className="flex items-center">
                    <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span>Educational Content</span>
                  </div>
                  <div className="flex items-center">
                    <Play className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span>Video Library</span>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 -mx-4 md:mx-0">
              {filteredVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="px-4 md:px-0"
                >
                  <VideoCard
                    video={video}
                    onPlay={() => navigate(`/videos/${video.id}`, { state: { video } })}
                    onLike={() => {
                      // Handle like functionality
                      toast({
                        title: "Video liked!",
                        description: "Thank you for your feedback.",
                      });
                    }}
                    onShare={() => {
                      // Handle share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: video.title,
                          text: video.description,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link copied!",
                          description: "Video link copied to clipboard.",
                        });
                      }
                    }}
                    showLanguageInfo={true}
                    showTranslationStatus={true}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16">
              <p className="text-gray-500 font-semibold text-sm md:text-base">No videos found</p>
              <p className="text-gray-400 text-xs md:text-sm">
                Try adjusting your search or filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Videos;
