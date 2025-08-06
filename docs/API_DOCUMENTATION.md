# 📡 WhatsApp Authentication API Documentation

## 🚀 Base URL
```
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1
```

## 🔑 Authentication
All requests require the Supabase Anon Key in the Authorization header:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

## 📱 1. Send OTP Code

**Endpoint:** `POST /send-code`

**Description:** Send OTP code to user's WhatsApp number

### Request
```json
{
    "phone": "+1234567890"
}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

### Response (Success - 200)
```json
{
    "success": true,
    "message": "OTP code sent successfully via WhatsApp",
    "code": "123456"  // Only in development mode
}
```

### Response (Error - 400)
```json
{
    "success": false,
    "error": "Phone number must be in international format (+country code followed by 7-15 digits)"
}
```

### Response (Rate Limited - 429)
```json
{
    "success": false,
    "error": "An OTP code is already active for this phone number. Please wait before requesting a new one."
}
```

---

## 🔐 2. Verify OTP Code

**Endpoint:** `POST /verify-code`

**Description:** Verify OTP code and create/update user profile with WhatsApp number

### Request
```json
{
    "phone": "+1234567890",
    "code": "123456"
}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

### Response (Success - 200)
```json
{
    "success": true,
    "message": "OTP code verified successfully",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "1234567890@temp.netlife.com",
        "phone": "+1234567890",
        "user_metadata": {
            "phone": "+1234567890",
            "verified_phone": true
        }
    },
    "session": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_in": 3600,
        "token_type": "bearer",
        "user": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "1234567890@temp.netlife.com",
            "phone": "+1234567890"
        }
    },
    "profile": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "whatsapp_number": "+1234567890",
        "created_at": "2025-02-03T10:00:00.000Z",
        "updated_at": "2025-02-03T10:00:00.000Z"
    }
}
```

### Response (Error - 401)
```json
{
    "success": false,
    "error": "Invalid OTP code. Please check and try again."
}
```

### Response (Expired - 401)
```json
{
    "success": false,
    "error": "OTP code has expired. Please request a new code."
}
```

---

## 👤 3. Complete User Profile

**Endpoint:** `POST /complete-profile`

**Description:** Complete user profile with additional information

### Request
```json
{
    "username": "johndoe123",
    "full_name": "John Doe",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "district": "Your District",
    "sub_county": "Your Sub County",
    "profile_picture": "https://example.com/avatar.jpg"
}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer USER_JWT_TOKEN  // User's JWT token from verify-code
```

### Field Validation Rules
- **username**: 3-30 characters, alphanumeric + underscore/hyphen, unique
- **full_name**: Required, minimum 2 characters
- **date_of_birth**: YYYY-MM-DD format, not in future, reasonable age
- **gender**: "male", "female", "other", "prefer_not_to_say"
- **district**: Any text (should match districts table)
- **sub_county**: Any text (optional)
- **profile_picture**: URL or avatar identifier (optional)

### Response (Success - 200)
```json
{
    "success": true,
    "message": "Profile completed successfully",
    "profile": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "whatsapp_number": "+1234567890",
        "username": "johndoe123",
        "full_name": "John Doe",
        "date_of_birth": "1990-05-15",
        "gender": "male",
        "district": "Your District",
        "sub_county": "Your Sub County",
        "profile_picture": "https://example.com/avatar.jpg",
        "created_at": "2025-02-03T10:00:00.000Z",
        "updated_at": "2025-02-03T10:05:00.000Z"
    }
}
```

### Response (Error - 400)
```json
{
    "success": false,
    "error": "Username must be 3-30 characters long and contain only letters, numbers, underscore, or hyphen"
}
```

### Response (Unauthorized - 401)
```json
{
    "success": false,
    "error": "Invalid or expired session"
}
```

---

## 📍 4. Get Districts (Reference Data)

**Endpoint:** `GET /rest/v1/districts?select=*`

**Description:** Get list of available districts for profile completion

### Headers
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
apikey: YOUR_SUPABASE_ANON_KEY
```

### Response (Success - 200)
```json
[
    {
        "id": 1,
        "name": "District 1",
        "region": "Region 1",
        "created_at": "2025-02-03T10:00:00.000Z"
    },
    {
        "id": 2,
        "name": "District 2",
        "region": "Region 2",
        "created_at": "2025-02-03T10:00:00.000Z"
    }
]
```

---

## 🏘️ 5. Get Sub Counties by District

**Endpoint:** `GET /rest/v1/sub_counties?select=*&district_id=eq.{district_id}`

**Description:** Get sub counties for a specific district

### Headers
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
apikey: YOUR_SUPABASE_ANON_KEY
```

### Query Parameters
- `district_id`: Filter by district ID (e.g., `eq.1` for District 1)

### Response (Success - 200)
```json
[
    {
        "id": 1,
        "name": "Sub County 1",
        "district_id": 1,
        "created_at": "2025-02-03T10:00:00.000Z"
    },
    {
        "id": 2,
        "name": "Sub County 2",
        "district_id": 1,
        "created_at": "2025-02-03T10:00:00.000Z"
    }
]
```

---

## 🔄 Complete Authentication Flow

### Step 1: Send OTP
```bash
curl -X POST https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/send-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"phone": "+1234567890"}'
```

### Step 2: Verify OTP
```bash
curl -X POST https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/verify-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

### Step 3: Complete Profile
```bash
# Use the access_token from verify-code response
curl -X POST https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/complete-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ACCESS_TOKEN_FROM_VERIFY_CODE" \
  -d '{
    "username": "johndoe123",
    "full_name": "John Doe",
    "date_of_birth": "1990-05-15",
    "gender": "male",
    "district": "Your District",
    "sub_county": "Your Sub County",
    "profile_picture": "https://example.com/avatar.jpg"
  }'
```

---

## 🚨 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/expired token) |
| 404 | Not Found (OTP not found) |
| 405 | Method Not Allowed |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🧪 Testing

### Environment Variables Needed
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `TEST_PHONE_NUMBER`: Your test phone number
- `USER_JWT_TOKEN`: User's JWT (from verify-code response)

---

## 🎯 Key Features

✅ **WhatsApp OTP Authentication**  
✅ **Automatic Profile Creation**  
✅ **WhatsApp Number Auto-Population**  
✅ **Profile Completion with Validation**  
✅ **District/Sub-County Reference Data**  
✅ **Comprehensive Error Handling**  
✅ **Rate Limiting Protection**  

Your API is ready for production! 🚀