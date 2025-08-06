# 🔧 Environment Variables Template

## 📋 Frontend Team Environment Setup

Create a `.env` file in your frontend project root with these variables:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# API Endpoints (Optional - SDK will use base URL)
REACT_APP_SEND_CODE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/send-code
REACT_APP_VERIFY_CODE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/verify-code
REACT_APP_COMPLETE_PROFILE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/complete-profile

# Test Configuration (Optional)
REACT_APP_TEST_PHONE_NUMBER=+1234567890
```

## 🔑 How to Get Your Values

### 1. Supabase URL
- Go to your Supabase dashboard
- Project Settings → API
- Copy the "Project URL"

### 2. Supabase Anon Key
- Go to your Supabase dashboard
- Project Settings → API
- Copy the "anon public" key

### 3. Test Phone Number
- Use your actual phone number for testing
- Must be in international format (+country code + number)

## ⚠️ Important Security Notes

### ✅ Safe to Include in Frontend:
- `SUPABASE_URL` - Public project URL
- `SUPABASE_ANON_KEY` - Designed for client-side use

### ❌ Never Include in Frontend:
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only
- API keys for WhatsApp services
- Database passwords
- Any secret tokens

## 📱 Framework-Specific Examples

### React (.env)
```env
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### Next.js (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Vue.js (.env)
```env
VUE_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VUE_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### Angular (environment.ts)
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseAnonKey: 'your_anon_key_here'
};
```

## 🚀 Quick Setup

1. **Copy this template**
2. **Replace placeholders with actual values**
3. **Add to your `.env` file**
4. **Add `.env` to your `.gitignore`**
5. **Restart your development server**

## 🔒 .gitignore Entry

Make sure your `.gitignore` includes:
```
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

Your environment is now secure and ready for development! 🎯