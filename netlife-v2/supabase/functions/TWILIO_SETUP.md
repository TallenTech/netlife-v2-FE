# Twilio WhatsApp Integration Setup

This guide will help you set up Twilio WhatsApp integration for sending OTP codes.

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **WhatsApp Business Account**: Required for WhatsApp messaging
3. **Verified Phone Number**: For testing

## Step 1: Twilio Account Setup

### 1.1 Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com)
2. Sign up or log in
3. Navigate to your Dashboard

### 1.2 Get Account Credentials
From your Twilio Console Dashboard, note down:
- **Account SID** (starts with `AC...`)
- **Auth Token** (click to reveal)

### 1.3 Set up WhatsApp Sandbox (for testing)
1. Go to **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Follow the instructions to join the sandbox
3. Send `join <sandbox-keyword>` to the Twilio WhatsApp number
4. Note the **Sandbox WhatsApp Number** (e.g., `whatsapp:+14155238886`)

## Step 2: Environment Variables

Set these environment variables in your Supabase project:

```bash
# Twilio credentials
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid_here
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Optional: for testing
supabase secrets set TEST_PHONE_NUMBER=+1234567890
supabase secrets set ENVIRONMENT=development
```

### Environment Variables Explained:
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID (starts with AC)
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
- `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number with `whatsapp:` prefix
- `TEST_PHONE_NUMBER`: Your phone number for testing (optional)
- `ENVIRONMENT`: Set to `development` to include OTP in response for testing

## Step 3: WhatsApp Business API (Production)

For production use, you'll need to:

### 3.1 Apply for WhatsApp Business API
1. Go to **Messaging** > **WhatsApp** in Twilio Console
2. Click **Get started with WhatsApp**
3. Follow the application process
4. This requires business verification and can take several days

### 3.2 Get Your WhatsApp Business Number
Once approved, you'll get a dedicated WhatsApp Business number like:
`whatsapp:+1234567890`

## Step 4: Testing the Integration

### 4.1 Test Twilio Connection
```bash
# Run the test script
deno run --allow-env --allow-net supabase/functions/test-twilio.ts
```

### 4.2 Test via Edge Function
```bash
# Deploy the function first
supabase functions deploy send-code

# Test the endpoint
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"phone": "+1234567890"}'
```

## Step 5: Message Templates

### Default OTP Message Template:
```
Your NetLife verification code is: 123456

This code will expire in 10 minutes. Do not share this code with anyone.
```

### Custom Templates:
You can customize messages in the `TwilioWhatsAppService.sendTemplateMessage()` method.

## Troubleshooting

### Common Issues:

1. **"WhatsApp service is not configured"**
   - Check that all environment variables are set
   - Verify TWILIO_WHATSAPP_NUMBER has `whatsapp:` prefix

2. **"Authentication Error"**
   - Verify Account SID and Auth Token are correct
   - Check for any extra spaces in environment variables

3. **"Invalid 'To' Phone Number"**
   - Ensure phone number is in international format (+1234567890)
   - For sandbox, recipient must have joined the sandbox first

4. **"Message not delivered"**
   - Check if recipient has WhatsApp installed
   - Verify the phone number is correct
   - For sandbox, ensure recipient joined with the correct keyword

### Debug Steps:

1. **Check Environment Variables:**
   ```bash
   supabase secrets list
   ```

2. **Test Connection:**
   ```bash
   deno run --allow-env --allow-net supabase/functions/test-twilio.ts
   ```

3. **Check Twilio Logs:**
   - Go to Twilio Console > Monitor > Logs
   - Look for error messages and delivery status

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate auth tokens** regularly
4. **Monitor usage** to prevent abuse
5. **Implement rate limiting** (already included in the functions)

## Cost Considerations

- **WhatsApp Sandbox**: Free for testing
- **WhatsApp Business API**: Charges per message
- **Check current pricing** at [Twilio Pricing](https://www.twilio.com/pricing/messaging)

## Production Checklist

- [ ] WhatsApp Business API approved
- [ ] Production WhatsApp number configured
- [ ] Environment variables set in production
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up
- [ ] Error handling tested
- [ ] Message templates approved by WhatsApp (if using templates)

## Support

- **Twilio Documentation**: [docs.twilio.com](https://www.twilio.com/docs)
- **WhatsApp Business API**: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Supabase Edge Functions**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)