/**
 * Infobip WhatsApp service for sending OTP codes
 * More cost-effective alternative to Twilio
 */

export interface InfobipConfig {
    apiKey: string;
    baseUrl: string; // e.g., "https://api.infobip.com" or your dedicated instance
    sender: string; // Your WhatsApp sender number (e.g., "447860099299")
}

export interface WhatsAppMessage {
    to: string;
    content: {
        text: string;
    };
}

export interface InfobipResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    bulkId?: string;
}

export interface InfobipApiResponse {
    bulkId: string;
    messages: Array<{
        messageId: string;
        status: {
            groupId: number;
            groupName: string;
            id: number;
            name: string;
            description: string;
        };
        destination: string;
    }>;
}

/**
 * Infobip WhatsApp service for sending messages
 */
export class InfobipWhatsAppService {
    private config: InfobipConfig;
    private apiUrl: string;

    constructor(config: InfobipConfig) {
        this.config = config;
        this.apiUrl = `${config.baseUrl}/whatsapp/1/message/text`;
    }

    /**
     * Send WhatsApp message via Infobip
     */
    async sendMessage(to: string, text: string): Promise<InfobipResponse> {
        try {
            // Ensure phone number is in correct format (without + for Infobip)
            const cleanTo = to.startsWith('+') ? to.substring(1) : to;

            const payload = {
                from: this.config.sender,
                to: cleanTo,
                content: {
                    text: text
                }
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

            const responseData = await response.json() as InfobipApiResponse;

            if (!response.ok) {
                console.error('Infobip API error:', responseData);
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
                    messageId: message.messageId,
                    bulkId: responseData.bulkId
                };
            } else {
                return {
                    success: false,
                    error: `${message?.status.description || 'Message not accepted'} (Status: ${message?.status.name || 'Unknown'}, GroupId: ${message?.status.groupId || 'Unknown'})`
                };
            }

        } catch (error) {
            console.error('Infobip service error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Send OTP code via WhatsApp
     */
    async sendOTP(phoneNumber: string, otpCode: string, appName: string = 'NetLife'): Promise<InfobipResponse> {
        const message = `Your ${appName} verification code is: ${otpCode}`;

        return this.sendMessage(phoneNumber, message);
    }

    /**
     * Send custom WhatsApp message with template support
     */
    async sendTemplateMessage(
        phoneNumber: string,
        templateName: string,
        variables: Record<string, string>
    ): Promise<InfobipResponse> {
        try {
            let message = '';

            switch (templateName) {
                case 'otp_verification':
                    message = `Your ${variables.appName || 'NetLife'} verification code is: ${variables.code}`;
                    break;
                case 'welcome':
                    message = `Welcome to ${variables.appName || 'NetLife'}! Your phone number has been successfully verified.`;
                    break;
                case 'otp_resend':
                    message = `Your ${variables.appName || 'NetLife'} verification code is: ${variables.code}`;
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
     * Send WhatsApp message using Infobip template (for approved templates)
     */
    async sendApprovedTemplate(
        phoneNumber: string,
        templateName: string,
        templateData: Record<string, string>,
        language: string = 'en'
    ): Promise<InfobipResponse> {
        try {
            const cleanTo = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;

            const payload = {
                from: this.config.sender,
                to: cleanTo,
                content: {
                    templateName: templateName,
                    templateData: templateData,
                    language: language
                }
            };

            // Use template endpoint
            const templateUrl = `${this.config.baseUrl}/whatsapp/1/message/template`;

            const response = await fetch(templateUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json() as InfobipApiResponse;

            if (!response.ok) {
                console.error('Infobip template API error:', responseData);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const message = responseData.messages?.[0];
            if (message && message.status.groupId === 1) {
                return {
                    success: true,
                    messageId: message.messageId,
                    bulkId: responseData.bulkId
                };
            } else {
                return {
                    success: false,
                    error: message?.status.description || 'Template message not accepted'
                };
            }

        } catch (error) {
            console.error('Infobip template error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Template message failed'
            };
        }
    }

    /**
     * Get message delivery status
     */
    async getMessageStatus(messageId: string): Promise<{
        success: boolean;
        status?: string;
        error?: string;
    }> {
        try {
            const statusUrl = `${this.config.baseUrl}/whatsapp/1/reports`;

            const response = await fetch(`${statusUrl}?messageId=${messageId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `App ${this.config.apiKey}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const data = await response.json();
            const report = data.results?.[0];

            return {
                success: true,
                status: report?.status?.name || 'UNKNOWN'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Status check failed'
            };
        }
    }

    /**
     * Validate Infobip configuration
     */
    static validateConfig(config: Partial<InfobipConfig>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.apiKey) {
            errors.push('Infobip API Key is required');
        } else if (config.apiKey.length < 20) {
            errors.push('Invalid Infobip API Key format (too short)');
        }

        if (!config.baseUrl) {
            errors.push('Infobip Base URL is required');
        } else if (!config.baseUrl.startsWith('https://')) {
            errors.push('Base URL must start with https://');
        }

        if (!config.sender) {
            errors.push('WhatsApp sender number is required');
        } else if (!/^\d{10,15}$/.test(config.sender)) {
            errors.push('Sender number should be 10-15 digits (without + or spaces)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Test Infobip connection
     */
    async testConnection(): Promise<InfobipResponse> {
        try {
            // Test by getting account balance or info
            const testUrl = `${this.config.baseUrl}/account/1/balance`;

            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `App ${this.config.apiKey}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: errorData.requestError?.serviceException?.text || `Connection test failed: ${response.status}`
                };
            }

            return {
                success: true,
                messageId: 'connection_test_success'
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection test failed'
            };
        }
    }

    /**
     * Get account balance (useful for monitoring)
     */
    async getBalance(): Promise<{
        success: boolean;
        balance?: number;
        currency?: string;
        error?: string;
    }> {
        try {
            const balanceUrl = `${this.config.baseUrl}/account/1/balance`;

            const response = await fetch(balanceUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `App ${this.config.apiKey}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const data = await response.json();

            return {
                success: true,
                balance: data.balance,
                currency: data.currency
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Balance check failed'
            };
        }
    }
}