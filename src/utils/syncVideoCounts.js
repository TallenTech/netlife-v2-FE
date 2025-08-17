import { videoAnalyticsService } from "@/services/videoAnalyticsService";

/**
 * Utility script to sync all video counts
 * Run this in the browser console or as a one-time script to fix existing data
 */
export const syncVideoCounts = async () => {
    try {
        console.log("Starting video count sync...");
        await videoAnalyticsService.syncAllVideoCounts();
        console.log("✅ Video count sync completed successfully!");
    } catch (error) {
        console.error("❌ Failed to sync video counts:", error);
    }
};

/**
 * Debug function to test video analytics for a specific video
 */
export const debugVideoAnalytics = async (videoId) => {
    try {
        console.log(`🔍 Debugging video analytics for video: ${videoId}`);

        // Test individual count functions
        console.log("📊 Testing individual count functions...");
        const likeCount = await videoAnalyticsService.getVideoLikeCount(videoId);
        const shareCount = await videoAnalyticsService.getVideoShareCount(videoId);

        console.log(`Likes: ${likeCount}, Shares: ${shareCount}`);

        // Test full analytics
        console.log("📈 Testing full analytics...");
        const analytics = await videoAnalyticsService.getVideoAnalytics(videoId);
        console.log("Full analytics result:", analytics);

        return analytics;
    } catch (error) {
        console.error("❌ Debug failed:", error);
    }
};

/**
 * Test database connection and permissions
 */
export const testDatabaseConnection = async () => {
    try {
        console.log("🔍 Testing database connection...");
        const result = await videoAnalyticsService.testDatabaseConnection();
        return result;
    } catch (error) {
        console.error("❌ Database test failed:", error);
        return false;
    }
};



// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
    // Make it available globally for browser console access
    window.syncVideoCounts = syncVideoCounts;
    window.debugVideoAnalytics = debugVideoAnalytics;
    window.testDatabaseConnection = testDatabaseConnection;
    console.log("Video analytics utilities loaded:");
    console.log("- Run 'syncVideoCounts()' to sync all video counts");
    console.log("- Run 'debugVideoAnalytics(videoId)' to debug a specific video");
    console.log("- Run 'testDatabaseConnection()' to test database permissions");
}
