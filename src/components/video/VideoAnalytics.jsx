// This component is deprecated - analytics are now integrated into VideoActions
// Keeping for backward compatibility but not used in the new design

import React from "react";
import { ThumbsUp, Share2 } from "lucide-react";
import { useVideoAnalytics } from "@/hooks/useVideoAnalytics";
import { formatNumber } from "@/utils/utils";

const VideoAnalytics = ({ videoId, className = "" }) => {
    const { data: analytics, isLoading, error } = useVideoAnalytics(videoId);

    if (isLoading) {
        return (
            <div className={`flex items-center space-x-4 text-gray-500 ${className}`}>
                <div className="flex items-center space-x-1">
                    <ThumbsUp size={16} />
                    <span className="text-sm">--</span>
                </div>
                <div className="flex items-center space-x-1">
                    <Share2 size={16} />
                    <span className="text-sm">--</span>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return null;
    }

    return (
        <div className={`flex items-center space-x-4 text-gray-500 ${className}`}>
            <div className="flex items-center space-x-1">
                <ThumbsUp size={16} />
                <span className="text-sm">{formatNumber(analytics.like_count || 0)}</span>
            </div>
            <div className="flex items-center space-x-1">
                <Share2 size={16} />
                <span className="text-sm">{formatNumber(analytics.share_count || 0)}</span>
            </div>
        </div>
    );
};

export default VideoAnalytics;
