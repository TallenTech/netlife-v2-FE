# 🚀 Frontend Integration Guide - WhatsApp Authentication

## 📋 Overview
This guide provides everything your frontend team needs to integrate WhatsApp-based authentication using our Edge Functions.

## 🔗 API Endpoints

### Base URL
```
https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1
```

### Authentication Header
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc'
};
```

---

## 🔄 Authentication Flow

### Step 1: Phone Number Input & OTP Request

```javascript
// Send OTP to user's WhatsApp
async function sendOTP(phoneNumber) {
  try {
    const response = await fetch('https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc'
      },
      body: JSON.stringify({
        phone: phoneNumber // Must be in international format: +256758361967
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // OTP sent successfully
      console.log('OTP sent to WhatsApp');
      // In development, result.code contains the OTP for testing
      return { success: true, message: result.message };
    } else {
      // Handle errors
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error occurred' };
  }
}
```

### Step 2: OTP Verification & User Creation

```javascript
// Verify OTP and create user profile
async function verifyOTP(phoneNumber, otpCode) {
  try {
    const response = await fetch('https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc'
      },
      body: JSON.stringify({
        phone: phoneNumber,
        code: otpCode
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // User authenticated successfully
      // Profile automatically created with WhatsApp number
      const user = result.user;
      
      // Store user session (implement your session management)
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_phone', user.phone);
      
      return { 
        success: true, 
        user: user,
        message: result.message 
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error occurred' };
  }
}
```

### Step 3: Profile Completion (Optional)

```javascript
// Complete user profile with additional information
async function completeProfile(profileData, userJWT) {
  try {
    const response = await fetch('https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/complete-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userJWT}` // Use actual user JWT token
      },
      body: JSON.stringify({
        username: profileData.username,
        full_name: profileData.fullName,
        date_of_birth: profileData.dateOfBirth, // YYYY-MM-DD format
        gender: profileData.gender, // 'male', 'female', 'other', 'prefer_not_to_say'
        district: profileData.district,
        sub_county: profileData.subCounty, // optional
        preferred_language: profileData.language || 'en'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return { 
        success: true, 
        profile: result.profile,
        message: result.message 
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error occurred' };
  }
}
```

---

## 🎨 React Implementation Example

### Phone Number Input Component

```jsx
import React, { useState } from 'react';

const PhoneNumberInput = ({ onOTPSent }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter phone number in international format (+256758361967)');
      setLoading(false);
      return;
    }

    const result = await sendOTP(phoneNumber);
    
    if (result.success) {
      onOTPSent(phoneNumber);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSendOTP} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+256758361967"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send WhatsApp Code'}
      </button>
    </form>
  );
};
```

### OTP Verification Component

```jsx
import React, { useState } from 'react';

const OTPVerification = ({ phoneNumber, onVerified }) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      setLoading(false);
      return;
    }

    const result = await verifyOTP(phoneNumber, otpCode);
    
    if (result.success) {
      onVerified(result.user);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleVerifyOTP} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Enter 6-digit code from WhatsApp
        </label>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest"
          maxLength={6}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Code sent to {phoneNumber}
        </p>
      </div>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </button>
    </form>
  );
};
```

### Profile Completion Component

```jsx
import React, { useState, useEffect } from 'react';

const ProfileCompletion = ({ user, onCompleted }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    district: '',
    subCounty: '',
    language: 'en'
  });
  const [districts, setDistricts] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load districts on component mount
  useEffect(() => {
    loadDistricts();
  }, []);

  // Load sub counties when district changes
  useEffect(() => {
    if (formData.district) {
      loadSubCounties(formData.district);
    }
  }, [formData.district]);

  const loadDistricts = async () => {
    try {
      const response = await fetch('https://rpmqpxtryrlsdsijwipm.supabase.co/rest/v1/districts?select=*', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc'
        }
      });
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadSubCounties = async (districtName) => {
    try {
      // Find district ID by name
      const district = districts.find(d => d.name === districtName);
      if (!district) return;

      const response = await fetch(`https://rpmqpxtryrlsdsijwipm.supabase.co/rest/v1/sub_counties?select=*&district_id=eq.${district.id}`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc'
        }
      });
      const data = await response.json();
      setSubCounties(data);
    } catch (error) {
      console.error('Failed to load sub counties:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Note: You'll need to implement proper JWT token management
    // For now, this will fail without a proper user JWT token
    const userJWT = 'user-jwt-token-here'; // Get from your auth system
    
    const result = await completeProfile(formData, userJWT);
    
    if (result.success) {
      onCompleted(result.profile);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Complete Your Profile</h2>
        <p className="text-gray-600">WhatsApp: {user.phone}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          placeholder="johndoe123"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          placeholder="John Doe"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Gender</label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({...formData, gender: e.target.value})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">District</label>
        <select
          value={formData.district}
          onChange={(e) => setFormData({...formData, district: e.target.value, subCounty: ''})}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select District</option>
          {districts.map(district => (
            <option key={district.id} value={district.name}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {subCounties.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Sub County (Optional)</label>
          <select
            value={formData.subCounty}
            onChange={(e) => setFormData({...formData, subCounty: e.target.value})}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Sub County</option>
            {subCounties.map(subCounty => (
              <option key={subCounty.id} value={subCounty.name}>
                {subCounty.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Complete Profile'}
      </button>
    </form>
  );
};
```

---

## 📱 Complete Authentication Flow Component

```jsx
import React, { useState } from 'react';

const WhatsAppAuth = () => {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'profile', 'complete'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState(null);

  const handleOTPSent = (phone) => {
    setPhoneNumber(phone);
    setStep('otp');
  };

  const handleVerified = (userData) => {
    setUser(userData);
    setStep('profile');
  };

  const handleProfileCompleted = (profile) => {
    setStep('complete');
    // Redirect to main app or dashboard
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      {step === 'phone' && (
        <PhoneNumberInput onOTPSent={handleOTPSent} />
      )}
      
      {step === 'otp' && (
        <OTPVerification 
          phoneNumber={phoneNumber} 
          onVerified={handleVerified} 
        />
      )}
      
      {step === 'profile' && (
        <ProfileCompletion 
          user={user} 
          onCompleted={handleProfileCompleted} 
        />
      )}
      
      {step === 'complete' && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600">Welcome!</h2>
          <p>Your profile has been created successfully.</p>
        </div>
      )}
    </div>
  );
};

export default WhatsAppAuth;
```

---

## 🔧 Environment Configuration

Create a `.env` file in your frontend project:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://rpmqpxtryrlsdsijwipm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc

# API Endpoints
REACT_APP_SEND_CODE_URL=https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/send-code
REACT_APP_VERIFY_CODE_URL=https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/verify-code
REACT_APP_COMPLETE_PROFILE_URL=https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/complete-profile
```

---

## ⚠️ Important Notes

### 1. **JWT Token Management**
- The `complete-profile` endpoint requires a proper user JWT token
- You'll need to implement proper session management
- Consider using Supabase client library for better token handling

### 2. **Phone Number Format**
- Always use international format: `+256758361967`
- Validate format before sending to API
- Show clear format examples to users

### 3. **Error Handling**
- Implement proper error states for all API calls
- Show user-friendly error messages
- Handle network errors gracefully

### 4. **WhatsApp Number Auto-Population**
- The `whatsapp_number` field is automatically populated during OTP verification
- Users don't need to enter their phone number again
- This field is read-only in the profile

### 5. **Rate Limiting**
- API has built-in rate limiting (3 requests per 5 minutes per phone)
- Handle rate limit errors appropriately
- Show countdown timers when rate limited

---

## 🧪 Testing

### Test Phone Number
Use `+256758361967` for testing (configured in development mode)

### Development Mode
- OTP codes are returned in the API response for testing
- Production mode will only send codes via WhatsApp

### Postman Collection
Import the provided Postman collection for API testing:
- `WhatsApp_Auth_API_Collection.postman_collection.json`
- `WhatsApp_Auth_Environment.postman_environment.json`

---

## 🎯 Key Features

✅ **WhatsApp OTP Authentication**  
✅ **Automatic Profile Creation**  
✅ **WhatsApp Number Auto-Population**  
✅ **Profile Completion with Validation**  
✅ **District/Sub-County Dropdowns**  
✅ **Comprehensive Error Handling**  
✅ **Rate Limiting Protection**  

Your WhatsApp authentication system is ready for frontend integration! 🚀

## 📞 Support

If you need help with integration, refer to:
- API Documentation: `API_DOCUMENTATION.md`
- Postman Collection for testing
- This integration guide

Happy coding! 🎉