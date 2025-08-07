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
     * Submit a service request to the database
     * @param {ServiceRequest} request - The service request object
     * @returns {Promise<string>} The ID of the created request
     */
    async submitServiceRequest(request) {
        try {
            validateRequiredFields(request, ['user_id', 'service_id']);

            // Set default status if not provided
            const requestData = {
                ...request,
                status: request.status || 'pending',
                created_at: new Date().toISOString()
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
            logError(error, 'servicesApi.submitServiceRequest', { request });
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
    // Simple eligibility logic: ANY "yes" answer = eligible
    const hasYesAnswer = Object.values(answers).some(answer =>
        answer === 'yes' || answer === true || answer === 'Yes'
    );

    return {
        eligible: hasYesAnswer,
        score: hasYesAnswer ? 100 : 0
    };
};