# WhatsApp Authentication Utilities

This directory contains utility functions and services for the WhatsApp authentication system.

## Files

### `phone.ts`
Phone number validation and normalization utilities.

**Functions:**
- `validatePhoneNumber(phone: string)`: Validates international phone number format
- `normalizePhoneNumber(phone: string)`: Normalizes phone number to standard format
- `formatPhoneNumber(phone: string)`: Formats phone number for display
- `arePhoneNumbersEqual(phone1: string, phone2: string)`: Compares two phone numbers

**Usage:**
```typescript
import { validatePhoneNumber, normalizePhoneNumber } from './utils/phone.ts';

const result = validatePhoneNumber('+1 (234) 567-8900');
if (result.isValid) {
  console.log('Normalized:', result.normalized); // +12345678900
}
```

### `database.ts`
Database service for managing OTP codes in the `login_codes` table.

**Class:** `OTPDatabaseService`

**Methods:**
- `storeOTP(phone, code, expiryMinutes)`: Store new OTP code
- `getOTP(phone)`: Retrieve OTP code for phone number
- `markAsVerified(phone)`: Mark OTP code as verified
- `deleteOTP(phone)`: Delete OTP code after successful verification
- `cleanupExpiredCodes()`: Remove expired OTP codes
- `hasActiveOTP(phone)`: Check if phone has active (non-expired) OTP
- `getOTPStats()`: Get usage statistics

**Usage:**
```typescript
import { OTPDatabaseService } from './utils/database.ts';

const dbService = new OTPDatabaseService({
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
});

await dbService.storeOTP('+12345678900', '123456', 10);
```

## Database Schema

### `login_codes` Table
```sql
CREATE TABLE login_codes (
  phone_number TEXT NOT NULL PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
- `idx_login_codes_expires_at`: For cleanup operations
- Primary key on `phone_number` provides efficient phone number lookups

## Testing

Run tests with:
```bash
# If Deno is available
deno test --allow-all tests/

# Or use the validation script
deno run --allow-all validate-phone-utils.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **1.1**: Phone number validation and storage
- **1.3**: Secure OTP storage with expiration
- **2.2**: Rate limiting and attempt tracking  
- **6.4**: Phone number normalization to international format

## Security Features

- Phone numbers are normalized to international format
- OTP codes are hashed before database storage
- Automatic cleanup of expired codes
- Rate limiting to prevent abuse
- Attempt tracking for security monitoring