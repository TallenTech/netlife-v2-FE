# 🏥 Dynamic Health Interests System (Simplified)

## 📋 Overview

The Health Interests System is a simplified, dynamic solution that allows users to select and manage their health-related interests. The system focuses on public users with a clean, category-based approach.

## 🏗️ Architecture

### Database Structure

#### 1. **profiles Table Enhancement**
```sql
-- Added to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN health_interests TEXT[] DEFAULT '{}';
```

#### 2. **health_interests_categories Table**
```sql
CREATE TABLE public.health_interests_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **user_health_interests Table**
```sql
CREATE TABLE public.user_health_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.health_interests_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);
```

## 🔧 Setup Instructions

### 1. Database Setup
Run the SQL script in `health-interests-database-setup.sql` in your Supabase SQL Editor.

### 2. Default Categories
The system comes with 9 default health interest categories:
- HIV Prevention
- PrEP & PEP
- Living with HIV
- Mental Wellness
- Sexual Health
- Nutrition
- Fitness
- Relationships
- STI Awareness

### 3. File Structure
```
src/
├── services/
│   └── healthInterestsService.js     # API service layer
├── hooks/
│   └── useHealthInterests.js         # React hooks for data management
├── pages/
│   └── HealthInterests.jsx           # User-facing interests page
└── components/layout/
    └── MainLayout.jsx                # Updated with routes
```

## 🎯 Features

### User Features
- ✅ **Dynamic Interest Selection**: Users can select from dynamically loaded interests
- ✅ **Category-Based**: Simple category selection with color coding
- ✅ **Real-time Updates**: Changes are immediately reflected in the UI
- ✅ **Persistent Storage**: Interests are saved to both database and localStorage
- ✅ **Error Handling**: Graceful error handling with retry mechanisms
- ✅ **Loading States**: Proper loading indicators throughout the interface

### Technical Features
- ✅ **Row Level Security (RLS)**: Proper security policies for data access
- ✅ **Database Functions**: Optimized database functions for data operations
- ✅ **React Query Integration**: Efficient caching and state management
- ✅ **Type Safety**: Proper error handling and data validation
- ✅ **Performance Optimized**: Indexes and efficient queries

## 🚀 Usage

### For Users

1. **Access Health Interests**
   - Navigate to Account → Health Interests
   - Or click "Health Interests" from the dashboard menu

2. **Select Interests**
   - Browse categories (color-coded)
   - Click on interests to select/deselect
   - Selected interests show a checkmark

3. **Save Changes**
   - Click "Save Interests" to persist changes
   - Changes are immediately available across the app

## 🔌 API Endpoints

### User Endpoints
- `GET /rpc/get_available_health_interests` - Get all available interests
- `GET /rpc/get_user_health_interests` - Get user's selected interests
- `POST /rpc/update_user_health_interests` - Update user's interests

## 🛡️ Security

### Row Level Security Policies

#### Categories
- **Public Read**: Anyone can read active categories

#### User Interests
- **User Access**: Users can only view/modify their own interests
- **Cascade Delete**: User interests are deleted when user account is deleted

### Data Validation
- Interest names are unique
- All inputs are validated before database operations

## 📊 Data Flow

### User Interest Selection
```
User Interface → useHealthInterests Hook → healthInterestsService → Database Functions → Supabase
```

### Data Synchronization
```
Database Changes → React Query Invalidation → UI Updates → User Sees Changes
```

## 🔄 Integration Points

### Profile System
- Health interests are stored in the `profiles.health_interests` array
- Updates trigger profile data invalidation
- Seamless integration with existing profile management

### Content Personalization
- Health interests can be used to personalize:
  - Video recommendations
  - Service suggestions
  - Content filtering
  - Notification preferences

### Analytics
- User interest data can be analyzed for:
  - Popular health topics
  - User engagement patterns
  - Content effectiveness

## 🧪 Testing

### Manual Testing Checklist
- [ ] User can select/deselect interests
- [ ] Changes persist after page refresh
- [ ] Error states are handled gracefully
- [ ] Loading states display correctly
- [ ] Mobile responsiveness works

### Database Testing
```sql
-- Test available interests
SELECT get_available_health_interests();

-- Test user interests (replace with actual user ID)
SELECT get_user_health_interests('user-uuid-here');

-- Test interest update (replace with actual user ID and interests)
SELECT update_user_health_interests('user-uuid-here', ARRAY['HIV Prevention', 'Mental Wellness']);
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **Interests Not Loading**
- Check database functions exist
- Verify RLS policies are active
- Check network connectivity

#### 2. **Changes Not Saving**
- Verify user permissions
- Check database function errors
- Ensure proper error handling

### Debug Queries
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'health_interests%';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'health_interests%';

-- Check function permissions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE 'health_interests%';
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Interest level preferences (1-5 scale)
- [ ] Interest-based content recommendations
- [ ] Interest analytics dashboard
- [ ] Interest-based notifications
- [ ] Interest sharing between profiles
- [ ] Admin interface for category management

### Technical Improvements
- [ ] GraphQL API for better performance
- [ ] Real-time updates with WebSockets
- [ ] Advanced caching strategies
- [ ] Interest-based machine learning models

## 📝 Maintenance

### Regular Tasks
- Monitor database performance
- Review and update interest categories
- Analyze user interest patterns
- Update security policies as needed

### Backup Strategy
- Regular database backups
- Export interest categories for version control
- Document schema changes

---

## ✅ Implementation Status

- [x] Database schema and functions
- [x] API service layer
- [x] React hooks for data management
- [x] User interface for interest selection
- [x] Security policies and validation
- [x] Error handling and loading states
- [x] Integration with existing profile system
- [x] Documentation and testing guide

**The Simplified Dynamic Health Interests System is fully implemented and ready for production use!** 🎉
