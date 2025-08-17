import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  ArrowLeft,
  ThumbsUp,
  Share2,
  Play,
  Pause,
  Rewind,
  FastForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useVideoById } from "@/hooks/useServiceQueries";
import { formatSmartTime } from "@/utils/timeUtils";
import VideoAnalytics from "@/components/video/VideoAnalytics";
import VideoActions from "@/components/video/VideoActions";


const VideoPlayer = () => {
  const navigate = useNavigate();
  const { videoId } = useParams();
  const { toast } = useToast();

  const { data: video, isLoading: loading, error } = useVideoById(videoId);

  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      setProgress((videoElement.currentTime / videoElement.duration) * 100);
    };

    const handleLoadedMetadata = () => setDuration(videoElement.duration);

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);

    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, [video, videoId]);

  useEffect(() => {
    const handleFullScreenChange = () =>
      setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Video - NetLife</title>
        </Helmet>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="text-center text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !video) {
    return (
      <>
        <Helmet>
          <title>Video Error - NetLife</title>
        </Helmet>
        <div className="bg-white min-h-screen flex flex-col">
          <header className="p-4 flex items-center space-x-4 text-gray-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/videos")}
              className="text-gray-800 hover:bg-gray-100"
            >
              <ArrowLeft />
            </Button>
            <h1 className="text-lg font-bold">Video Error</h1>
          </header>
          <div className="flex-1 flex items-center justify-center text-gray-800">
            <div className="text-center max-w-md">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2">Video Not Available</h2>
              <p className="text-gray-600 mb-6">
                {error?.message || "The requested video could not be found."}
              </p>
              <Button
                onClick={() => navigate("/videos")}
                className="bg-gray-800 text-white hover:bg-gray-700"
              >
                Back to Videos
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    if (videoRef.current)
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime - 10
      );
  };
  const handleFastForward = () => {
    if (videoRef.current)
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 10
      );
  };
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (value) => {
    if (!videoRef.current) return;
    const newTime = (value[0] / 100) * videoRef.current.duration;
    videoRef.current.currentTime = newTime;
  };

  const toggleFullScreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current
        .requestFullscreen()
        .catch((err) => console.error(`Fullscreen error: ${err.message}`));
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };



  return (
    <>
      <Helmet>
        <title>{video.title} - NetLife Videos</title>
      </Helmet>
      <div
        ref={videoContainerRef}
        className="bg-white min-h-screen flex flex-col"
      >
        <header className="p-4 flex items-center space-x-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10 text-gray-800 border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/videos")}
            className="text-gray-800 hover:bg-gray-100"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-bold truncate">{video.title}</h1>
        </header>
        <main className="flex-1 flex flex-col justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="aspect-video bg-gray-100 rounded-2xl mb-6 relative overflow-hidden group shadow-lg"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={video.video_url}
              //poster="https://images.unsplash.com/photo-1673648955093-5f22a6010474"
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex items-center space-x-6">
                <Button
                  onClick={handleRewind}
                  variant="ghost"
                  size="icon"
                  className="text-white h-14 w-14 hover:bg-white/20 hover:text-white bg-black/20 rounded-full"
                >
                  <Rewind size={32} />
                </Button>
                <Button
                  onClick={handlePlayPause}
                  variant="ghost"
                  size="icon"
                  className="text-white h-20 w-20 bg-white/20 rounded-full hover:bg-white/30 hover:text-white"
                >
                  {isPlaying ? (
                    <Pause size={40} />
                  ) : (
                    <Play size={40} className="ml-1" />
                  )}
                </Button>
                <Button
                  onClick={handleFastForward}
                  variant="ghost"
                  size="icon"
                  className="text-white h-14 w-14 hover:bg-white/20 hover:text-white bg-black/20 rounded-full"
                >
                  <FastForward size={32} />
                </Button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-white">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[progress]}
                  onValueChange={handleProgressChange}
                  className="w-full"
                />
                <span className="text-xs font-mono text-white">
                  {formatTime(duration)}
                </span>
                <Button
                  onClick={handleMuteToggle}
                  variant="ghost"
                  size="icon"
                  className="text-white h-8 w-8 hover:bg-white/20 hover:text-white bg-black/20 rounded-full"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
                <Button
                  onClick={toggleFullScreen}
                  variant="ghost"
                  size="icon"
                  className="text-white h-8 w-8 hover:bg-white/20 hover:text-white bg-black/20 rounded-full"
                >
                  {isFullScreen ? (
                    <Minimize size={18} />
                  ) : (
                    <Maximize size={18} />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-800"
          >
            <h2 className="text-2xl font-extrabold mb-3">{video.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
              {video.source && (
                <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
                  {video.source}
                </span>
              )}
              <span>{formatSmartTime(video.created_at)}</span>
            </div>

            {/* Video Actions with Analytics */}
            <div className="mb-6">
              <VideoActions
                videoId={videoId}
                videoTitle={video.title}
                videoUrl={video.video_url}
                className="text-gray-800"
              />
            </div>

            {video.description && (
              <div className="prose prose-gray max-w-none text-gray-600">
                <p>{video.description}</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default VideoPlayer;
