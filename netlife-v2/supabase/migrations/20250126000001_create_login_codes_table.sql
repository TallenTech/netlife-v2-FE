-- Create login_codes table for OTP management (matching existing schema)
CREATE TABLE IF NOT EXISTS login_codes (
  phone_number TEXT NOT NULL PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

-- Index for cleanup job performance
CREATE INDEX IF NOT EXISTS idx_login_codes_expires_at ON login_codes(expires_at);

-- Index for phone number lookups (already covered by primary key)
-- CREATE INDEX IF NOT EXISTS idx_login_codes_phone_number ON login_codes(phone_number);

-- Note: Additional profile table modifications and cleanup functions
-- can be added here if needed in the future