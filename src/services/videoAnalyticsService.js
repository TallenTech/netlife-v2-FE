import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

export const videoAnalyticsService = {

    // Toggle video like
    async toggleVideoLike(videoId, userId) {
        try {
            // Check if user already liked the video
            const { data: existingLike, error: checkError } = await supabase
                .from("video_likes")
                .select("id")
                .eq("video_id", videoId)
                .eq("user_id", userId)
                .single();

            if (checkError && checkError.code !== "PGRST116") {
                throw new Error(`Failed to check existing like: ${checkError.message}`);
            }

            if (existingLike) {
                // Unlike the video
                const { error: unlikeError } = await supabase
                    .from("video_likes")
                    .delete()
                    .eq("video_id", videoId)
                    .eq("user_id", userId);

                if (unlikeError) {
                    throw new Error(`Failed to unlike video: ${unlikeError.message}`);
                }

                // Update the video's like count
                await this.updateVideoLikeCount(videoId);

                return { liked: false, action: "unliked" };
            } else {
                // Like the video
                const { error: likeError } = await supabase
                    .from("video_likes")
                    .insert([{ video_id: videoId, user_id: userId }]);

                if (likeError) {
                    throw new Error(`Failed to like video: ${likeError.message}`);
                }

                // Update the video's like count
                await this.updateVideoLikeCount(videoId);

                return { liked: true, action: "liked" };
            }
        } catch (error) {
            logError(error, "videoAnalyticsService.toggleVideoLike", { videoId, userId });
            throw error;
        }
    },

    // Track video share
    async trackVideoShare(videoId, platform, userId = null, shareData = {}) {
        try {
            const shareRecord = {
                video_id: videoId,
                user_id: userId,
                share_platform: platform,
                ip_address: shareData.ipAddress || null,
                user_agent: shareData.userAgent || null,
            };

            const { error } = await supabase
                .from("video_shares")
                .insert([shareRecord]);

            if (error) {
                console.error("Failed to track video share:", error);
                return false;
            }

            // Update the video's share count
            await this.updateVideoShareCount(videoId);

            return true;
        } catch (error) {
            logError(error, "videoAnalyticsService.trackVideoShare", { videoId, platform, userId });
            return false;
        }
    },

    // Get video analytics with dynamic count calculation
    async getVideoAnalytics(videoId) {
        try {
            // Get the video record
            const { data: video, error: videoError } = await supabase
                .from("videos")
                .select("id, title, like_count, share_count")
                .eq("id", videoId)
                .single();

            if (videoError) {
                throw new Error(`Failed to fetch video: ${videoError.message}`);
            }

            // Calculate counts dynamically from related tables
            const [likeCount, shareCount] = await Promise.all([
                this.getVideoLikeCount(videoId),
                this.getVideoShareCount(videoId)
            ]);

            // Update the static count fields in the videos table
            await Promise.all([
                this.updateVideoLikeCount(videoId),
                this.updateVideoShareCount(videoId)
            ]);

            return {
                ...video,
                like_count: likeCount,
                share_count: shareCount
            };
        } catch (error) {
            logError(error, "videoAnalyticsService.getVideoAnalytics", { videoId });
            throw error;
        }
    },

    // Helper function to get video like count
    async getVideoLikeCount(videoId) {
        try {
            const { count, error } = await supabase
                .from("video_likes")
                .select("*", { count: "exact", head: true })
                .eq("video_id", videoId);

            if (error) {
                console.error("Failed to get video like count:", error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error("Error getting video like count:", error);
            return 0;
        }
    },

    // Helper function to get video share count
    async getVideoShareCount(videoId) {
        try {
            const { count, error } = await supabase
                .from("video_shares")
                .select("*", { count: "exact", head: true })
                .eq("video_id", videoId);

            if (error) {
                console.error("Failed to get video share count:", error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error("Error getting video share count:", error);
            return 0;
        }
    },

    // Helper function to update video like count in videos table
    async updateVideoLikeCount(videoId) {
        try {
            const likeCount = await this.getVideoLikeCount(videoId);

            const { error } = await supabase
                .from("videos")
                .update({ like_count: likeCount })
                .eq("id", videoId);

            if (error) {
                console.error("Failed to update video like count:", error);
            }
        } catch (error) {
            console.error("Error updating video like count:", error);
        }
    },

    // Helper function to update video share count in videos table
    async updateVideoShareCount(videoId) {
        try {
            const shareCount = await this.getVideoShareCount(videoId);
            const { error } = await supabase
                .from("videos")
                .update({ share_count: shareCount })
                .eq("id", videoId);

            if (error) {
                console.error("Failed to update video share count:", error);
            }
        } catch (error) {
            console.error("Error updating video share count:", error);
        }
    },

    // Check if user liked a video
    async checkUserLikeStatus(videoId, userId) {
        try {
            if (!userId) return { liked: false };

            const { data, error } = await supabase
                .from("video_likes")
                .select("id")
                .eq("video_id", videoId)
                .eq("user_id", userId)
                .single();

            if (error && error.code !== "PGRST116") {
                throw new Error(`Failed to check like status: ${error.message}`);
            }

            return { liked: !!data };
        } catch (error) {
            logError(error, "videoAnalyticsService.checkUserLikeStatus", { videoId, userId });
            return { liked: false };
        }
    },

    // Get user's video interaction history
    async getUserVideoInteractions(userId) {
        try {
            const { data: likes, error: likesError } = await supabase
                .from("video_likes")
                .select("video_id, liked_at")
                .eq("user_id", userId)
                .order("liked_at", { ascending: false });

            if (likesError) {
                throw new Error(`Failed to fetch user likes: ${likesError.message}`);
            }

            return {
                likes: likes || [],
            };
        } catch (error) {
            logError(error, "videoAnalyticsService.getUserVideoInteractions", { userId });
            throw error;
        }
    },

    // Utility function to sync all video counts (useful for fixing existing data)
    async syncAllVideoCounts() {
        try {
            // Get all videos
            const { data: videos, error: videosError } = await supabase
                .from("videos")
                .select("id");

            if (videosError) {
                throw new Error(`Failed to fetch videos: ${videosError.message}`);
            }

            if (!videos || videos.length === 0) {
                console.log("No videos found to sync");
                return;
            }

            console.log(`Syncing counts for ${videos.length} videos...`);

            // Update counts for each video
            const updatePromises = videos.map(async (video) => {
                try {
                    await Promise.all([
                        this.updateVideoLikeCount(video.id),
                        this.updateVideoShareCount(video.id)
                    ]);
                } catch (error) {
                    console.error(`Failed to sync counts for video ${video.id}:`, error);
                }
            });

            await Promise.all(updatePromises);
            console.log("Video count sync completed");
        } catch (error) {
            logError(error, "videoAnalyticsService.syncAllVideoCounts");
            throw error;
        }
    },

    // Test database permissions and connection
    async testDatabaseConnection() {
        try {
            console.log("🔍 Testing database connection and permissions...");

            // Test reading from videos table
            const { data: videos, error: videosError } = await supabase
                .from("videos")
                .select("id, title, like_count, share_count")
                .limit(1);

            if (videosError) {
                console.error("❌ Failed to read from videos table:", videosError);
                return false;
            }
            console.log("✅ Successfully read from videos table");

            // Test reading from video_likes table
            const { data: likes, error: likesError } = await supabase
                .from("video_likes")
                .select("id")
                .limit(1);

            if (likesError) {
                console.error("❌ Failed to read from video_likes table:", likesError);
                return false;
            }
            console.log("✅ Successfully read from video_likes table");

            // Test updating videos table (if we have a video)
            if (videos && videos.length > 0) {
                const testVideo = videos[0];
                const { error: updateError } = await supabase
                    .from("videos")
                    .update({ like_count: testVideo.like_count }) // Update with same value
                    .eq("id", testVideo.id);

                if (updateError) {
                    console.error("❌ Failed to update videos table:", updateError);
                    return false;
                }
                console.log("✅ Successfully updated videos table");
            }

            console.log("🎉 All database tests passed!");
            return true;
        } catch (error) {
            console.error("❌ Database test failed:", error);
            return false;
        }
    },
};
