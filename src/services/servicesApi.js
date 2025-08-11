import { supabase } from '@/lib/supabase';
import { handleApiError, logError, validateRequiredFields, retryWithBackoff } from '@/utils/errorHandling';


/**
 * Services API Layer
 * Provides all database operations for the services management system
 */
export const servicesApi = {
    /**
     * Fetch all available services from the services table
     * @returns {Promise<Service[]>} Array of service objects
     */
    async getServices() {
        try {
            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('services')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) {
                    throw new Error(`Failed to fetch services: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getServices');
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch questions for a specific service
     * @param {string} serviceId - The service ID to fetch questions for
     * @returns {Promise<ServiceQuestion[]>} Array of question objects
     */
    async getServiceQuestions(serviceId) {
        try {
            validateRequiredFields({ serviceId }, ['serviceId']);

            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('service_questions')
                    .select('*')
                    .eq('service_id', serviceId)
                    .order('created_at', { ascending: true });

                if (error) {
                    throw new Error(`Failed to fetch service questions: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getServiceQuestions', { serviceId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch answer options for a specific question
     * @param {string} questionId - The question ID to fetch options for
     * @returns {Promise<QuestionOption[]>} Array of option objects
     */
    async getQuestionOptions(questionId) {
        try {
            validateRequiredFields({ questionId }, ['questionId']);

            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('question_options')
                    .select('*')
                    .eq('question_id', questionId)
                    .order('created_at', { ascending: true });

                if (error) {
                    throw new Error(`Failed to fetch question options: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getQuestionOptions', { questionId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Save user screening answers to the database
     * @param {ScreeningAnswer[]} answers - Array of answer objects
     * @returns {Promise<void>}
     */
    async saveScreeningAnswers(answers) {
        try {
            if (!answers || !Array.isArray(answers) || answers.length === 0) {
                throw new Error('Valid answers array is required');
            }

            // Validate required fields for each answer
            for (const answer of answers) {
                validateRequiredFields(answer, ['user_id', 'service_id', 'question_id']);
            }

            const { error } = await supabase
                .from('user_screening_answers')
                .insert(answers);

            if (error) {
                throw new Error(`Failed to save screening answers: ${error.message}`);
            }
        } catch (error) {
            logError(error, 'servicesApi.saveScreeningAnswers', { answersCount: answers?.length });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Submit a comprehensive service request to the database
     * @param {ServiceRequest} request - The service request object
     * @returns {Promise<string>} The ID of the created request
     */
    async submitServiceRequest(request) {
        try {
            validateRequiredFields(request, ['user_id', 'service_id', 'request_data']);

            // Validate delivery preferences
            const validation = validateDeliveryPreferences(request.request_data);
            if (!validation.isValid) {
                throw new Error(`Invalid delivery preferences: ${validation.errors.join(', ')}`);
            }

            // Extract common fields from request_data for easier querying
            const extractedFields = extractCommonFields(request.request_data);

            // Prepare the complete request data
            const requestData = {
                user_id: request.user_id,
                service_id: request.service_id,
                status: request.status || 'pending',
                request_data: request.request_data,

                // Extracted common fields
                delivery_method: extractedFields.delivery_method,
                delivery_location: extractedFields.delivery_location,
                preferred_date: extractedFields.preferred_date,
                quantity: extractedFields.quantity,
                counselling_required: extractedFields.counselling_required,
                counselling_channel: extractedFields.counselling_channel,

                // File attachments
                attachments: request.attachments || null,

                // Timestamps
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('service_requests')
                .insert([requestData])
                .select('id')
                .single();

            if (error) {
                // Provide more specific error messages for common issues
                let errorMessage = `Failed to submit service request: ${error.message}`;

                if (error.message.includes('invalid input syntax for type uuid')) {
                    errorMessage = `Invalid user ID format. Please ensure the user ID is a valid UUID.`;
                } else if (error.message.includes('violates foreign key constraint')) {
                    errorMessage = `User not found in database. Please ensure the test user exists in the profiles table.`;
                } else if (error.message.includes('null value in column')) {
                    errorMessage = `Missing required field: ${error.message}`;
                } else if (error.message.includes('row level security policy')) {
                    errorMessage = `Row Level Security is blocking the operation. For testing, you may need to disable RLS on the service_requests table. See FIX_RLS_FOR_TESTING.sql for solutions.`;
                }

                throw new Error(errorMessage);
            }

            return data.id;
        } catch (error) {
            logError(error, 'servicesApi.submitServiceRequest', { request });
            throw new Error(handleApiError(error));
        }
    },



    /**
     * Get service requests for a user
     * @param {string} userId - The user ID
     * @returns {Promise<ServiceRequest[]>} Array of service requests
     */
    async getUserServiceRequests(userId) {
        try {
            validateRequiredFields({ userId }, ['userId']);

            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('service_requests')
                    .select(`
                        *,
                        services (
                            id,
                            name,
                            description,
                            slug
                        )
                    `)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) {
                    throw new Error(`Failed to fetch user service requests: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getUserServiceRequests', { userId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Get current authenticated user
     * @returns {Promise<User|null>} Current user or null if not authenticated
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error) {
                throw new Error(`Failed to get current user: ${error.message}`);
            }

            return user;
        } catch (error) {
            logError(error, 'servicesApi.getCurrentUser');
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Save screening results to the database
     * @param {ScreeningResult} result - The screening result object
     * @returns {Promise<string>} The ID of the created screening result
     */
    async saveScreeningResult(result) {
        try {
            validateRequiredFields(result, ['user_id', 'service_id', 'score', 'eligible']);

            const resultData = {
                user_id: result.user_id,
                service_id: result.service_id,
                score: result.score,
                eligible: result.eligible,
                answers_summary: result.answers || null,
                completed_at: result.completed_at || new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('screening_results')
                .insert([resultData])
                .select('id')
                .single();

            if (error) {
                throw new Error(`Failed to save screening result: ${error.message}`);
            }

            return data.id;
        } catch (error) {
            logError(error, 'servicesApi.saveScreeningResult', { result });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Get screening results for a user
     * @param {string} userId - The user ID
     * @returns {Promise<ScreeningResult[]>} Array of screening results
     */
    async getUserScreeningResults(userId) {
        try {
            validateRequiredFields({ userId }, ['userId']);

            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('screening_results')
                    .select(`
                        *,
                        services (
                            id,
                            name,
                            description,
                            slug
                        )
                    `)
                    .eq('user_id', userId)
                    .order('completed_at', { ascending: false });

                if (error) {
                    throw new Error(`Failed to fetch user screening results: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getUserScreeningResults', { userId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete a service request from the database
     * @param {string} requestId - The service request ID to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deleteServiceRequest(requestId) {
        try {
            validateRequiredFields({ requestId }, ['requestId']);

            // First verify the record exists and get user info for logging
            const { data: existingRequest, error: fetchError } = await supabase
                .from('service_requests')
                .select('id, user_id, service_id')
                .eq('id', requestId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw new Error(`Failed to verify service request: ${fetchError.message}`);
            }

            if (!existingRequest) {
                return true; // Consider it successfully deleted if it doesn't exist
            }

            // Delete the service request
            const { error } = await supabase
                .from('service_requests')
                .delete()
                .eq('id', requestId);

            if (error) {
                throw new Error(`Failed to delete service request: ${error.message}`);
            }
            return true;
        } catch (error) {
            logError(error, 'servicesApi.deleteServiceRequest', { requestId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete a screening result from the database
     * @param {string} resultId - The screening result ID to delete
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deleteScreeningResult(resultId) {
        try {
            validateRequiredFields({ resultId }, ['resultId']);

            // First, get the screening result to find related data
            const { data: screeningResult, error: fetchError } = await supabase
                .from('screening_results')
                .select('id, user_id, service_id')
                .eq('id', resultId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw new Error(`Failed to fetch screening result: ${fetchError.message}`);
            }

            if (!screeningResult) {
                return true; // Consider it successfully deleted if it doesn't exist
            }

            // Delete the screening result
            const { error } = await supabase
                .from('screening_results')
                .delete()
                .eq('id', resultId);

            if (error) {
                throw new Error(`Failed to delete screening result: ${error.message}`);
            }

            // Also delete related screening answers
            try {
                const { error: answersError } = await supabase
                    .from('user_screening_answers')
                    .delete()
                    .eq('user_id', screeningResult.user_id)
                    .eq('service_id', screeningResult.service_id);

                if (answersError) {
                    // Don't throw error here, as the main deletion succeeded
                }
            } catch (answersDeleteError) {
                // Continue execution - main deletion was successful
            }

            return true;
        } catch (error) {
            logError(error, 'servicesApi.deleteScreeningResult', { resultId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Submit service request with enhanced error handling for sync operations
     * @param {Object} request - Service request data
     * @param {boolean} isSync - Whether this is a sync operation (more lenient validation)
     * @returns {Promise<string>} The created request ID
     */
    async submitServiceRequestForSync(request, isSync = true) {
        try {
            validateRequiredFields(request, ['user_id', 'service_id', 'request_data']);

            // For sync operations, try to auto-fix common validation issues
            if (isSync && request.request_data) {
                const requestData = { ...request.request_data };

                // Auto-fix delivery location issues
                const deliveryMethod = requestData.deliveryMethod || requestData.accessPoint;
                const locationBasedMethods = ['Home Delivery', 'Community Group Delivery'];

                if (locationBasedMethods.includes(deliveryMethod) && !requestData.deliveryLocation) {
                    // Try to use address field or set a default
                    requestData.deliveryLocation = requestData.address || 'Location to be confirmed';
                }

                // Ensure delivery method is set
                if (!requestData.deliveryMethod && !requestData.accessPoint) {
                    requestData.deliveryMethod = 'Facility pickup';
                }

                // Update the request with sanitized data
                request.request_data = requestData;
            }

            // Validate delivery preferences
            const validation = validateDeliveryPreferences(request.request_data);
            if (!validation.isValid) {
                throw new Error(`Invalid delivery preferences: ${validation.errors.join(', ')}`);
            }

            // Extract common fields from request_data for easier querying
            const extractedFields = extractCommonFields(request.request_data);

            // Prepare the complete request data
            const requestData = {
                user_id: request.user_id,
                service_id: request.service_id,
                request_data: request.request_data,
                attachments: request.attachments,
                status: 'pending',
                created_at: new Date().toISOString(),
                ...extractedFields
            };

            const { data, error } = await supabase
                .from('service_requests')
                .insert([requestData])
                .select('id')
                .single();

            if (error) {
                throw new Error(`Failed to submit service request: ${error.message}`);
            }

            return data.id;
        } catch (error) {
            logError(error, 'servicesApi.submitServiceRequestForSync', { request, isSync });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Delete user screening answers for a specific service
     * @param {string} userId - The user ID
     * @param {string} serviceId - The service ID
     * @returns {Promise<boolean>} True if deletion was successful
     */
    async deleteUserScreeningAnswers(userId, serviceId) {
        try {
            validateRequiredFields({ userId, serviceId }, ['userId', 'serviceId']);

            const { error } = await supabase
                .from('user_screening_answers')
                .delete()
                .eq('user_id', userId)
                .eq('service_id', serviceId);

            if (error) {
                throw new Error(`Failed to delete screening answers: ${error.message}`);
            }

            return true;
        } catch (error) {
            logError(error, 'servicesApi.deleteUserScreeningAnswers', { userId, serviceId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>} True if user is authenticated
     */
    async isAuthenticated() {
        try {
            const user = await this.getCurrentUser();
            return !!user;
        } catch (error) {
            logError(error, 'servicesApi.isAuthenticated');
            return false;
        }
    },

    /**
     * Get service by slug
     * @param {string} slug - The service slug
     * @returns {Promise<Service|null>} Service object or null if not found
     */
    async getServiceBySlug(slug) {
        try {
            validateRequiredFields({ slug }, ['slug']);

            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No rows returned
                        return null;
                    }
                    throw new Error(`Failed to fetch service by slug: ${error.message}`);
                }

                return data;
            });
        } catch (error) {
            logError(error, 'servicesApi.getServiceBySlug', { slug });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch service questions with their answer options combined
     * @param {string} serviceId - The service ID to fetch questions for
     * @returns {Promise<ServiceQuestionWithOptions[]>} Array of questions with their options
     */
    async getServiceQuestionsWithOptions(serviceId) {
        try {
            validateRequiredFields({ serviceId }, ['serviceId']);

            return await retryWithBackoff(async () => {
                // First, fetch all questions for the service
                const questions = await this.getServiceQuestions(serviceId);

                // Then, fetch options for each question
                const questionsWithOptions = await Promise.all(
                    questions.map(async (question) => {
                        const options = await this.getQuestionOptions(question.id);
                        return transformQuestionData(question, options);
                    })
                );

                return questionsWithOptions;
            });
        } catch (error) {
            logError(error, 'servicesApi.getServiceQuestionsWithOptions', { serviceId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Fetch service questions with options using a single optimized query
     * @param {string} serviceId - The service ID to fetch questions for
     * @returns {Promise<ServiceQuestionWithOptions[]>} Array of questions with their options
     */
    async getServiceQuestionsWithOptionsOptimized(serviceId) {
        try {
            validateRequiredFields({ serviceId }, ['serviceId']);

            return await retryWithBackoff(async () => {
                // Use Supabase's join capability to fetch questions and options in one query
                const { data, error } = await supabase
                    .from('service_questions')
                    .select(`
                        *,
                        question_options (
                            id,
                            option_text,
                            value,
                            created_at
                        )
                    `)
                    .eq('service_id', serviceId)
                    .order('created_at', { ascending: true });

                if (error) {
                    throw new Error(`Failed to fetch service questions with options: ${error.message}`);
                }

                // Transform the data to match expected format
                return (data || []).map(question =>
                    transformQuestionData(question, question.question_options || [])
                );
            });
        } catch (error) {
            logError(error, 'servicesApi.getServiceQuestionsWithOptionsOptimized', { serviceId });
            throw new Error(handleApiError(error));
        }
    }
};

// Service UI mapping - hardcoded based on service names
const serviceUIMapping = {
    'HIV Testing': { category: 'routine', color: 'red', icon: 'Heart' },
    'STI Screening': { category: 'routine', color: 'blue', icon: 'Shield' },
    'PrEP Access': { category: 'follow-up', color: 'green', icon: 'Calendar' },
    'PEP Access': { category: 'urgent', color: 'yellow', icon: 'Star' },
    'ART Support': { category: 'follow-up', color: 'purple', icon: 'HeartPulse' },
    'Counseling': { category: 'routine', color: 'indigo', icon: 'UserCheck' },
    'Counselling': { category: 'routine', color: 'indigo', icon: 'UserCheck' }
};

// Export data transformation utilities
export const transformServiceData = (service) => {
    // Get UI mapping based on service name, with fallback defaults
    const uiMapping = serviceUIMapping[service.name] || {
        category: 'routine',
        color: 'blue',
        icon: 'Heart'
    };

    // Transform database service to match existing UI expectations
    return {
        id: service.id,
        slug: service.slug,
        title: service.name,
        desc: service.description,
        category: uiMapping.category,
        color: uiMapping.color,
        icon: uiMapping.icon
    };
};

export const transformQuestionData = (question, options = []) => {
    // Transform database question to match existing UI expectations
    return {
        id: question.id,
        service_id: question.service_id,
        question_text: question.question_text,
        question_type: question.question_type,
        required: question.required,
        options: options.map(option => ({
            id: option.id,
            text: option.option_text,
            value: option.value
        }))
    };
};

// Export eligibility calculation utility
export const calculateEligibility = (answers) => {
    // Get all answer values
    const answerValues = Object.values(answers);

    if (answerValues.length === 0) {
        return {
            eligible: false,
            score: 0
        };
    }

    // Count "yes" answers (case-insensitive)
    const yesCount = answerValues.filter(answer => {
        const normalizedAnswer = String(answer).toLowerCase();
        return normalizedAnswer === 'yes' || normalizedAnswer === 'true';
    }).length;

    // Calculate percentage score based on yes answers
    const score = Math.round((yesCount / answerValues.length) * 100);

    // User is eligible if they have at least one "yes" answer
    const eligible = yesCount > 0;

    return {
        eligible,
        score
    };
};

// Extract common fields from service request form data for easier querying
export const extractCommonFields = (requestData) => {
    const extracted = {
        delivery_method: null,
        delivery_location: null,
        preferred_date: null,
        quantity: null,
        counselling_required: null,
        counselling_channel: null
    };

    if (!requestData || typeof requestData !== 'object') {
        return extracted;
    }

    // Extract delivery method with validation
    if (requestData.deliveryMethod) {
        extracted.delivery_method = requestData.deliveryMethod;
    } else if (requestData.accessPoint) {
        extracted.delivery_method = requestData.accessPoint;
    }

    // Validate delivery method
    if (extracted.delivery_method) {
        const validMethods = ['Home Delivery', 'Facility pickup', 'Community Group Delivery', 'Pick-up from facility'];
        if (!validMethods.includes(extracted.delivery_method)) {
            // Invalid delivery method
        }
    }

    // Extract delivery location with enhanced processing
    if (requestData.deliveryLocation) {
        if (typeof requestData.deliveryLocation === 'string') {
            extracted.delivery_location = {
                address: requestData.deliveryLocation,
                coordinates: null,
                details: null
            };
        } else if (typeof requestData.deliveryLocation === 'object') {
            extracted.delivery_location = {
                address: requestData.deliveryLocation.address || null,
                coordinates: requestData.deliveryLocation.coordinates || null,
                details: requestData.deliveryLocation.details || null,
                timestamp: requestData.deliveryLocation.timestamp || null
            };
        }
    }

    // Extract preferred date with validation
    let dateValue = requestData.deliveryDate || requestData.preferredDate;
    if (dateValue) {
        // Validate date is within acceptable range (6 hours to 60 days)
        const selectedDate = new Date(dateValue);
        const now = new Date();
        const minDate = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
        const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

        if (selectedDate >= minDate && selectedDate <= maxDate) {
            extracted.preferred_date = dateValue;
        } else {
            extracted.preferred_date = null;
        }
    }

    // Extract quantity
    if (requestData.quantity !== undefined && requestData.quantity !== null && requestData.quantity !== '') {
        const qty = typeof requestData.quantity === 'number' ? requestData.quantity : parseInt(requestData.quantity);
        if (!isNaN(qty)) {
            extracted.quantity = qty;
        }
    }

    // Extract counselling information
    if (requestData.counsellingSupport) {
        extracted.counselling_required = requestData.counsellingSupport === 'Yes' || requestData.counsellingSupport === true;

        if (extracted.counselling_required && requestData.counsellingChannel) {
            extracted.counselling_channel = requestData.counsellingChannel;
        }
    }

    return extracted;
};

// Validate file for service request attachments
export const validateServiceRequestFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
        throw new Error('No file provided');
    }

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
    }

    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.');
    }

    return true;
};

// Validate delivery preferences
export const validateDeliveryPreferences = (requestData) => {
    const errors = [];

    // Validate request data

    // Validate delivery method
    if (requestData.deliveryMethod || requestData.accessPoint) {
        const method = requestData.deliveryMethod || requestData.accessPoint;
        const validMethods = ['Home Delivery', 'Facility pickup', 'Community Group Delivery', 'Pick-up from facility'];

        if (!validMethods.includes(method)) {
            errors.push(`Invalid delivery method: ${method}`);
        }

        // Validate location is provided for location-based delivery
        const locationBasedMethods = ['Home Delivery', 'Community Group Delivery'];
        if (locationBasedMethods.includes(method) && !requestData.deliveryLocation) {
            errors.push('Delivery location is required for the selected delivery method');
        }
    }

    // Validate preferred date
    if (requestData.deliveryDate || requestData.preferredDate) {
        const dateValue = requestData.deliveryDate || requestData.preferredDate;
        const selectedDate = new Date(dateValue);
        const now = new Date();
        const minDate = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
        const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

        if (isNaN(selectedDate.getTime())) {
            errors.push('Invalid date format');
        } else if (selectedDate < minDate) {
            errors.push('Delivery date must be at least 6 hours from now');
        } else if (selectedDate > maxDate) {
            errors.push('Delivery date must be within the next 60 days');
        }
    }

    // Validate quantity if provided
    if (requestData.quantity !== undefined && requestData.quantity !== null && requestData.quantity !== '') {
        const qty = typeof requestData.quantity === 'number' ? requestData.quantity : parseInt(requestData.quantity);
        if (isNaN(qty) || qty < 1 || qty > 10) {
            errors.push('Quantity must be a number between 1 and 10');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};