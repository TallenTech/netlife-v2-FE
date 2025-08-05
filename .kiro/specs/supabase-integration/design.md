# Supabase Client Integration Design

## Overview

This design outlines the integration of the Supabase client library into the NetLife React application. The integration will establish a connection to the existing WhatsApp authentication backend and prepare the foundation for replacing localStorage-based authentication with proper backend authentication.

## Architecture

### High-Level Architecture
```
Frontend Application
├── Environment Configuration (.env.local)
├── Supabase Client (src/lib/supabase.js)
├── Authentication Context (src/contexts/AuthContext.jsx)
└── Components (WhatsAppAuth, etc.)
```

### Integration Flow
1. **Environment Setup** → Configure Supabase credentials
2. **Client Installation** → Install @supabase/supabase-js package
3. **Client Configuration** → Create centralized Supabase client instance
4. **Context Preparation** → Prepare AuthContext for backend integration

## Components and Interfaces

### 1. Environment Configuration
**File:** `.env.local`
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://rpmqpxtryrlsdsijwipm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Purpose:** Store Supabase project credentials securely
**Security:** File should be added to .gitignore to prevent credential exposure

### 2. Supabase Client Library
**File:** `src/lib/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

**Purpose:** Centralized Supabase client configuration
**Features:** 
- Auto token refresh for session management
- Session persistence across browser sessions
- URL-based session detection for OAuth flows

### 3. Package Dependencies
**Addition to package.json:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.53.0"
  }
}
```

**Installation Command:** `npm install @supabase/supabase-js`

### 4. Authentication Context Integration Points
**File:** `src/contexts/AuthContext.jsx`

**Current State Analysis:**
- Uses localStorage for session management
- Has login/logout methods
- Manages user state and authentication status

**Integration Points:**
- Replace localStorage with Supabase session management
- Update login method to use WhatsApp authentication API
- Add proper error handling for API calls
- Maintain existing interface for components

## Data Models

### Environment Variables Schema
```typescript
interface EnvironmentConfig {
  VITE_SUPABASE_URL: string;          // Supabase project URL
  VITE_SUPABASE_ANON_KEY: string;     // Supabase anonymous key
}
```

### Supabase Client Configuration
```typescript
interface SupabaseConfig {
  url: string;
  key: string;
  options: {
    auth: {
      autoRefreshToken: boolean;
      persistSession: boolean;
      detectSessionInUrl: boolean;
    }
  }
}
```

### Authentication State Model
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
}

interface User {
  id: string;
  phone: string;
  profile?: UserProfile;
}
```

## Error Handling

### Environment Variable Validation
```javascript
// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}
```

### Client Initialization Error Handling
- Validate environment variables before client creation
- Provide clear error messages for missing configuration
- Handle network connectivity issues gracefully

### Authentication Error Scenarios
- Invalid credentials
- Network connectivity issues
- Session expiration
- Rate limiting from backend

## Testing Strategy

### Unit Testing
- Test Supabase client initialization
- Validate environment variable handling
- Mock Supabase client for component testing

### Integration Testing
- Test client connection to Supabase backend
- Verify authentication flow with real API endpoints
- Test error handling scenarios

### Manual Testing Steps
1. Verify environment variables are loaded correctly
2. Test Supabase client initialization
3. Confirm client can communicate with backend
4. Validate error handling for missing configuration

## Implementation Phases

### Phase 1: Environment Setup
1. Create `.env.local` file with Supabase credentials
2. Add environment file to `.gitignore`
3. Verify Vite can access environment variables

### Phase 2: Package Installation
1. Install `@supabase/supabase-js` package
2. Verify installation in package.json
3. Test import functionality

### Phase 3: Client Configuration
1. Create `src/lib/supabase.js` file
2. Configure Supabase client with environment variables
3. Add proper error handling and validation
4. Export client for application use

### Phase 4: Integration Preparation
1. Review current AuthContext implementation
2. Identify integration points for Supabase client
3. Plan authentication flow updates
4. Prepare for next phase of implementation

## Security Considerations

### Environment Variable Security
- Use VITE_ prefix for client-side environment variables
- Add .env.local to .gitignore
- Never commit sensitive credentials to version control
- Use different keys for development/production environments

### Client Configuration Security
- Use anon key for client-side operations
- Implement Row Level Security (RLS) on backend
- Validate all client inputs before API calls
- Handle authentication tokens securely

### Network Security
- All API calls use HTTPS
- Implement proper error handling to avoid information leakage
- Use secure session management
- Implement proper logout functionality

## Performance Considerations

### Client Initialization
- Initialize client once and reuse across application
- Use lazy loading for client if needed
- Minimize bundle size impact

### Session Management
- Leverage Supabase's built-in session persistence
- Implement proper session refresh logic
- Handle offline scenarios gracefully

## Migration Strategy

### Gradual Integration Approach
1. **Phase 1:** Set up Supabase client alongside existing localStorage system
2. **Phase 2:** Update authentication flow to use backend API
3. **Phase 3:** Replace localStorage with Supabase session management
4. **Phase 4:** Remove old authentication code

### Rollback Plan
- Keep existing localStorage authentication as fallback
- Use feature flags to control integration rollout
- Maintain backward compatibility during transition
- Have clear rollback procedures documented