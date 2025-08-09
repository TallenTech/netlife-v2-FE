import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useUserData } from "@/contexts/UserDataContext";
import { Play, Eye, Tag, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const videos = [
  {
    id: 1,
    title: "Understanding HIV Prevention",
    duration: "4:32",
    views: "2.1k",
    category: "Prevention",
    thumbnail: "hiv-prevention-video-thumbnail",
    description:
      "Learn about the most effective methods to prevent HIV transmission, including condoms and regular testing.",
  },
  {
    id: 2,
    title: "How PrEP Works",
    duration: "6:15",
    views: "1.8k",
    category: "Prevention",
    thumbnail: "prep-explainer-video-thumbnail",
    description:
      "A deep dive into Pre-Exposure Prophylaxis (PrEP), how it works, and who it is for.",
  },
  {
    id: 3,
    title: "Getting Tested: What to Expect",
    duration: "3:45",
    views: "3.2k",
    category: "Testing",
    thumbnail: "hiv-testing-process-video-thumbnail",
    description:
      "This video walks you through the HIV testing process, from counseling to getting your results.",
  },
  {
    id: 4,
    title: "Living Well with HIV",
    duration: "7:20",
    views: "1.5k",
    category: "Treatment",
    thumbnail: "living-with-hiv-video-thumbnail",
    description:
      "Discover how to live a long, healthy life with HIV through proper treatment, diet, and mental health support.",
  },
  {
    id: 5,
    title: "Healthy Relationships & Communication",
    duration: "5:10",
    views: "2.7k",
    category: "Relationships",
    thumbnail: "healthy-relationships-video-thumbnail",
    description:
      "Learn the importance of communication and trust in maintaining healthy sexual relationships.",
  },
  {
    id: 6,
    title: "All About PEP",
    duration: "4:55",
    views: "1.2k",
    category: "Treatment",
    thumbnail: "pep-explainer-video-thumbnail",
    description:
      "Post-Exposure Prophylaxis (PEP) is an emergency medication. Find out when and how to use it.",
  },
];

const filters = ["All", "Prevention", "Testing", "Treatment", "Relationships"];

const Videos = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { userData } = useUserData();
  const navigate = useNavigate();

  const filteredVideos = videos.filter((video) => {
    const matchesFilter =
      activeFilter === "All" || video.category === activeFilter;
    const matchesSearch = video.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            Hi {userData?.username}, here's some content for you.
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
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                activeFilter === filter
                  ? "bg-primary text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredVideos.length > 0 ? (
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
                <div className="w-28 h-20 bg-gradient-to-br from-primary to-secondary-teal rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  <img
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    src="https://images.unsplash.com/photo-1567443024551-f3e3cc2be870"
                  />
                  <Play size={28} className="text-white drop-shadow-lg" />
                </div>
                <div className="flex-1">
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full flex items-center w-fit mb-1">
                    <Tag size={12} className="mr-1" />
                    {video.category}
                  </span>
                  <h3 className="font-bold text-gray-800 leading-tight">
                    {video.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                    <span>{video.duration}</span>
                    <span className="flex items-center">
                      <Eye size={12} className="mr-1" />
                      {video.views}
                    </span>
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
