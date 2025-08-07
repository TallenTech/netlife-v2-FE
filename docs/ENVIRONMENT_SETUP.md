# Environment Setup

## 🔐 Setting up Environment Variables

### 1. Copy the example file
```bash
cp .env.example .env
```

### 2. Get your Supabase credentials
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your NetLife project
4. Go to **Settings** → **API**
5. Copy the **Project URL** and **anon/public** key

### 3. Update your .env file
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
```

### 4. Restart your development server
```bash
npm run dev
```

## ⚠️ Security Notes

- **NEVER** commit your `.env` file to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Only commit `.env.example` with placeholder values
- Each developer should have their own `.env` file with their own credentials

## 🧪 Testing Your Setup

After setting up your environment variables, you can test the connection:

1. Open your browser console
2. Run: `window.testSupabaseConnection()`
3. You should see successful connection messages

If you see "Supabase not configured" errors, double-check your environment variables and restart your dev server.