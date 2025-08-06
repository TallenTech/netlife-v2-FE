/**
 * Twilio WhatsApp service for sending OTP codes
 * Handles WhatsApp message sending via Twilio API
 */

export interface TwilioConfig {
    accountSid: string;
    authToken: string;
    whatsappNumber: string; // Your Twilio WhatsApp number (e.g., "whatsapp:+14155238886")
}

export interface WhatsAppMessage {
    to: string;
    body: string;
}

export interface TwilioResponse {
    success: boolean;
    messageSid?: string;
    error?: string;
}

/**
 * Twilio WhatsApp service for sending messages
 */
export class TwilioWhatsAppService {
    private config: TwilioConfig;
    private baseUrl: string;

    constructor(config: TwilioConfig) {
        this.config = config;
        this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    }

    /**
     * Send WhatsApp message via Twilio
     */
    async sendMessage(to: string, body: string): Promise<TwilioResponse> {
        try {
            // Ensure phone number has whatsapp: prefix
            const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

            // Prepare form data
            const formData = new URLSearchParams();
            formData.append('From', this.config.whatsappNumber);
            formData.append('To', whatsappTo);
            formData.append('Body', body);

            // Create authorization header
            const credentials = btoa(`${this.config.accountSid}:${this.config.authToken}`);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('Twilio API error:', responseData);
                return {
                    success: false,
                    error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
                };
            }

            return {
                success: true,
                messageSid: responseData.sid
            };

        } catch (error) {
            console.error('Twilio service error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Send OTP code via WhatsApp
     */
    async sendOTP(phoneNumber: string, otpCode: string, appName: string = 'NetLife'): Promise<TwilioResponse> {
        const message = `Your ${appName} verification code is: ${otpCode}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.`;

        return this.sendMessage(phoneNumber, message);
    }

    /**
     * Send custom WhatsApp message with template support
     */
    async sendTemplateMessage(
        phoneNumber: string,
        templateName: string,
        variables: Record<string, string>
    ): Promise<TwilioResponse> {
        try {
            // For template messages, we need to use a different approach
            // This is a basic implementation - you might want to use Twilio's template system

            let message = '';

            switch (templateName) {
                case 'otp_verification':
                    message = `Your ${variables.appName || 'NetLife'} verification code is: ${variables.code}\n\nThis code will expire in ${variables.expiry || '10'} minutes. Do not share this code with anyone.`;
                    break;
                case 'welcome':
                    message = `Welcome to ${variables.appName || 'NetLife'}! Your phone number has been successfully verified.`;
                    break;
                default:
                    return {
                        success: false,
                        error: `Unknown template: ${templateName}`
                    };
            }

            return this.sendMessage(phoneNumber, message);

        } catch (error) {
            console.error('Template message error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Template message failed'
            };
        }
    }

    /**
     * Validate Twilio configuration
     */
    static validateConfig(config: Partial<TwilioConfig>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.accountSid) {
            errors.push('Twilio Account SID is required');
        } else if (!config.accountSid.startsWith('AC')) {
            errors.push('Invalid Twilio Account SID format (should start with AC)');
        }

        if (!config.authToken) {
            errors.push('Twilio Auth Token is required');
        }

        if (!config.whatsappNumber) {
            errors.push('Twilio WhatsApp number is required');
        } else if (!config.whatsappNumber.startsWith('whatsapp:+')) {
            errors.push('WhatsApp number should be in format: whatsapp:+1234567890');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Test Twilio connection
     */
    async testConnection(): Promise<TwilioResponse> {
        try {
            // Test by fetching account info
            const testUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}.json`;
            const credentials = btoa(`${this.config.accountSid}:${this.config.authToken}`);

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.message || `Connection test failed: ${response.status}`
                };
            }

            return {
                success: true,
                messageSid: 'connection_test_success'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection test failed'
            };
        }
    }
}