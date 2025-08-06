# Infobip WhatsApp Integration Setup

This guide will help you set up Infobip WhatsApp integration for sending OTP codes. Infobip is more cost-effective than Twilio and offers better international coverage.

## 🌟 Why Infobip?

- **Cost-effective**: Generally 30-50% cheaper than Twilio
- **Better international coverage**: Especially for Africa, Asia, and Europe
- **Direct WhatsApp Business API**: No sandbox limitations
- **Real-time delivery reports**: Better tracking and analytics
- **Dedicated support**: Better customer service for business accounts

## Prerequisites

1. **Infobip Account**: Sign up at [infobip.com](https://www.infobip.com)
2. **WhatsApp Business API**: Apply through Infobip
3. **Verified Phone Number**: For testing

## Step 1: Infobip Account Setup

### 1.1 Create Infobip Account
1. Go to [Infobip Portal](https://portal.infobip.com)
2. Sign up for a business account
3. Complete business verification (required for WhatsApp)

### 1.2 Get API Credentials
From your Infobip Portal:
1. Go to **Settings** > **API Keys**
2. Create a new API key
3. Note down your **API Key** (starts with `App ` when used)
4. Note your **Base URL** (usually `https://api.infobip.com` or your dedicated instance)

### 1.3 Apply for WhatsApp Business API
1. Go to **Channels** > **WhatsApp**
2. Click **Get Started**
3. Follow the WhatsApp Business API application process
4. This includes:
   - Business verification
   - WhatsApp Business Profile setup
   - Phone number verification
   - Template approval process

### 1.4 Get Your WhatsApp Sender Number
Once approved, you'll get a dedicated WhatsApp Business number like:
- Format: `447860099299` (without + sign for Infobip)
- This is your sender number for API calls

## Step 2: Environment Variables

Update your `.env` file and set these in Supabase:

```bash
# Infobip WhatsApp API Configuration
INFOBIP_API_KEY=your_api_key_here
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_SENDER=447860099299

# Optional: for testing
TEST_PHONE_NUMBER=+256758361967
ENVIRONMENT=development
```

### Set in Supabase:
```bash
supabase secrets set INFOBIP_API_KEY=your_api_key_here
supabase secrets set INFOBIP_BASE_URL=https://api.infobip.com
supabase secrets set INFOBIP_SENDER=447860099299
supabase secrets set ENVIRONMENT=development
```

### Environment Variables Explained:
- `INFOBIP_API_KEY`: Your Infobip API key from the portal
- `INFOBIP_BASE_URL`: API endpoint (usually https://api.infobip.com)
- `INFOBIP_SENDER`: Your WhatsApp Business number (without + sign)
- `TEST_PHONE_NUMBER`: Your phone number for testing (with + sign)

## Step 3: Testing the Integration

### 3.1 Test Infobip Connection
```bash
# Set environment variables first
export INFOBIP_API_KEY=your_api_key
export INFOBIP_BASE_URL=https://api.infobip.com
export INFOBIP_SENDER=447860099299
export TEST_PHONE_NUMBER=+256758361967

# Run the test script
deno run --allow-env --allow-net supabase/functions/test-infobip.ts
```

### 3.2 Deploy and Test Functions
```bash
# Deploy the updated function
supabase functions deploy send-code

# Test the endpoint
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"phone": "+256758361967"}'
```

## Step 4: WhatsApp Business API Features

### 4.1 Message Templates
Infobip supports approved WhatsApp templates for better delivery rates:

```typescript
// Send using approved template
await infobipService.sendApprovedTemplate(
  '+256758361967',
  'otp_verification',
  { code: '123456', expiry: '10' },
  'en'
);
```

### 4.2 Delivery Reports
Check message delivery status:

```typescript
const status = await infobipService.getMessageStatus(messageId);
console.log('Delivery status:', status.status);
```

### 4.3 Account Balance Monitoring
Monitor your account balance:

```typescript
const balance = await infobipService.getBalance();
console.log(`Balance: ${balance.balance} ${balance.currency}`);
```

## Step 5: Message Templates (Recommended)

### Default OTP Message Template:
```
Your NetLife verification code is: {{code}}

This code will expire in 10 minutes. Do not share this code with anyone.
```

### Template Approval Process:
1. Go to **Channels** > **WhatsApp** > **Templates**
2. Create new template with your message
3. Submit for WhatsApp approval
4. Use approved templates for better delivery rates

## Pricing Comparison

### Infobip vs Twilio (Approximate):
| Region | Infobip | Twilio | Savings |
|--------|---------|--------|---------|
| US/Canada | $0.005 | $0.0075 | 33% |
| Europe | $0.004 | $0.0068 | 41% |
| Africa | $0.003 | $0.0055 | 45% |
| Asia | $0.0035 | $0.006 | 42% |

*Prices vary by volume and specific countries*

## Troubleshooting

### Common Issues:

1. **"WhatsApp service is not configured"**
   - Check that all environment variables are set in Supabase
   - Verify API key format and sender number

2. **"Authentication Error"**
   - Verify API key in Infobip Portal
   - Check if API key has WhatsApp permissions

3. **"Message not delivered"**
   - Ensure recipient has WhatsApp installed
   - Check if your WhatsApp Business account is approved
   - Verify sender number is correct

4. **"Template not found"**
   - Use approved templates only
   - Check template name and language code

### Debug Steps:

1. **Check Environment Variables:**
   ```bash
   supabase secrets list
   ```

2. **Test Connection:**
   ```bash
   deno run --allow-env --allow-net supabase/functions/test-infobip.ts
   ```

3. **Check Infobip Logs:**
   - Go to Infobip Portal > Analytics > Logs
   - Look for error messages and delivery status

4. **Check Function Logs:**
   ```bash
   supabase functions logs send-code --follow
   ```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor usage** to prevent abuse
5. **Implement rate limiting** (already included)
6. **Use approved templates** for better security

## Production Checklist

- [ ] WhatsApp Business API approved
- [ ] Production WhatsApp number configured
- [ ] Environment variables set in production
- [ ] Message templates approved by WhatsApp
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up
- [ ] Error handling tested
- [ ] Balance monitoring implemented

## Support

- **Infobip Documentation**: [dev.infobip.com](https://dev.infobip.com)
- **WhatsApp Business API**: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Infobip Support**: Available through portal chat
- **Supabase Edge Functions**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

## Migration from Twilio

If you're migrating from Twilio:

1. **Keep Twilio as backup** during transition
2. **Test thoroughly** with small volume first
3. **Update environment variables** gradually
4. **Monitor delivery rates** closely
5. **Update documentation** and team knowledge

Infobip offers better value for money and international coverage! 🚀