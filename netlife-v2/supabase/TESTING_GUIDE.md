# WhatsApp Authentication API Testing Guide

This guide covers testing your WhatsApp authentication endpoints using Hoppscotch and Postman.

## 📋 Prerequisites

### 1. Deploy Functions First
```bash
# Set environment variables in Supabase
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_auth_token
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
supabase secrets set ENVIRONMENT=development
supabase secrets set SITE_URL=http://localhost:3000

# Deploy the functions
supabase functions deploy send-code
supabase functions deploy verify-code
```

### 2. WhatsApp Sandbox Setup
1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** > **Try it out** > **Send a WhatsApp message**
3. Send `join <sandbox-keyword>` to `+1 415 523 8886` from your WhatsApp
4. You should receive a confirmation message

### 3. API Endpoints
- **Base URL**: `https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1`
- **send-code**: `POST /send-code`
- **verify-code**: `POST /verify-code`

---

## 🌐 Testing with Hoppscotch (https://hoppscotch.io/)

### Test 1: Send OTP Code

#### Step 1: Setup Request
1. Open [Hoppscotch](https://hoppscotch.io/)
2. Set **Method**: `POST`
3. Set **URL**: `https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/send-code`

#### Step 2: Add Headers
Click on **Headers** tab and add:
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc
```

#### Step 3: Add Request Body
Click on **Body** tab, select **JSON**, and add:
```json
{
  "phone": "+256758361967"
}
```

#### Step 4: Send Request
1. Click **Send**
2. **Expected Response** (Success):
```json
{
  "success": true,
  "message": "OTP code sent successfully via WhatsApp",
  "code": "123456"
}
```

#### Step 5: Check WhatsApp
- You should receive a WhatsApp message with the OTP code
- The message will look like: "Your NetLife verification code is: 123456"

### Test 2: Verify OTP Code

#### Step 1: Setup Request
1. Set **Method**: `POST`
2. Set **URL**: `https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1/verify-code`

#### Step 2: Add Headers (Same as above)
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc
```

#### Step 3: Add Request Body
```json
{
  "phone": "+256758361967",
  "code": "123456"
}
```
*Use the actual code you received via WhatsApp*

#### Step 4: Send Request
**Expected Response** (Success):
```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "user": {
    "id": "user-uuid",
    "phone": "+256758361967",
    "email": "256758361967@phone.auth"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  }
}
```

---

## 📮 Testing with Postman

### Setup Postman Collection

#### Step 1: Create New Collection
1. Open Postman
2. Click **New** > **Collection**
3. Name it "WhatsApp Authentication"

#### Step 2: Add Environment Variables
1. Click **Environments** > **Create Environment**
2. Name it "WhatsApp Auth Dev"
3. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1` | `https://rpmqpxtryrlsdsijwipm.supabase.co/functions/v1` |
| `auth_token` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbXFweHRyeXJsc2RzaWp3aXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzUwNjMsImV4cCI6MjA2ODkxMTA2M30.iLRBzB2alt_KO5fa2hBkE1QgnUd1o6iRGnkOYBZzbyc` |
| `test_phone` | `+256758361967` | `+256758361967` |
| `otp_code` | `123456` | `123456` |

4. Click **Save**
5. Select this environment from the dropdown

### Test 1: Send OTP Code

#### Step 1: Create Request
1. Right-click collection > **Add Request**
2. Name: "Send OTP Code"
3. Method: `POST`
4. URL: `{{base_url}}/send-code`

#### Step 2: Headers
Add these headers:
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

#### Step 3: Body
Select **raw** > **JSON** and add:
```json
{
  "phone": "{{test_phone}}"
}
```

#### Step 4: Tests (Optional)
Add this to the **Tests** tab to automatically extract the OTP code:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

// Extract OTP code for next request
pm.test("Extract OTP code", function () {
    var jsonData = pm.response.json();
    if (jsonData.code) {
        pm.environment.set("otp_code", jsonData.code);
    }
});
```

#### Step 5: Send Request
1. Click **Send**
2. Check the response and your WhatsApp

### Test 2: Verify OTP Code

#### Step 1: Create Request
1. Right-click collection > **Add Request**
2. Name: "Verify OTP Code"
3. Method: `POST`
4. URL: `{{base_url}}/verify-code`

#### Step 2: Headers (Same as above)
```
Content-Type: application/json
Authorization: Bearer {{auth_token}}
```

#### Step 3: Body
```json
{
  "phone": "{{test_phone}}",
  "code": "{{otp_code}}"
}
```

#### Step 4: Tests (Optional)
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

pm.test("User object exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.user).to.exist;
});

pm.test("Session object exists", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.session).to.exist;
});
```

#### Step 5: Send Request
Click **Send** and verify the response

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path
1. **Send OTP** with valid phone number
2. **Verify OTP** with correct code
3. **Result**: User created/authenticated successfully

### Scenario 2: Invalid Phone Number
**Request**:
```json
{
  "phone": "invalid-phone"
}
```
**Expected Response**:
```json
{
  "success": false,
  "error": "Phone number must be in international format (+country code followed by 7-15 digits)"
}
```

### Scenario 3: Invalid OTP Code
**Request**:
```json
{
  "phone": "+256758361967",
  "code": "000000"
}
```
**Expected Response**:
```json
{
  "success": false,
  "error": "Invalid OTP code. Please check and try again."
}
```

### Scenario 4: Expired OTP
1. Send OTP and wait 10+ minutes
2. Try to verify with the code
**Expected Response**:
```json
{
  "success": false,
  "error": "OTP code has expired. Please request a new code."
}
```

### Scenario 5: Rate Limiting
1. Send OTP for a phone number
2. Immediately try to send another OTP for the same number
**Expected Response**:
```json
{
  "success": false,
  "error": "An OTP code is already active for this phone number. Please wait before requesting a new one."
}
```

---

## 🔍 Troubleshooting

### Common Issues:

#### 1. "WhatsApp service is not configured"
- **Cause**: Missing Twilio environment variables
- **Solution**: Check `supabase secrets list` and set missing variables

#### 2. "Authentication Error" from Twilio
- **Cause**: Invalid Twilio credentials
- **Solution**: Verify Account SID and Auth Token in Twilio Console

#### 3. "Invalid phone number format"
- **Cause**: Phone number not in international format
- **Solution**: Use format `+256758361967` (country code + number)

#### 4. WhatsApp message not received
- **Cause**: Not joined Twilio sandbox
- **Solution**: Send `join <keyword>` to `+1 415 523 8886`

#### 5. "Internal server error"
- **Cause**: Various issues
- **Solution**: Check function logs: `supabase functions logs send-code`

### Debug Commands:
```bash
# Check function logs
supabase functions logs send-code --follow
supabase functions logs verify-code --follow

# Check environment variables
supabase secrets list

# Test local setup
node supabase/functions/test-setup-node.js
```

---

## 📱 WhatsApp Message Format

When you receive the OTP, it will look like:
```
Your NetLife verification code is: 123456

This code will expire in 10 minutes. Do not share this code with anyone.
```

---

## 🎯 Success Criteria

✅ **Send OTP**: Returns success with OTP code (in development)
✅ **Receive WhatsApp**: Message delivered to your phone
✅ **Verify OTP**: Returns user and session objects
✅ **Error Handling**: Proper error messages for invalid inputs
✅ **Rate Limiting**: Prevents spam requests

Your WhatsApp authentication system is ready for testing! 🚀