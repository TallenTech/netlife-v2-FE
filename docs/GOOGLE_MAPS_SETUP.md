# 🗺️ Google Maps API Setup Guide

## Overview

The Interactive Map Feature requires a Google Maps API key to function properly. This guide will help you set up the necessary API key and enable the required services.

## Prerequisites

1. **Google Cloud Console Account**: You need a Google Cloud account
2. **Billing Enabled**: Google Maps API requires billing to be enabled (you get $200 free credit monthly)
3. **Project Access**: Ability to create or access a Google Cloud project

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "NetLife Maps")
4. Click "Create"

### 2. Enable Required APIs

In your Google Cloud project, enable these APIs:

1. **Maps JavaScript API**
   - Go to "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"

2. **Places API**
   - Search for "Places API"
   - Click "Enable"

3. **Geocoding API**
   - Search for "Geocoding API"
   - Click "Enable"

### 3. Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 4. Restrict API Key (Recommended)

For security, restrict your API key:

1. Click on the created API key
2. Under "Application restrictions", select "HTTP referrers (web sites)"
3. Add your domain(s):
   - `localhost:5173/*` (for development)
   - `yourdomain.com/*` (for production)
4. Under "API restrictions", select "Restrict key"
5. Select the three APIs you enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API
6. Click "Save"

### 5. Configure Environment Variables

Create or update your `.env` file in the project root:

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important**: Replace `your_actual_api_key_here` with the API key you created.

### 6. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Testing the Setup

1. Navigate to the Services page
2. Select any service (e.g., HIV Self-Test)
3. Choose "Home/Workplace" or "Community Group" delivery method
4. You should see the enhanced location selection with:
   - Address search with autocomplete
   - "Current Location" button
   - "Show Map" button for interactive map

## Troubleshooting

### API Key Not Working

1. **Check Environment Variable**: Ensure `VITE_GOOGLE_MAPS_API_KEY` is set correctly
2. **Verify API Key**: Make sure the key starts with "AIza"
3. **Check Restrictions**: Ensure your domain is allowed in API key restrictions
4. **Enable Billing**: Verify billing is enabled in Google Cloud Console

### APIs Not Enabled

If you see errors about APIs not being enabled:

1. Go to Google Cloud Console → APIs & Services → Library
2. Search for and enable:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### Billing Issues

If you see billing-related errors:

1. Go to Google Cloud Console → Billing
2. Link a billing account to your project
3. Note: You get $200 free credit monthly, which is usually sufficient for development

## Cost Considerations

- **Free Tier**: $200 monthly credit
- **Maps JavaScript API**: $7 per 1,000 map loads
- **Places API**: $17 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

For typical usage, the free tier should be sufficient.

## Security Best Practices

1. **Restrict API Key**: Always restrict your API key to specific domains
2. **Monitor Usage**: Regularly check your Google Cloud Console for usage
3. **Rotate Keys**: Consider rotating API keys periodically
4. **Environment Variables**: Never commit API keys to version control

## Production Deployment

For production deployment:

1. Update API key restrictions to include your production domain
2. Set the environment variable in your hosting platform
3. Test the map functionality in production
4. Monitor API usage and costs

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all APIs are enabled in Google Cloud Console
3. Ensure billing is properly configured
4. Check API key restrictions match your domain

---

**Note**: This setup is required for the Interactive Map Feature to work. Without a valid API key, the map functionality will show an error message and fall back to basic location input.
