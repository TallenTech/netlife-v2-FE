# 🌍 Multilingual Video Filtering

## Overview

The Multilingual Video Filtering feature allows users to filter and view educational health videos in their preferred languages. This feature is designed to serve NetLife's diverse global audience, particularly focusing on languages relevant to the Uganda market.

## Features

### ✅ **Core Functionality**
- **Language-based filtering**: Filter videos by language code
- **Multi-language selection**: Select multiple languages simultaneously
- **Translation support**: Identify and display translated videos
- **Subtitle indicators**: Show which videos have subtitle support
- **Audio track indicators**: Display videos with alternative audio tracks
- **Smart defaults**: Automatically select user's preferred language

### ✅ **Supported Languages**
- **English** (en) - Default language
- **Swahili** (sw) - Widely spoken in East Africa
- **Luganda** (lg) - Major language in Uganda
- **Runyankole** (rn) - Western Uganda
- **Acholi** (ach) - Northern Uganda
- **Ateso** (teo) - Eastern Uganda

### ✅ **User Experience**
- **Intuitive interface**: Easy-to-use language filter dropdown
- **Visual indicators**: Language flags and badges
- **Responsive design**: Works on all device sizes
- **Accessibility**: Screen reader friendly
- **Performance**: Fast filtering with minimal API calls

## Database Schema

### **Videos Table Updates**

```sql
-- Language support columns
ALTER TABLE videos ADD COLUMN language_code VARCHAR(5);
ALTER TABLE videos ADD COLUMN language_name VARCHAR(50);
ALTER TABLE videos ADD COLUMN is_translated BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN original_video_id UUID REFERENCES videos(id);
ALTER TABLE videos ADD COLUMN subtitle_url TEXT;
ALTER TABLE videos ADD COLUMN audio_track_url TEXT;

-- Indexes for performance
CREATE INDEX idx_videos_language_code ON videos(language_code);
CREATE INDEX idx_videos_original_video_id ON videos(original_video_id);
```

### **Column Descriptions**

| Column | Type | Description |
|--------|------|-------------|
| `language_code` | VARCHAR(5) | ISO 639-1 language code (e.g., 'en', 'sw', 'lg') |
| `language_name` | VARCHAR(50) | Human-readable language name |
| `is_translated` | BOOLEAN | Whether this video is a translation |
| `original_video_id` | UUID | Reference to original video if translated |
| `subtitle_url` | TEXT | URL to subtitle file (SRT, VTT) |
| `audio_track_url` | TEXT | URL to alternative audio track |

## Components

### **1. LanguageFilter Component**

**Location**: `src/components/video/LanguageFilter.jsx`

**Features**:
- Dropdown menu with language selection
- Multi-select capability
- Visual language indicators (flags)
- Select All/Clear All functionality
- Responsive design

**Usage**:
```jsx
import LanguageFilter from '@/components/video/LanguageFilter';

<LanguageFilter
  selectedLanguages={['en', 'sw']}
  onLanguageChange={setSelectedLanguages}
  showCount={true}
  maxDisplay={3}
/>
```

### **2. VideoCard Component**

**Location**: `src/components/video/VideoCard.jsx`

**Features**:
- Language badge display
- Translation status indicator
- Subtitle/audio track indicators
- Enhanced video information
- Interactive elements

**Usage**:
```jsx
import VideoCard from '@/components/video/VideoCard';

<VideoCard
  video={videoData}
  onPlay={handlePlay}
  onLike={handleLike}
  onShare={handleShare}
  showLanguageInfo={true}
  showTranslationStatus={true}
/>
```

## API Integration

### **Video API Service**

**Location**: `src/services/videoApi.js`

**Key Functions**:

#### **getVideos(options)**
```javascript
const videos = await getVideos({
  languages: ['en', 'sw'],
  category: 'HIV Prevention',
  search: 'testing',
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'desc'
});
```

#### **getVideoById(videoId, preferredLanguage)**
```javascript
const video = await getVideoById('video-uuid', 'sw');
// Returns video with translations and original video info
```

#### **getVideosByLanguage(languageCode, options)**
```javascript
const swahiliVideos = await getVideosByLanguage('sw', {
  limit: 10,
  sortBy: 'view_count'
});
```

#### **searchVideos(searchOptions)**
```javascript
const results = await searchVideos({
  query: 'HIV testing',
  languages: ['en', 'lg'],
  categories: ['Education'],
  tags: ['prevention'],
  duration: { min: 60, max: 300 },
  limit: 15
});
```

## Implementation Guide

