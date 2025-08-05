import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ThumbsUp, Share2, Play, Pause, Rewind, FastForward, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

const VideoPlayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { videoId } = useParams();
  const { toast } = useToast();
  const { video } = location.state || {};

  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!video) {
        toast({
            title: "Video not found",
            description: "You are being redirected.",
            variant: "destructive"
        });
        navigate('/videos');
    }
  }, [video, navigate, toast]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 2720); // Simulate 4:32 video duration (272s)
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  if (!video) {
    return null;
  }

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRewind = () => setProgress(p => Math.max(0, p - 10));
  const handleFastForward = () => setProgress(p => Math.min(100, p + 10));
  const handleMuteToggle = () => setIsMuted(!isMuted);
  const handleProgressChange = (value) => setProgress(value[0]);

  const toggleFullScreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (percentage) => {
    const totalSeconds = 272; // 4:32
    const currentSeconds = Math.floor((totalSeconds * percentage) / 100);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
            className="aspect-video bg-gray-900 rounded-2xl mb-4 flex items-center justify-center text-white relative overflow-hidden group"
          >
            <img  alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-40" src="https://images.unsplash.com/photo-1673648955093-5f22a6010474" />
            
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
                <span className="text-xs font-mono">{formatTime(progress)}</span>
                <Slider value={[progress]} onValueChange={handleProgressChange} className="w-full" />
                <span className="text-xs font-mono">{video.duration}</span>
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
              <span>{video.views} views</span>
            </div>

            <div className="flex items-center space-x-2 my-4">
              <Button onClick={handleLike} variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <ThumbsUp size={16} className="mr-2" /> Like
              </Button>
              <Button onClick={handleShare} variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                <Share2 size={16} className="mr-2" /> Share
              </Button>
            </div>

            <div className="prose prose-invert max-w-none text-gray-300">
              <p>{video.description}</p>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default VideoPlayer;