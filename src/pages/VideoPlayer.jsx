import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ThumbsUp, Share2, Play, Pause, Rewind, FastForward, Volume2, VolumeX, Maximize, Minimize, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { servicesApi } from '@/services/servicesApi';
import { formatSmartTime } from '@/utils/timeUtils';

const VideoPlayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { videoId } = useParams();
  const { toast } = useToast();
  const { video: stateVideo } = location.state || {};

  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  const [video, setVideo] = useState(stateVideo);
  const [loading, setLoading] = useState(!stateVideo);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Fetch video if not provided in state
  useEffect(() => {
    const fetchVideo = async () => {
      if (stateVideo) return;
      
      try {
        setLoading(true);
        setError(null);
        const fetchedVideo = await servicesApi.getVideoById(videoId);
        
        if (!fetchedVideo) {
          setError('Video not found');
          toast({
            title: "Video not found",
            description: "The requested video could not be found.",
            variant: "destructive"
          });
          setTimeout(() => navigate('/videos'), 2000);
          return;
        }
        
        setVideo(fetchedVideo);
      } catch (error) {
        console.error('Failed to fetch video:', error);
        setError(error.message);
        toast({
          title: "Error loading video",
          description: "Failed to load video. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, stateVideo, navigate, toast]);

  // Handle video time updates
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      setProgress((videoElement.currentTime / videoElement.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [video]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Loading state
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Video - NetLife</title>
        </Helmet>
        <div className="bg-black min-h-screen flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !video) {
    return (
      <>
        <Helmet>
          <title>Video Error - NetLife</title>
        </Helmet>
        <div className="bg-black min-h-screen flex flex-col">
          <header className="p-4 flex items-center space-x-4 text-white">
            <Button variant="ghost" size="icon" onClick={() => navigate('/videos')} className="text-white hover:bg-white/10">
              <ArrowLeft />
            </Button>
            <h1 className="text-lg font-bold">Video Error</h1>
          </header>
          <div className="flex-1 flex items-center justify-center text-white">
            <div className="text-center max-w-md">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-bold mb-2">Video Not Available</h2>
              <p className="text-gray-300 mb-6">
                {error || 'The requested video could not be found or loaded.'}
              </p>
              <Button onClick={() => navigate('/videos')} className="bg-white text-black hover:bg-gray-200">
                Back to Videos
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handlePlayPause = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
  };

  const handleFastForward = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
  };

  const handleMuteToggle = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.muted = !videoElement.muted;
    setIsMuted(!isMuted);
  };

  const handleProgressChange = (value) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const newTime = (value[0] / 100) * videoElement.duration;
    videoElement.currentTime = newTime;
    setProgress(value[0]);
  };

  const toggleFullScreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: video.title,
      text: `Check out this video on NetLife: ${video.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      navigator.clipboard.writeText(shareData.url);
      toast({
        title: 'Link Copied!',
        description: 'A shareable link to this video has been copied to your clipboard.',
      });
    }
  };

  const handleLike = () => {
    toast({
      title: 'Thanks for the feedback!',
      description: `You liked "${video.title}".`,
    });
  };

  return (
    <>
      <Helmet>
        <title>{video.title} - NetLife Videos</title>
      </Helmet>
      <div ref={videoContainerRef} className="bg-black min-h-screen flex flex-col">
        <header className="p-4 flex items-center space-x-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10 text-white">
          <Button variant="ghost" size="icon" onClick={() => navigate('/videos')} className="text-white hover:bg-white/10 hover:text-white">
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-bold truncate">{video.title}</h1>
        </header>

        <main className="flex-1 flex flex-col justify-center p-4 md:p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="aspect-video bg-gray-900 rounded-2xl mb-4 relative overflow-hidden group"
          >
            {video.video_url ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={video.video_url}
                poster="https://images.unsplash.com/photo-1673648955093-5f22a6010474"
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white bg-gray-800">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-400">Video not available</p>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex items-center space-x-6">
                <Button onClick={handleRewind} variant="ghost" size="icon" className="text-white h-14 w-14 hover:bg-white/10 hover:text-white"><Rewind size={32} /></Button>
                <Button onClick={handlePlayPause} variant="ghost" size="icon" className="text-white h-20 w-20 bg-white/10 rounded-full hover:bg-white/20 hover:text-white">
                  {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-1" />}
                </Button>
                <Button onClick={handleFastForward} variant="ghost" size="icon" className="text-white h-14 w-14 hover:bg-white/10 hover:text-white"><FastForward size={32} /></Button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                <Slider value={[progress]} onValueChange={handleProgressChange} className="w-full" />
                <span className="text-xs font-mono">{formatTime(duration)}</span>
                <Button onClick={handleMuteToggle} variant="ghost" size="icon" className="text-white h-8 w-8 hover:bg-white/10 hover:text-white">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
                <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="text-white h-8 w-8 hover:bg-white/10 hover:text-white">
                  {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white"
          >
            <h2 className="text-2xl font-extrabold">{video.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-400 my-3">
              {video.source && (
                <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
                  {video.source}
                </span>
              )}
              <span>{formatSmartTime(video.created_at)}</span>
            </div>

            <div className="flex items-center space-x-2 my-4">
              <Button onClick={handleLike} variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <ThumbsUp size={16} className="mr-2" /> Like
              </Button>
              <Button onClick={handleShare} variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Share2 size={16} className="mr-2" /> Share
              </Button>
            </div>

            {video.description && (
              <div className="prose prose-invert max-w-none text-gray-300">
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