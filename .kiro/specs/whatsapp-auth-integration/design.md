# WhatsApp Authentication Integration Design

## Overview

This design outlines the integration of real WhatsApp authentication API calls into the existing NetLife WhatsAppAuth component. The integration will replace mock implementations with actual backend API calls while maintaining the existing user interface and experience.

## Architecture

### Current vs Target Architecture

**Current Flow:**
```
WhatsAppAuth Component → Mock setTimeout → localStorage → AuthContext
```

**Target Flow:**
```
WhatsAppAuth Component → Supabase API → Backend Response → AuthContext
```

### Integration Points

1. **Phone Number Input** → API call to send OTP
2. **OTP Verification** → API call to verify code
3. **Error Handling** → Map API errors to user messages
4. **Loading States** → Real async operation feedback

## Components and Interfaces

### 1. Updated WhatsAppAuth Component

**File:** `src/components/WhatsAppAuth.jsx`

#### Phone Number Processing
```javascript
// Clean phone number for API calls
const cleanPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure international format
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
};
```

#### OTP Sending Integration
```javascript
const handlePhoneSubmit = async () => {
  setIsLoading(true);
  
  try {
    const cleanedPhone = cleanPhoneNumber(phoneNumber);
    const result = await whatsappAuth.sendCode(cleanedPhone);
    
    if (result.success) {
      setStep('verify');
      setResendTimer(60);
      toast({
        title: "Code Sent!",
        description: result.message || `Verification code sent to ${phoneNumber}`,
      });
    } else {
      toast({
        title: "Failed to Send Code",
        description: result.error || "Please try again",
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      title: "Network Error",
      description: "Please check your connection and try again",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};
```

#### OTP Verification Integration
```javascript
const handleVerifyCode = async () => {
  setIsLoading(true);
  
  try {
    const cleanedPhone = cleanPhoneNumber(phoneNumber);
    const result = await whatsappAuth.verifyCode(cleanedPhone, verificationCode);
    
    if (result.success) {
      // Store authentication data
      localStorage.setItem('netlife_auth', JSON.stringify({
        phoneNumber: cleanedPhone,
        verified: true,
        timestamp: Date.now(),
        user: result.user
      }));
      
      onContinue(result.user, activeTab === 'login');
    } else {
      toast({
        title: "Verification Failed",
        description: result.error || "Invalid code. Please try again.",
        variant: "destructive"
      });
    }
  } catch (error) {
    toast({
      title: "Network Error",
      description: "Please check your connection and try again",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};
```

### 2. Error Handling System

#### Error Code Mapping
```javascript
const getErrorMessage = (errorCode, defaultMessage) => {
  const errorMessages = {
    'INVALID_PHONE_NUMBER': 'Please enter a valid phone number in international format (+256XXXXXXXXX)',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait before trying again.',
    'INVALID_CODE': 'The verification code is incorrect. Please check and try again.',
    'CODE_EXPIRED': 'The verification code has expired. Please request a new one.',
    'CODE_ALREADY_USED': 'This verification code has already been used.',
    'MAX_ATTEMPTS_EXCEEDED': 'Too many verification attempts. Please request a new code.',
    'WHATSAPP_API_ERROR': 'Unable to send WhatsApp message. Please try again.',
    'INTERNAL_ERROR': 'Something went wrong. Please try again later.'
  };
  
  return errorMessages[errorCode] || defaultMessage;
};
```

#### Rate Limiting Handling
```javascript
const handleRateLimit = (retryAfter) => {
  setResendTimer(retryAfter || 300); // 5 minutes default
  
  const interval = setInterval(() => {
    setResendTimer(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  toast({
    title: "Rate Limited",
    description: `Please wait ${Math.ceil(retryAfter / 60)} minutes before requesting another code.`,
    variant: "destructive"
  });
};
```

### 3. Loading State Management

