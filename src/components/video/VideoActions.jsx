import React, { useState, useEffect, useRef } from "react";
import { ThumbsUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useToggleVideoLike, useVideoLikeStatus, useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { formatNumber } from "@/utils/utils";

const VideoActions = ({ videoId, videoTitle, videoUrl, className = "" }) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: likeStatus } = useVideoLikeStatus(videoId);
    const { data: analytics } = useVideoAnalytics(videoId);
    const toggleLikeMutation = useToggleVideoLike();

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

                {/* View Count Section */}
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1">
                    <div className="flex items-center space-x-1 sm:space-x-2 p-0 h-auto min-h-0 text-gray-600">
                        <Eye size={14} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-xs sm:text-sm font-medium">
                            {analytics?.view_count ? formatNumber(analytics.view_count) : "0"}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">Views</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoActions;
