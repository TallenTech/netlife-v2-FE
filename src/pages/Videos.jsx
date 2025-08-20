import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Tag, Search, Video, BookOpen, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { formatSmartTime } from "@/utils/timeUtils";
import { useVideos } from "@/hooks/useServiceQueries";
import VideoAnalytics from "@/components/video/VideoAnalytics";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const Videos = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesFilter =
        activeFilter === "All" || video.source === activeFilter;
      const matchesSearch = video.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [videos, activeFilter, searchTerm]);

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

      {/* Mobile Header - Fixed */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Health Library
              </h1>
              <p className="text-xs text-gray-500">
                Educational health videos and content
              </p>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900 placeholder-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="py-4 md:py-6 bg-white min-h-screen pt-16 md:pt-20">
        {/* Sticky Filter Component - Directly under header */}
        <div className="sticky top-16 md:top-24 z-20 pb-2">
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-full p-1 inline-flex">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 md:px-6 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${activeFilter === filter
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
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
            filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() =>
                  navigate(`/videos/${video.id}`, { state: { video } })
                }
                className="flex items-center space-x-3 md:space-x-4 bg-gray-50 border p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-primary to-secondary-teal rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {video.video_url ? (
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      src={video.video_url}
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  )}
                  <Play
                    size={20}
                    className="md:hidden text-white drop-shadow-lg relative z-10"
                  />
                  <Play
                    size={28}
                    className="hidden md:block text-white drop-shadow-lg relative z-10"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {video.source && (
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full flex items-center w-fit mb-1">
                      <Tag size={10} className="mr-1 md:hidden" />
                      <Tag size={12} className="mr-1 hidden md:block" />
                      {video.source}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-800 leading-tight text-sm md:text-base line-clamp-2">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 md:space-x-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center">
                      <Play size={10} className="mr-1 md:hidden" />
                      <Play size={12} className="mr-1 hidden md:block" />
                      Video
                    </span>
                    <span>{formatSmartTime(video.created_at)}</span>
                  </div>
                  <div className="mt-2">
                    <VideoAnalytics videoId={video.id} className="text-xs" />
                  </div>
                </div>
              </motion.div>
            ))
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
