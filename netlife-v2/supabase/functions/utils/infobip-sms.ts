/**
 * Infobip SMS service as fallback while WhatsApp is being set up
 * SMS works immediately with Infobip accounts
 */

export interface InfobipSMSConfig {
    apiKey: string;
    baseUrl: string;
    sender: string; // SMS sender ID (can be alphanumeric like "NetLife")
}

export interface SMSResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Infobip SMS service for sending OTP codes
 */
export class InfobipSMSService {
    private config: InfobipSMSConfig;
    private apiUrl: string;

    constructor(config: InfobipSMSConfig) {
        this.config = config;
        this.apiUrl = `${config.baseUrl}/sms/2/text/advanced`;
    }

    /**
     * Send SMS message via Infobip
     */
    async sendSMS(to: string, text: string): Promise<SMSResponse> {
        try {
            // Ensure phone number is in correct format (without + for Infobip)
            const cleanTo = to.startsWith('+') ? to.substring(1) : to;

            const payload = {
                messages: [
                    {
                        from: this.config.sender,
                        destinations: [
                            {
                                to: cleanTo
                            }
                        ],
                        text: text
                    }
                ]
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('Infobip SMS API error:', responseData);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            // Check if message was accepted
            const message = responseData.messages?.[0];
            if (message && message.status.groupId === 1) { // Group 1 = PENDING (accepted)
                return {
                    success: true,
                    messageId: message.messageId
                };
            } else {
                return {
                    success: false,
                    error: `${message?.status.description || 'Message not accepted'} (Status: ${message?.status.name || 'Unknown'})`
                };
            }

        } catch (error) {
            console.error('Infobip SMS service error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Send OTP code via SMS
     */
    async sendOTP(phoneNumber: string, otpCode: string, appName: string = 'NetLife'): Promise<SMSResponse> {
        const message = `Your ${appName} verification code is: ${otpCode}. This code will expire in 10 minutes. Do not share this code with anyone.`;

        return this.sendSMS(phoneNumber, message);
    }
}