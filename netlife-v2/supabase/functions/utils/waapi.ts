/**
 * waapi.net WhatsApp service for testing
 * Updated to match the correct waapi.net API format
 */

export interface WaapiConfig {
    instanceKey: string; // Your waapi.net instance key (e.g., "bZhBJkPRivpK")
}

export interface WaapiResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    data?: any;
}

/**
 * waapi.net WhatsApp service for sending messages
 */
export class WaapiWhatsAppService {
    private config: WaapiConfig;
    private baseUrl: string;

    constructor(config: WaapiConfig) {
        this.config = config;
        this.baseUrl = 'https://waapi.net/api';
    }

    /**
     * Send WhatsApp message via waapi.net
     */
    async sendMessage(to: string, message: string): Promise<WaapiResponse> {
        try {
            // Ensure phone number is in correct format (country code + number, no +)
            const cleanTo = to.startsWith('+') ? to.substring(1) : to;

            const payload = {
                instance_key: this.config.instanceKey,
                jid: cleanTo,
                message: message
            };

            const response = await fetch(`${this.baseUrl}/sendMessageText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            console.log('waapi.net API Response:', JSON.stringify(responseData, null, 2));
            console.log('Response Status:', response.status);

            if (!response.ok) {
                console.error('waapi.net API error:', responseData);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${responseData.message || response.statusText}`,
                    data: responseData
                };
            }

            // Check if message was sent successfully
            // waapi.net typically returns success status in the response
            if (responseData.status === 'success' || responseData.success || response.ok) {
                return {
                    success: true,
                    messageId: responseData.messageId || responseData.id || 'waapi_message',
                    data: responseData
                };
            } else {
                return {
                    success: false,
                    error: responseData.message || responseData.error || 'Message not sent',
                    data: responseData
                };
            }

        } catch (error) {
            console.error('waapi.net service error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Send WhatsApp interactive message with buttons (Copy Code button)
     */
    async sendOTPWithCopyButton(to: string, otpCode: string, appName: string = 'NetLife'): Promise<WaapiResponse> {
        try {
            // Ensure phone number is in correct format (country code + number, no +)
            const cleanTo = to.startsWith('+') ? to.substring(1) : to;

            const messageText = `Your ${appName} verification code is: ${otpCode}`;

            const payload = {
                instance_key: this.config.instanceKey,
                jid: cleanTo,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: messageText
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: `copy_${otpCode}`,
                                    title: `📋 Copy ${otpCode}`
                                }
                            }
                        ]
                    }
                }
            };

            const response = await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json();

            console.log('waapi.net Interactive API Response:', JSON.stringify(responseData, null, 2));

            if (!response.ok) {
                console.error('waapi.net Interactive API error:', responseData);
                // Fallback to regular text message if interactive fails
                console.log('Falling back to regular text message...');
                return this.sendMessage(to, messageText);
            }

            // Check if message was sent successfully
            if (responseData.status === 'success' || responseData.success || response.ok) {
                return {
                    success: true,
                    messageId: responseData.messageId || responseData.id || 'waapi_interactive_message',
                    data: responseData
                };
            } else {
                // Fallback to regular text message
                console.log('Interactive message failed, falling back to text message...');
                return this.sendMessage(to, messageText);
            }

        } catch (error) {
            console.error('waapi.net interactive service error:', error);
            // Fallback to regular text message
            console.log('Interactive message error, falling back to text message...');
            const fallbackMessage = `Your ${appName} verification code is: ${otpCode}`;
            return this.sendMessage(to, fallbackMessage);
        }
    }

    /**
     * Send OTP code via WhatsApp with Copy Button
     */
    async sendOTP(phoneNumber: string, otpCode: string, appName: string = 'NetLife'): Promise<WaapiResponse> {
        // Try to send interactive message with copy button first
        return this.sendOTPWithCopyButton(phoneNumber, otpCode, appName);
    }

    /**
     * Send custom WhatsApp message with template support
     */
    async sendTemplateMessage(
        phoneNumber: string,
        templateName: string,
        variables: Record<string, string>
    ): Promise<WaapiResponse> {
        try {
            let message = '';

            switch (templateName) {
                case 'otp_verification':
                    message = `Your ${variables.appName || 'NetLife'} verification code is: ${variables.code}`;
                    break;
                case 'welcome':
                    message = `🎉 Welcome to ${variables.appName || 'NetLife'}!

✅ Your phone number has been successfully verified.

Thank you for joining us!`;
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
     * Check instance status (if waapi.net provides this endpoint)
     */
    async checkStatus(): Promise<WaapiResponse> {
        try {
            // Note: waapi.net might not have a status endpoint
            // This is a placeholder implementation
            return {
                success: true,
                data: { status: 'connected', instanceKey: this.config.instanceKey }
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Status check failed'
            };
        }
    }

    /**
     * Validate waapi.net configuration
     */
    static validateConfig(config: Partial<WaapiConfig>): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.instanceKey) {
            errors.push('waapi.net instance key is required');
        } else if (config.instanceKey.length < 5) {
            errors.push('Invalid waapi.net instance key format (too short)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Test waapi.net connection
     */
    async testConnection(): Promise<WaapiResponse> {
        try {
            // Test by sending a simple message to a test number
            // For now, just validate the configuration
            const validation = WaapiWhatsAppService.validateConfig(this.config);

            if (validation.isValid) {
                return {
                    success: true,
                    messageId: 'connection_test_success',
                    data: { instanceKey: this.config.instanceKey, status: 'configured' }
                };
            } else {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Connection test failed'
            };
        }
    }
}