### **Step 1: Database Migration**

Run the migration script to add language support:

```bash
# Execute the migration
psql -d your_database -f docs/database-migrations/add-language-support-to-videos.sql
```

### **Step 2: Update Existing Videos**

Set default language for existing videos:

```sql
UPDATE videos 
SET language_code = 'en', language_name = 'English'
WHERE language_code IS NULL;
```

### **Step 3: Add Language Configuration**

The language configuration is already set up in `src/data/languages.js`. You can modify supported languages as needed.

### **Step 4: Update Video Upload Process**

When uploading new videos, include language information:

```javascript
const newVideo = {
  title: 'HIV Testing Guide',
  description: 'Complete guide to HIV testing',
  video_url: 'https://example.com/video.mp4',
  language_code: 'sw',
  language_name: 'Swahili',
  is_translated: false,
  subtitle_url: 'https://example.com/subtitles.vtt',
  audio_track_url: null
};
```

### **Step 5: Test the Feature**

1. Navigate to the Videos page
2. Use the language filter dropdown
3. Select multiple languages
4. Verify videos are filtered correctly
5. Check language badges and indicators

## Usage Examples

### **Basic Language Filtering**

```jsx
import { useState } from 'react';
import { getVideos } from '@/services/videoApi';

const VideoList = () => {
  const [selectedLanguages, setSelectedLanguages] = useState(['en']);
  const [videos, setVideos] = useState([]);

  const loadVideos = async () => {
    const videoData = await getVideos({
      languages: selectedLanguages,
      limit: 20
    });
    setVideos(videoData);
  };

  return (
    <div>
      <LanguageFilter
        selectedLanguages={selectedLanguages}
        onLanguageChange={setSelectedLanguages}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};
```

### **Advanced Search with Language Filtering**

```jsx
import { searchVideos } from '@/services/videoApi';

const AdvancedSearch = () => {
  const [searchResults, setSearchResults] = useState([]);

  const performSearch = async (searchTerm, languages) => {
    const results = await searchVideos({
      query: searchTerm,
      languages: languages,
      categories: ['Education', 'Prevention'],
      duration: { min: 60, max: 600 }, // 1-10 minutes
      limit: 15
    });
    setSearchResults(results);
  };

  return (
    <div>
      {/* Search interface */}
      {searchResults.map(video => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};
```

## Best Practices

### **1. Language Selection**
- Always provide a default language (English)
- Allow users to select multiple languages
- Remember user's language preferences
- Provide clear language indicators

### **2. Performance**
- Use database indexes for language filtering
- Implement pagination for large video collections
- Cache frequently accessed language data
- Optimize API queries with proper filtering

### **3. User Experience**
- Show language badges prominently
- Provide translation status indicators
- Include subtitle/audio track availability
- Make language switching intuitive

### **4. Content Management**
- Tag videos with appropriate languages
- Create translations for important content
- Provide subtitles for better accessibility
- Maintain consistent language codes

## Troubleshooting

### **Common Issues**

#### **1. Videos Not Filtering by Language**
- Check that `language_code` is set in the database
- Verify the language codes match supported languages
- Ensure the API query includes language filtering

#### **2. Language Filter Not Working**
- Check component props and state
- Verify language codes are being passed correctly
- Test with different language combinations

#### **3. Performance Issues**
- Add database indexes for language columns
- Implement pagination for large datasets
- Optimize API queries with proper filtering

### **Debug Commands**

```javascript
// Check available languages
const languages = await getAvailableLanguages();
console.log('Available languages:', languages);

// Test language filtering
const videos = await getVideos({ languages: ['sw'] });
console.log('Swahili videos:', videos);

// Verify video language data
const video = await getVideoById('video-id');
console.log('Video language info:', {
  language_code: video.language_code,
  language_name: video.language_name,
  is_translated: video.is_translated,
  translations: video.translations
});
```

## Future Enhancements

### **Planned Features**
- **Automatic language detection**: Detect user's preferred language
- **Language learning preferences**: Remember user's language choices
- **Translation requests**: Allow users to request video translations
- **Community translations**: Enable community-contributed translations
- **Voice-over support**: Multiple audio tracks for different languages

### **Technical Improvements**
- **Real-time language switching**: Switch languages without page reload
- **Offline language support**: Cache videos in preferred languages
- **Advanced search**: Search within specific languages
- **Analytics**: Track language usage and preferences

## Support

For technical support or questions about the multilingual video filtering feature:

1. Check the troubleshooting section above
2. Review the API documentation
3. Test with the provided examples
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
