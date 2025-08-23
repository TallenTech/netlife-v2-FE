import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Play,
    Clock,
    Eye,
    Heart,
    Globe,
    Languages,
    Subtitles,
    Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getLanguageByCode, getLanguageDisplayName } from '@/data/languages';

const VideoCard = ({
    video,
    onPlay,
    onLike,
    className = "",
    showLanguageInfo = true,
    showTranslationStatus = true
}) => {
    const {
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        language_code = 'en',
        language_name,
        is_translated = false,
        original_video_id,
        subtitle_url,
        audio_track_url,
        view_count = 0,
        like_count = 0,
        duration_seconds = 0,
        tags = [],
        created_at
    } = video;

    const language = getLanguageByCode(language_code);
    const hasSubtitles = !!subtitle_url;
    const hasAudioTrack = !!audio_track_url;

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViewCount = (count) => {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -2 }}
            className={`group ${className}`}
        >
            <Card className="overflow-hidden border-2 border-gray-100 hover:border-primary/20 transition-all duration-200 hover:shadow-lg">
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    {/* Video Preview */}
                    {video_url ? (
                        <video
                            src={video_url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            poster=""
                        />
                    ) : (
                        /* Fallback Placeholder */
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <Play className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Video Preview</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                            onClick={() => onPlay?.(video)}
                            size="lg"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                        >
                            <Play className="h-6 w-6 ml-1" />
                        </Button>
                    </div>

                    {/* Duration Badge */}
                    {duration_seconds > 0 && (
                        <div className="absolute bottom-2 right-2">
                            <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(duration_seconds)}
                            </Badge>
                        </div>
                    )}

                    {/* Language Badge */}
                    {showLanguageInfo && language && (
                        <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="bg-white/90 text-gray-900 text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                {language.flag} {language.name}
                            </Badge>
                        </div>
                    )}

                    {/* Translation Status */}
                    {showTranslationStatus && is_translated && (
                        <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs border-blue-200">
                                <Languages className="h-3 w-3 mr-1" />
                                Translated
                            </Badge>
                        </div>
                    )}

                    {/* Audio/Subtitle Indicators */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                        {hasSubtitles && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-200">
                                <Subtitles className="h-3 w-3" />
                            </Badge>
                        )}
                        {hasAudioTrack && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs border-purple-200">
                                <Volume2 className="h-3 w-3" />
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Video Content */}
                <CardHeader className="pb-3">
                    <div className="space-y-2">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                            {title}
                        </h3>

                        {/* Description */}
                        {description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {description}
                            </p>
                        )}

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                                {tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{tags.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>

                {/* Video Stats & Actions */}
                <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{formatViewCount(view_count)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{formatViewCount(like_count)}</span>
                            </div>

                        </div>

                        {/* Date */}
                        {created_at && (
                            <span className="text-xs text-gray-400">
                                {formatDate(created_at)}
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button
                            onClick={() => onPlay?.(video)}
                            size="sm"
                            className="flex-1"
                        >
                            <Play className="h-4 w-4 mr-1" />
                            Watch
                        </Button>

                        <Button
                            onClick={() => onLike?.(video)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            <Heart className="h-4 w-4" />
                        </Button>


                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default VideoCard;
