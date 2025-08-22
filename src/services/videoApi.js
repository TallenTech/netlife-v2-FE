import { supabase } from '@/lib/supabase';

/**
 * Video API Service
 * Handles all video-related operations with language support
 */

/**
 * Get all videos with optional language filtering
 * @param {Object} options - Query options
 * @param {string[]} options.languages - Array of language codes to filter by
 * @param {string} options.category - Category/source filter
 * @param {string} options.search - Search term
 * @param {number} options.limit - Number of videos to return
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.sortBy - Sort field (created_at, view_count, like_count)
 * @param {string} options.sortOrder - Sort order (asc, desc)
 * @returns {Promise<Array>} Array of videos
 */
export const getVideos = async (options = {}) => {
    const {
        languages = [],
        category = null,
        search = null,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc'
    } = options;

    try {
        let query = supabase
            .from('videos')
            .select('*')
            .order(sortBy, { ascending: sortOrder === 'asc' });

        // Apply language filter
        if (languages.length > 0) {
            query = query.in('language_code', languages);
        }

        // Apply category filter
        if (category && category !== 'All') {
            query = query.eq('source', category);
        }

        // Apply search filter
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching videos:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in getVideos:', error);
        throw error;
    }
};

/**
 * Get video by ID with translation information
 * @param {string} videoId - Video ID
 * @param {string} preferredLanguage - Preferred language code
 * @returns {Promise<Object>} Video object with translations
 */
export const getVideoById = async (videoId, preferredLanguage = 'en') => {
    try {
        // Get the main video
        const { data: video, error: videoError } = await supabase
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();

        if (videoError) {
            console.error('Error fetching video:', videoError);
            throw videoError;
        }

        // Get translations if this video has them
        const { data: translations, error: translationsError } = await supabase
            .from('videos')
            .select('*')
            .eq('original_video_id', videoId)
            .order('language_code');

        if (translationsError) {
            console.error('Error fetching translations:', translationsError);
        }

        // Get original video if this is a translation
        let originalVideo = null;
        if (video.original_video_id) {
            const { data: original, error: originalError } = await supabase
                .from('videos')
                .select('*')
                .eq('id', video.original_video_id)
                .single();

            if (!originalError) {
                originalVideo = original;
            }
        }

        return {
            ...video,
            translations: translations || [],
            originalVideo
        };
    } catch (error) {
        console.error('Error in getVideoById:', error);
        throw error;
    }
};

/**
 * Get videos by language
 * @param {string} languageCode - Language code
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of videos in specified language
 */
export const getVideosByLanguage = async (languageCode, options = {}) => {
    return getVideos({
        ...options,
        languages: [languageCode]
    });
};

/**
 * Get video translations
 * @param {string} videoId - Original video ID
 * @returns {Promise<Array>} Array of translation videos
 */
export const getVideoTranslations = async (videoId) => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('original_video_id', videoId)
            .order('language_code');

        if (error) {
            console.error('Error fetching translations:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in getVideoTranslations:', error);
        throw error;
    }
};

/**
 * Get available languages for videos
 * @returns {Promise<Array>} Array of available language codes
 */
export const getAvailableLanguages = async () => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('language_code, language_name')
            .not('language_code', 'is', null);

        if (error) {
            console.error('Error fetching languages:', error);
            throw error;
        }

        // Get unique languages
        const uniqueLanguages = data.reduce((acc, video) => {
            if (!acc.find(lang => lang.code === video.language_code)) {
                acc.push({
                    code: video.language_code,
                    name: video.language_name
                });
            }
            return acc;
        }, []);

        return uniqueLanguages;
    } catch (error) {
        console.error('Error in getAvailableLanguages:', error);
        throw error;
    }
};

/**
 * Get video categories/sources
 * @returns {Promise<Array>} Array of video categories
 */
export const getVideoCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('source')
            .not('source', 'is', null);

        if (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }

        // Get unique categories
        const uniqueCategories = [...new Set(data.map(video => video.source))];
        return uniqueCategories;
    } catch (error) {
        console.error('Error in getVideoCategories:', error);
        throw error;
    }
};

/**
 * Increment video view count
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export const incrementVideoViews = async (videoId) => {
    try {
        const { error } = await supabase.rpc('increment_video_views', {
            video_id: videoId
        });

        if (error) {
            console.error('Error incrementing views:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in incrementVideoViews:', error);
        throw error;
    }
};

/**
 * Like/unlike a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @param {boolean} isLiked - Whether to like or unlike
 * @returns {Promise<void>}
 */
export const toggleVideoLike = async (videoId, userId, isLiked) => {
    try {
        if (isLiked) {
            // Add like
            const { error } = await supabase
                .from('video_likes')
                .insert({ video_id: videoId, user_id: userId });

            if (error && error.code !== '23505') { // Ignore duplicate key errors
                console.error('Error adding like:', error);
                throw error;
            }
        } else {
            // Remove like
            const { error } = await supabase
                .from('video_likes')
                .delete()
                .eq('video_id', videoId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error removing like:', error);
                throw error;
            }
        }
    } catch (error) {
        console.error('Error in toggleVideoLike:', error);
        throw error;
    }
};

/**
 * Check if user has liked a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user has liked the video
 */
export const checkVideoLike = async (videoId, userId) => {
    try {
        const { data, error } = await supabase
            .from('video_likes')
            .select('id')
            .eq('video_id', videoId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore not found errors
            console.error('Error checking like:', error);
            throw error;
        }

        return !!data;
    } catch (error) {
        console.error('Error in checkVideoLike:', error);
        return false;
    }
};

/**
 * Search videos with advanced filtering
 * @param {Object} searchOptions - Search options
 * @returns {Promise<Array>} Array of matching videos
 */
export const searchVideos = async (searchOptions = {}) => {
    const {
        query = '',
        languages = [],
        categories = [],
        tags = [],
        duration = null, // { min: number, max: number }
        dateRange = null, // { start: Date, end: Date }
        limit = 20
    } = searchOptions;

    try {
        let supabaseQuery = supabase
            .from('videos')
            .select('*');

        // Text search
        if (query) {
            supabaseQuery = supabaseQuery.or(
                `title.ilike.%${query}%,description.ilike.%${query}%`
            );
        }

        // Language filter
        if (languages.length > 0) {
            supabaseQuery = supabaseQuery.in('language_code', languages);
        }

        // Category filter
        if (categories.length > 0) {
            supabaseQuery = supabaseQuery.in('source', categories);
        }

        // Tags filter
        if (tags.length > 0) {
            supabaseQuery = supabaseQuery.overlaps('tags', tags);
        }

        // Duration filter
        if (duration) {
            if (duration.min !== undefined) {
                supabaseQuery = supabaseQuery.gte('duration_seconds', duration.min);
            }
            if (duration.max !== undefined) {
                supabaseQuery = supabaseQuery.lte('duration_seconds', duration.max);
            }
        }

        // Date range filter
        if (dateRange) {
            if (dateRange.start) {
                supabaseQuery = supabaseQuery.gte('created_at', dateRange.start.toISOString());
            }
            if (dateRange.end) {
                supabaseQuery = supabaseQuery.lte('created_at', dateRange.end.toISOString());
            }
        }

        // Apply limit and ordering
        supabaseQuery = supabaseQuery
            .order('created_at', { ascending: false })
            .limit(limit);

        const { data, error } = await supabaseQuery;

        if (error) {
            console.error('Error searching videos:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in searchVideos:', error);
        throw error;
    }
};
