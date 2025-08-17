import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoAnalyticsService } from "@/services/videoAnalyticsService";
import { useAuth } from "@/contexts/AuthContext";

// Hook to get video analytics
export const useVideoAnalytics = (videoId) => {
    return useQuery({
        queryKey: ["videoAnalytics", videoId],
        queryFn: () => videoAnalyticsService.getVideoAnalytics(videoId),
        enabled: !!videoId,
    });
};

// Hook to check if user liked a video
export const useVideoLikeStatus = (videoId) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["videoLikeStatus", videoId, user?.id],
        queryFn: () => videoAnalyticsService.checkUserLikeStatus(videoId, user?.id),
        enabled: !!videoId && !!user?.id,
    });
};

// Hook to toggle video like
export const useToggleVideoLike = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: ({ videoId }) => videoAnalyticsService.toggleVideoLike(videoId, user?.id),
        onSuccess: (data, { videoId }) => {
            // Invalidate and refetch related queries
            queryClient.invalidateQueries({ queryKey: ["videoAnalytics", videoId] });
            queryClient.invalidateQueries({ queryKey: ["videoLikeStatus", videoId, user?.id] });
            queryClient.invalidateQueries({ queryKey: ["videos"] });

            // Optimistically update the like status
            queryClient.setQueryData(
                ["videoLikeStatus", videoId, user?.id],
                { liked: data.liked }
            );
        },
        onError: (error, { videoId }) => {
            console.error("Failed to toggle video like:", error);
        },
    });
};



// Hook to track video share
export const useTrackVideoShare = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: ({ videoId, platform, shareData }) =>
            videoAnalyticsService.trackVideoShare(videoId, platform, user?.id, shareData),
        onSuccess: (data, { videoId }) => {
            // Invalidate video analytics to refresh share count
            queryClient.invalidateQueries({ queryKey: ["videoAnalytics", videoId] });
        },
        onError: (error) => {
            console.error("Failed to track video share:", error);
        },
    });
};

// Hook to get user's video interactions
export const useUserVideoInteractions = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["userVideoInteractions", user?.id],
        queryFn: () => videoAnalyticsService.getUserVideoInteractions(user?.id),
        enabled: !!user?.id,
    });
};
