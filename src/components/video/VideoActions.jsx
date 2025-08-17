import React, { useState, useEffect, useRef } from "react";
import { ThumbsUp, Share2, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useToggleVideoLike, useTrackVideoShare, useVideoLikeStatus, useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { formatNumber } from "@/utils/utils";

const VideoActions = ({ videoId, videoTitle, videoUrl, className = "" }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showShareOptions, setShowShareOptions] = useState(false);
    const shareDropdownRef = useRef(null);

    const { data: likeStatus } = useVideoLikeStatus(videoId);
    const { data: analytics } = useVideoAnalytics(videoId);
    const toggleLikeMutation = useToggleVideoLike();
    const trackShareMutation = useTrackVideoShare();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
                setShowShareOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLike = async () => {
        if (!user) {
            toast({
                title: "Login Required",
                description: "Please log in to like videos",
                variant: "destructive",
            });
            return;
        }

        try {
            await toggleLikeMutation.mutateAsync({ videoId });
            toast({
                title: likeStatus?.liked ? "Video Unliked" : "Video Liked",
                description: likeStatus?.liked ? "Removed from your liked videos" : "Added to your liked videos",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update like status",
                variant: "destructive",
            });
        }
    };

    const handleShare = async (platform) => {
        const shareUrl = `${window.location.origin}/videos/${videoId}`;
        const shareText = `Check out this video: ${videoTitle}`;

        let shareLink = "";
        let successMessage = "";

        switch (platform) {
            case "whatsapp":
                shareLink = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
                successMessage = "Opening WhatsApp...";
                break;
            case "facebook":
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                successMessage = "Opening Facebook...";
                break;
            case "twitter":
                shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                successMessage = "Opening Twitter...";
                break;
            case "copy":
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    successMessage = "Link copied to clipboard!";
                } catch (error) {
                    // Fallback for older browsers
                    const textArea = document.createElement("textarea");
                    textArea.value = shareUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textArea);
                    successMessage = "Link copied to clipboard!";
                }
                break;
            default:
                return;
        }

        // Track the share
        try {
            await trackShareMutation.mutateAsync({
                videoId,
                platform,
                shareData: {
                    userAgent: navigator.userAgent,
                },
            });
        } catch (error) {
            console.error("Failed to track share:", error);
        }

        // Show success message
        toast({
            title: "Shared!",
            description: successMessage,
        });

        // Open share link if not copy
        if (platform !== "copy" && shareLink) {
            window.open(shareLink, "_blank", "noopener,noreferrer");
        }

        setShowShareOptions(false);
    };

    return (
        <div className={`flex items-center ${className}`}>
            {/* Single Capsule Container */}
            <div className="flex items-center bg-gray-100 rounded-full px-1 py-2 sm:px-2 sm:py-2">
                {/* Like Section */}
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        disabled={toggleLikeMutation.isPending}
                        className={`flex items-center space-x-1 sm:space-x-2 p-0 h-auto min-h-0 ${likeStatus?.liked ? "text-red-500" : "text-gray-600"}`}
                    >
                        <ThumbsUp size={14} className={`${likeStatus?.liked ? "fill-current" : ""} sm:w-[18px] sm:h-[18px]`} />
                        <span className="text-xs sm:text-sm font-medium">
                            {analytics?.like_count ? formatNumber(analytics.like_count) : "0"}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">Like</span>
                    </Button>
                </div>

                {/* Divider */}
                <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1"></div>

                {/* Share Section */}
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1 relative" ref={shareDropdownRef}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowShareOptions(!showShareOptions)}
                        className="flex items-center space-x-1 sm:space-x-2 p-0 h-auto min-h-0 text-gray-600"
                    >
                        <Share2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-xs sm:text-sm font-medium">
                            {analytics?.share_count ? formatNumber(analytics.share_count) : "0"}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">Share</span>
                    </Button>

                    {/* Share Options Dropdown */}
                    {showShareOptions && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 z-50 min-w-[180px] sm:min-w-[200px]">
                            <div className="space-y-1">
                                <button
                                    onClick={() => handleShare("whatsapp")}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm"
                                >
                                    <MessageCircle size={16} className="text-green-500" />
                                    <span>Share on WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => handleShare("facebook")}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm"
                                >
                                    <ExternalLink size={16} className="text-blue-500" />
                                    <span>Share on Facebook</span>
                                </button>
                                <button
                                    onClick={() => handleShare("twitter")}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm"
                                >
                                    <ExternalLink size={16} className="text-blue-400" />
                                    <span>Share on Twitter</span>
                                </button>
                                <button
                                    onClick={() => handleShare("copy")}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 rounded-md text-sm"
                                >
                                    <Copy size={16} className="text-gray-500" />
                                    <span>Copy Link</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoActions;
