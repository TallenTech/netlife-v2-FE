import { videoAnalyticsService } from "../videoAnalyticsService";
import { supabase } from "@/lib/supabase";

// Mock supabase
jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(),
                    order: jest.fn(),
                })),
            })),
            insert: jest.fn(() => ({
                select: jest.fn(),
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(),
            })),
        })),
    },
}));

describe("videoAnalyticsService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getVideoAnalytics", () => {
        it("should calculate counts dynamically from related tables", async () => {
            const mockVideo = {
                id: "test-video-id",
                title: "Test Video",
                like_count: 0,
                share_count: 0,
            };

            const mockLikeCount = 3;
            const mockShareCount = 2;

            // Mock video fetch
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: mockVideo,
                            error: null,
                        }),
                    }),
                }),
            });

            // Mock count queries
            const mockCountQuery = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        count: mockLikeCount,
                        error: null,
                    }),
                }),
            };

            supabase.from
                .mockReturnValueOnce({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: mockVideo,
                                error: null,
                            }),
                        }),
                    }),
                })
                .mockReturnValueOnce(mockCountQuery) // like count
                .mockReturnValueOnce(mockCountQuery); // share count

            const result = await videoAnalyticsService.getVideoAnalytics("test-video-id");

            expect(result).toEqual({
                ...mockVideo,
                like_count: mockLikeCount,
                share_count: mockShareCount,
            });
        });
    });

    describe("toggleVideoLike", () => {
        it("should like a video when not previously liked", async () => {
            const videoId = "test-video-id";
            const userId = "test-user-id";

            // Mock check for existing like (no existing like)
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: "PGRST116" }, // No rows returned
                        }),
                    }),
                }),
                insert: jest.fn().mockResolvedValue({
                    error: null,
                }),
            });

            const result = await videoAnalyticsService.toggleVideoLike(videoId, userId);

            expect(result).toEqual({ liked: true, action: "liked" });
        });

        it("should unlike a video when previously liked", async () => {
            const videoId = "test-video-id";
            const userId = "test-user-id";

            // Mock check for existing like (existing like found)
            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "existing-like-id" },
                            error: null,
                        }),
                    }),
                }),
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: null,
                    }),
                }),
            });

            const result = await videoAnalyticsService.toggleVideoLike(videoId, userId);

            expect(result).toEqual({ liked: false, action: "unliked" });
        });
    });



    describe("checkUserLikeStatus", () => {
        it("should return liked: false when user is not authenticated", async () => {
            const result = await videoAnalyticsService.checkUserLikeStatus("test-video-id", null);
            expect(result).toEqual({ liked: false });
        });

        it("should return liked: true when user has liked the video", async () => {
            const videoId = "test-video-id";
            const userId = "test-user-id";

            supabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { id: "like-id" },
                            error: null,
                        }),
                    }),
                }),
            });

            const result = await videoAnalyticsService.checkUserLikeStatus(videoId, userId);
            expect(result).toEqual({ liked: true });
        });
    });
});
