# Uganda Language Metadata Reference Guide

## Overview
This document provides comprehensive language metadata for uploading videos to the NetLife platform, specifically tailored for the Uganda market and surrounding regions.

## Language Categories

### 1. Official Languages (Priority 1)
These are the primary languages for government and national communication.

| Language Code | Language Name | Native Name | Region | Speakers | Flag |
|---------------|---------------|-------------|---------|----------|------|
| `en` | English | English | Official | Widely spoken | 🇺🇸 |
| `sw` | Swahili | Kiswahili | Official | National language | 🇹🇿 |

### 2. Major Ugandan Languages (Priority 2)
These are the most widely spoken indigenous languages in Uganda.

#### Bantu Languages
| Language Code | Language Name | Native Name | Region | Speakers | Flag |
|---------------|---------------|-------------|---------|----------|------|
| `lg` | Luganda | Luganda | Central Uganda | ~7 million | 🇺🇬 |
| `xog` | Lusoga | Lusoga | Eastern Uganda | ~2.5 million | 🇺🇬 |
| `rn` | Runyankole | Runyankole | Western Uganda | ~2.3 million | 🇺🇬 |
| `rng` | Rukiga | Rukiga | Southwestern Uganda | ~1.5 million | 🇺🇬 |
| `lng` | Lango | Lango | Central Northern Uganda | ~1.5 million | 🇺🇬 |
| `ach` | Acholi | Acholi | Northern Uganda | ~1.2 million | 🇺🇬 |
| `lgg` | Lugbara | Lugbara | Northwestern Uganda | ~1.2 million | 🇺🇬 |
| `teo` | Ateso | Ateso | Eastern Uganda | ~1.9 million | 🇺🇬 |
| `rny` | Runyoro | Runyoro | Western Uganda | ~700,000 | 🇺🇬 |
| `alz` | Alur | Alur | Northwestern Uganda | ~800,000 | 🇺🇬 |

### 3. Regional Languages (Priority 3)
Languages spoken in border regions and neighboring countries.

| Language Code | Language Name | Native Name | Region | Speakers | Flag |
|---------------|---------------|-------------|---------|----------|------|
| `rw` | Kinyarwanda | Kinyarwanda | Rwanda/Southwestern Uganda | ~300,000 in Uganda | 🇷🇼 |
| `kln` | Kalenjin | Kalenjin | Eastern Uganda/Kenya | ~500,000 in Uganda | 🇰🇪 |
| `mas` | Maasai | Maa | Eastern Uganda/Kenya | ~300,000 in Uganda | 🇰🇪 |
| `toi` | Tonga | Chitonga | Southwestern Uganda | ~100,000 | 🇿🇲 |
| `rn_Bi` | Kirundi | Kirundi | Burundi/Southwestern Uganda | ~50,000 in Uganda | 🇧🇮 |
| `ar` | Arabic | العربية | Sudan/Northern Uganda | ~100,000 in Uganda | 🇸🇩 |

### 4. International Languages (Priority 4)
For broader regional reach and international content.

| Language Code | Language Name | Native Name | Region | Speakers | Flag |
|---------------|---------------|-------------|---------|----------|------|
| `fr` | French | Français | International | Regional language | 🇫🇷 |
| `pt` | Portuguese | Português | International | Regional language | 🇵🇹 |

## Usage Guidelines

### When Uploading Videos

1. **Primary Language**: Always set the primary language of the video content
2. **Target Audience**: Consider the main region where the video will be most relevant
3. **Speaker Population**: Prioritize languages with larger speaker populations for broader reach
4. **Regional Relevance**: Match language to the geographic region where the content is most applicable

### Recommended Language Selection by Content Type

#### HIV/AIDS Education Content
- **Primary**: English (`en`) - for medical accuracy and broad accessibility
- **Secondary**: Luganda (`lg`) - for Central Uganda
- **Tertiary**: Swahili (`sw`) - for national reach

#### Community Health Outreach
- **Northern Uganda**: Acholi (`ach`), Lango (`lng`)
- **Eastern Uganda**: Ateso (`teo`), Lusoga (`xog`)
- **Western Uganda**: Runyankole (`rn`), Runyoro (`rny`)
- **Southwestern Uganda**: Rukiga (`rng`)

#### Regional Health Programs
- **Border Regions**: Include neighboring country languages (Kinyarwanda, Kalenjin)
- **Cross-border Initiatives**: Swahili for regional communication

### Metadata Fields for Video Upload

When uploading videos, include these metadata fields:

```json
{
  "language_code": "lg",
  "language_name": "Luganda",
  "region": "Central Uganda",
  "speaker_population": "~7 million",
  "content_type": "HIV Education",
  "target_audience": "Local Community",
  "translation_available": true,
  "subtitle_url": "optional_subtitle_file_url",
  "audio_track_url": "optional_audio_track_url"
}
```

### Language Code Standards

- Use ISO 639-1 codes where available (e.g., `en`, `fr`, `ar`)
- Use ISO 639-3 codes for specific languages (e.g., `lg`, `ach`, `teo`)
- For regional variants, use underscore notation (e.g., `rn_Bi` for Kirundi)

### Content Localization Best Practices

1. **Cultural Sensitivity**: Ensure content is culturally appropriate for each language group
2. **Local Terminology**: Use region-specific health terminology
3. **Visual Elements**: Include culturally relevant imagery and symbols
4. **Narrator Selection**: Use native speakers for authentic pronunciation
5. **Subtitle Quality**: Provide accurate, culturally appropriate subtitles

### Regional Distribution Strategy

#### High Priority Regions (Major Languages)
- **Central Uganda**: Luganda content for maximum reach
- **Eastern Uganda**: Lusoga and Ateso content
- **Western Uganda**: Runyankole and Runyoro content
- **Northern Uganda**: Acholi and Lango content

#### Medium Priority Regions
- **Southwestern Uganda**: Rukiga content
- **Northwestern Uganda**: Lugbara and Alur content

#### Specialized Content
- **Border Regions**: Neighboring country languages
- **International Programs**: English and French content

## Quality Assurance

### Language Validation
- Verify language codes match ISO standards
- Confirm native names are correctly spelled
- Validate region assignments
- Check speaker population estimates

### Content Review
- Ensure cultural appropriateness
- Verify medical terminology accuracy
- Confirm pronunciation quality
- Validate subtitle synchronization

## Technical Implementation

### Database Schema
```sql
-- Example video metadata structure
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  language_code VARCHAR(10),
  language_name VARCHAR(100),
  region VARCHAR(100),
  speaker_population VARCHAR(50),
  is_translated BOOLEAN DEFAULT FALSE,
  subtitle_url VARCHAR(255),
  audio_track_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints
- `GET /api/languages` - List all supported languages
- `GET /api/languages/{code}` - Get specific language details
- `GET /api/videos/by-language/{code}` - Get videos by language
- `POST /api/videos` - Upload video with language metadata

This comprehensive language metadata system ensures that NetLife's video content reaches the right audiences in Uganda and the surrounding region with appropriate cultural and linguistic considerations.
