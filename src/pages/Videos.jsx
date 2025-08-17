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

const Videos = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const { toast } = useToast();

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
        <div className="p-4 md:p-6 bg-white min-h-screen">
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
        <div className="p-4 md:p-6 bg-white min-h-screen">
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
      <div className="p-4 md:p-6 bg-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Health Library
          </h1>
          <p className="text-gray-500">
            Hi {user?.email || "there"}, here's some content for you.
          </p>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for videos..."
            className="pl-10 h-12 text-base bg-gray-100 border-transparent focus:bg-white focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto no-scrollbar mb-6">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${activeFilter === filter
                ? "bg-primary text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md mx-auto"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary-teal rounded-full flex items-center justify-center mx-auto mb-6">
                  <Video className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Videos Available Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  We're working on adding educational health videos to help you
                  stay informed. Check back soon for valuable content about HIV
                  prevention, testing, and treatment.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>Educational Content</span>
                  </div>
                  <div className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
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
                className="flex items-center space-x-4 bg-gray-50 border p-3 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="w-28 h-28 bg-gradient-to-br from-primary to-secondary-teal rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
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
                    // src="https://images.unsplash.com/photo-1567443024551-f3e3cc2be870"
                    />
                  )}
                  <Play
                    size={28}
                    className="text-white drop-shadow-lg relative z-10"
                  />
                </div>
                <div className="flex-1">
                  {video.source && (
                    <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full flex items-center w-fit mb-1">
                      <Tag size={12} className="mr-1" />
                      {video.source}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-800 leading-tight">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center">
                      <Play size={12} className="mr-1" />
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
            <div className="text-center py-16">
              <p className="text-gray-500 font-semibold">No videos found</p>
              <p className="text-gray-400 text-sm">
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
