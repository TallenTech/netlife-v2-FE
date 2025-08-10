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
     * Upload file attachment for service request
     * @param {File} file - The file to upload
     * @param {string} userId - The user ID for file organization
     * @returns {Promise<FileAttachment>} The uploaded file information
     */
    async uploadServiceRequestAttachment(file, userId) {
        try {
            validateRequiredFields({ file, userId }, ['file', 'userId']);

            // Validate file type and size
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            const maxSize = 10 * 1024 * 1024; // 10MB

            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
            }

            if (file.size > maxSize) {
                throw new Error('File size too large. Maximum size is 10MB.');
            }

            // Generate unique filename
            const fileExtension = file.name.split('.').pop();
            const uniqueFilename = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
            const storagePath = `service-request-attachments/${uniqueFilename}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(storagePath, file);

            if (uploadError) {
                throw new Error(`Failed to upload file: ${uploadError.message}`);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(storagePath);

            // Return file attachment object
            return {
                id: uploadData.path,
                filename: file.name,
                file_type: file.type,
                file_size: file.size,
                storage_path: storagePath,
                public_url: publicUrl,
                uploaded_at: new Date().toISOString()
            };
        } catch (error) {
            logError(error, 'servicesApi.uploadServiceRequestAttachment', { fileName: file?.name, userId });
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
    const answerValues = Object.values(answers);
    const totalQuestions = answerValues.length;

    if (totalQuestions === 0) {
        return {
            eligible: false,
            score: 0
        };
    }

    // Count "yes" answers (various formats)
    const yesAnswers = answerValues.filter(answer =>
        answer === 'yes' || answer === true || answer === 'Yes' || answer === 'YES'
    ).length;

    // Calculate realistic percentage score
    const score = Math.round((yesAnswers / totalQuestions) * 100);

    // Eligibility: at least one "yes" answer
    const hasYesAnswer = yesAnswers > 0;

    return {
        eligible: hasYesAnswer,
        score: score
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
            console.warn(`Invalid delivery method: ${extracted.delivery_method}`);
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
            console.warn(`Invalid preferred date: ${dateValue}. Must be between 6 hours and 60 days from now.`);
            extracted.preferred_date = null;
        }
    }

    // Extract quantity
    if (requestData.quantity && !isNaN(parseInt(requestData.quantity))) {
        extracted.quantity = parseInt(requestData.quantity);
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
    if (requestData.quantity) {
        const qty = parseInt(requestData.quantity);
        if (isNaN(qty) || qty < 1 || qty > 10) {
            errors.push('Quantity must be a number between 1 and 10');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};