#### Enhanced Loading States
```javascript
const [loadingStates, setLoadingStates] = useState({
  sendingCode: false,
  verifyingCode: false,
  resendingCode: false
});

// Update specific loading state
const setLoadingState = (key, value) => {
  setLoadingStates(prev => ({ ...prev, [key]: value }));
};
```

#### Loading UI Components
```javascript
const LoadingButton = ({ isLoading, children, ...props }) => (
  <Button {...props} disabled={isLoading || props.disabled}>
    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
    {children}
  </Button>
);
```

## Data Models

### API Request/Response Models

#### Send Code Request
```typescript
interface SendCodeRequest {
  phone: string; // "+256758361967"
}

interface SendCodeResponse {
  success: boolean;
  message?: string;
  code?: string; // Only in development
  error?: string;
}
```

#### Verify Code Request
```typescript
interface VerifyCodeRequest {
  phone: string;
  code: string; // "123456"
}

interface VerifyCodeResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    phone: string;
    user_metadata: {
      phone: string;
      verified_phone: boolean;
    };
  };
  error?: string;
}
```

### Component State Models

#### Authentication State
```typescript
interface AuthState {
  step: 'phone' | 'verify';
  phoneNumber: string;
  verificationCode: string;
  activeTab: 'join' | 'login';
  resendTimer: number;
  loadingStates: {
    sendingCode: boolean;
    verifyingCode: boolean;
    resendingCode: boolean;
  };
}
```

## Error Handling

### Network Error Handling
- Implement retry logic for network failures
- Show offline/online status indicators
- Provide manual retry options
- Cache failed requests for retry when online

### API Error Handling
- Map backend error codes to user-friendly messages
- Handle different error types appropriately
- Provide actionable error messages
- Log errors for debugging while protecting user privacy

### Validation Error Handling
- Client-side phone number validation
- Real-time format feedback
- Clear validation error messages
- Prevention of invalid API calls

## Testing Strategy

### Unit Testing
- Test phone number cleaning function
- Test error message mapping
- Test loading state management
- Mock API calls for component testing

### Integration Testing
- Test with real phone numbers
- Verify WhatsApp message delivery
- Test error scenarios (invalid codes, expired codes)
- Test rate limiting behavior

### User Acceptance Testing
- Test complete authentication flow
- Verify user experience with real devices
- Test error handling from user perspective
- Validate accessibility and usability

## Security Considerations

### Phone Number Handling
- Validate phone numbers before API calls
- Sanitize phone number input
- Don't log sensitive phone numbers
- Use secure transmission for API calls

### OTP Code Security
- Don't log OTP codes in production
- Clear OTP codes from memory after use
- Implement proper code expiration
- Prevent code reuse attacks

### Session Management
- Secure storage of authentication tokens
- Proper session timeout handling
- Secure transmission of session data
- Protection against session hijacking

## Performance Considerations

### API Call Optimization
- Implement request debouncing
- Cache reference data (districts, etc.)
- Minimize unnecessary API calls
- Implement proper loading states

### User Experience Optimization
- Fast feedback for user actions
- Smooth transitions between states
- Responsive design for all devices
- Accessible interface for all users

## Migration Strategy

### Gradual Rollout
1. **Phase 1:** Update component with real API calls
2. **Phase 2:** Test with limited user group
3. **Phase 3:** Monitor error rates and user feedback
4. **Phase 4:** Full rollout with monitoring

### Rollback Plan
- Keep mock implementation as fallback
- Feature flag for API integration
- Quick rollback procedures
- User communication plan

### Data Migration
- No existing data migration needed
- New authentication flow for all users
- Maintain backward compatibility where possible
- Clear migration path for existing users

## Monitoring and Analytics

### Error Monitoring
- Track API error rates
- Monitor authentication success rates
- Log critical errors for investigation
- Alert on unusual error patterns

### Performance Monitoring
- Track API response times
- Monitor user completion rates
- Measure authentication flow performance
- Track user experience metrics

### User Analytics
- Authentication method preferences
- Error recovery patterns
- User flow completion rates
- Device and browser compatibility