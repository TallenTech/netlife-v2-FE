import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { validatePhoneNumber } from "../utils/phone.ts";
import { OTPDatabaseService } from "../utils/database.ts";
import { InfobipWhatsAppService } from "../utils/infobip.ts";
import { WaapiWhatsAppService } from "../utils/waapi.ts";

interface SendCodeRequest {
    phone: string;
}

interface SendCodeResponse {
    success: boolean;
    message: string;
    error?: string;
    code?: string; // Only included in development mode
}

serve(async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ success: false, error: 'Method not allowed' }),
                {
                    status: 405,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Parse request body
        const { phone }: SendCodeRequest = await req.json();

        if (!phone) {
            return new Response(
                JSON.stringify({ success: false, error: 'Phone number is required' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Validate phone number format
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: phoneValidation.error || 'Invalid phone number format'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        const normalizedPhone = phoneValidation.normalized!;

        // Initialize database service
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const dbService = new OTPDatabaseService({
            supabaseUrl,
            supabaseServiceKey
        });

        // Check if there's already an active OTP for this phone
        const hasActive = await dbService.hasActiveOTP(normalizedPhone);
        if (hasActive) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'An OTP code is already active for this phone number. Please wait before requesting a new one.'
                }),
                {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Generate 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in database (10 minutes expiry)
        await dbService.storeOTP(normalizedPhone, otpCode, 10);

        // Check which WhatsApp service to use (waapi.net for testing, Infobip for production)
        const waapiInstanceKey = Deno.env.get('WAAPI_INSTANCE_KEY');
        const useWaapi = Deno.env.get('USE_WAAPI') === 'true';

        let whatsappResult;

        if (useWaapi && waapiInstanceKey) {
            console.log('Using waapi.net for WhatsApp messaging (testing mode)');
            console.log('Instance Key:', waapiInstanceKey);
            console.log('Target Phone:', normalizedPhone);
            console.log('OTP Code:', otpCode);

            const waapiService = new WaapiWhatsAppService({
                instanceKey: waapiInstanceKey
            });

            whatsappResult = await waapiService.sendOTP(normalizedPhone, otpCode, 'NetLife');

            console.log('waapi.net Result:', JSON.stringify(whatsappResult, null, 2));
        } else {
            console.log('Using Infobip for WhatsApp messaging (production mode)');

            // Initialize Infobip WhatsApp service
            const infobipApiKey = Deno.env.get('INFOBIP_API_KEY');
            const infobipBaseUrl = Deno.env.get('INFOBIP_BASE_URL') || 'https://api.infobip.com';
            const infobipSender = Deno.env.get('INFOBIP_SENDER');

            if (!infobipApiKey || !infobipSender) {
                console.error('Missing Infobip configuration');
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'WhatsApp service is not configured'
                    }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    }
                );
            }

            const infobipService = new InfobipWhatsAppService({
                apiKey: infobipApiKey,
                baseUrl: infobipBaseUrl,
                sender: infobipSender
            });

            whatsappResult = await infobipService.sendOTP(normalizedPhone, otpCode, 'NetLife');
        }

        if (!whatsappResult.success) {
            console.error('Failed to send WhatsApp message:', whatsappResult.error);
            console.error('Phone:', normalizedPhone);

            // Clean up the stored OTP since we couldn't send it
            await dbService.deleteOTP(normalizedPhone);

            // In development, return more detailed error info
            const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
            const errorMessage = isDevelopment
                ? `WhatsApp API Error: ${whatsappResult.error}`
                : 'Failed to send WhatsApp message. Please try again.';

            return new Response(
                JSON.stringify({
                    success: false,
                    error: errorMessage
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log(`WhatsApp OTP sent successfully to ${normalizedPhone}, Message ID: ${whatsappResult.messageId}`);

        // In development, return the code for testing
        const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';

        const response: SendCodeResponse = {
            success: true,
            message: 'OTP code sent successfully via WhatsApp',
            ...(isDevelopment && { code: otpCode }) // Only include code in development
        };

        return new Response(
            JSON.stringify(response),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error in send-code function:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});