/**
 * Unit tests for the Services API Layer
 * Tests all core functionality with mock Supabase responses
 */

import { servicesApi, transformServiceData, transformQuestionData, calculateEligibility, extractCommonFields, validateServiceRequestFile, validateAttachmentUrl, validateDeliveryPreferences, ATTACHMENT_ERROR_MESSAGES } from '../servicesApi';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn()
        }
    }
}));

// Mock error handling utilities
jest.mock('@/utils/errorHandling', () => ({
    handleApiError: jest.fn((error) => error.message),
    logError: jest.fn(),
    validateRequiredFields: jest.fn((obj, fields) => {
        for (const field of fields) {
            if (!obj[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }),
    retryWithBackoff: jest.fn((fn) => fn())
}));

describe('servicesApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getServices', () => {
        it('should fetch services successfully', async () => {
            const mockServices = [
                { id: '1', name: 'HIV Testing', description: 'Quick and confidential', created_at: '2024-01-01' },
                { id: '2', name: 'STI Screening', description: 'Comprehensive screening', created_at: '2024-01-02' }
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockServices, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getServices();

            expect(supabase.from).toHaveBeenCalledWith('services');
            expect(mockQuery.select).toHaveBeenCalledWith('*');
            expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
            expect(result).toEqual(mockServices);
        });

        it('should handle database errors', async () => {
            const mockError = { message: 'Database connection failed' };
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: mockError })
            };

            supabase.from.mockReturnValue(mockQuery);

            await expect(servicesApi.getServices()).rejects.toThrow('Failed to fetch services: Database connection failed');
        });

        it('should return empty array when no services found', async () => {
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: null, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getServices();
            expect(result).toEqual([]);
        });
    });

    describe('getServiceQuestions', () => {
        it('should fetch service questions successfully', async () => {
            const serviceId = 'service-1';
            const mockQuestions = [
                { id: '1', service_id: serviceId, question_text: 'Are you over 18?', question_type: 'yes_no', required: true }
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockQuestions, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getServiceQuestions(serviceId);

            expect(supabase.from).toHaveBeenCalledWith('service_questions');
            expect(mockQuery.eq).toHaveBeenCalledWith('service_id', serviceId);
            expect(result).toEqual(mockQuestions);
        });

        it('should validate required serviceId parameter', async () => {
            await expect(servicesApi.getServiceQuestions()).rejects.toThrow('Missing required field: serviceId');
        });
    });

    describe('getQuestionOptions', () => {
        it('should fetch question options successfully', async () => {
            const questionId = 'question-1';
            const mockOptions = [
                { id: '1', question_id: questionId, option_text: 'Yes', value: 'yes' },
                { id: '2', question_id: questionId, option_text: 'No', value: 'no' }
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockOptions, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getQuestionOptions(questionId);

            expect(supabase.from).toHaveBeenCalledWith('question_options');
            expect(mockQuery.eq).toHaveBeenCalledWith('question_id', questionId);
            expect(result).toEqual(mockOptions);
        });

        it('should validate required questionId parameter', async () => {
            await expect(servicesApi.getQuestionOptions()).rejects.toThrow('Missing required field: questionId');
        });
    });

    describe('saveScreeningAnswers', () => {
        it('should save screening answers successfully', async () => {
            const mockAnswers = [
                { user_id: 'user-1', service_id: 'service-1', question_id: 'question-1', selected_option_id: 'option-1' }
            ];

            const mockQuery = {
                insert: jest.fn().mockResolvedValue({ error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            await servicesApi.saveScreeningAnswers(mockAnswers);

            expect(supabase.from).toHaveBeenCalledWith('user_screening_answers');
            expect(mockQuery.insert).toHaveBeenCalledWith(mockAnswers);
        });

        it('should validate answers array', async () => {
            await expect(servicesApi.saveScreeningAnswers([])).rejects.toThrow('Valid answers array is required');
            await expect(servicesApi.saveScreeningAnswers(null)).rejects.toThrow('Valid answers array is required');
        });
    });

    describe('submitServiceRequest', () => {
        it('should submit service request successfully with extracted fields', async () => {
            const mockRequest = {
                user_id: 'user-1',
                service_id: 'service-1',
                request_data: {
                    deliveryMethod: 'Home Delivery',
                    quantity: '2',
                    counsellingSupport: 'Yes',
                    counsellingChannel: 'Phone Call'
                }
            };

            const mockQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 'request-1' }, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.submitServiceRequest(mockRequest);

            expect(result).toBe('request-1');
            expect(mockQuery.insert).toHaveBeenCalledWith([expect.objectContaining({
                user_id: 'user-1',
                service_id: 'service-1',
                status: 'pending',
                delivery_method: 'Home Delivery',
                quantity: 2,
                counselling_required: true,
                counselling_channel: 'Phone Call',
                created_at: expect.any(String),
                updated_at: expect.any(String)
            })]);
        });

        it('should validate required fields', async () => {
            await expect(servicesApi.submitServiceRequest({})).rejects.toThrow('Missing required field: user_id');
        });

        it('should handle missing request_data', async () => {
            const mockRequest = {
                user_id: 'user-1',
                service_id: 'service-1'
            };

            await expect(servicesApi.submitServiceRequest(mockRequest)).rejects.toThrow('Missing required field: request_data');
        });
    });

    describe('getUserServiceRequests', () => {
        it('should fetch user service requests successfully', async () => {
            const userId = 'user-1';
            const mockRequests = [
                {
                    id: 'req-1',
                    user_id: userId,
                    service_id: 'service-1',
                    status: 'pending',
                    services: { id: 'service-1', name: 'HIV Testing', slug: 'hiv-testing' }
                }
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockRequests, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getUserServiceRequests(userId);

            expect(supabase.from).toHaveBeenCalledWith('service_requests');
            expect(mockQuery.eq).toHaveBeenCalledWith('user_id', userId);
            expect(result).toEqual(mockRequests);
        });

        it('should validate required userId parameter', async () => {
            await expect(servicesApi.getUserServiceRequests()).rejects.toThrow('Missing required field: userId');
        });
    });

    describe('getServiceQuestionsWithOptions', () => {
        it('should fetch questions with options successfully', async () => {
            const serviceId = 'service-1';
            const mockQuestions = [
                { id: 'q1', service_id: serviceId, question_text: 'Are you over 18?', question_type: 'yes_no', required: true }
            ];
            const mockOptions = [
                { id: 'o1', question_id: 'q1', option_text: 'Yes', value: 'yes' },
                { id: 'o2', question_id: 'q1', option_text: 'No', value: 'no' }
            ];

            // Mock the individual API calls
            jest.spyOn(servicesApi, 'getServiceQuestions').mockResolvedValue(mockQuestions);
            jest.spyOn(servicesApi, 'getQuestionOptions').mockResolvedValue(mockOptions);

            const result = await servicesApi.getServiceQuestionsWithOptions(serviceId);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                id: 'q1',
                service_id: serviceId,
                question_text: 'Are you over 18?',
                question_type: 'yes_no',
                required: true,
                options: [
                    { id: 'o1', text: 'Yes', value: 'yes' },
                    { id: 'o2', text: 'No', value: 'no' }
                ]
            });
        });

        it('should validate required serviceId parameter', async () => {
            await expect(servicesApi.getServiceQuestionsWithOptions()).rejects.toThrow('Missing required field: serviceId');
        });
    });

    describe('getServiceQuestionsWithOptionsOptimized', () => {
        it('should fetch questions with options using optimized query', async () => {
            const serviceId = 'service-1';
            const mockData = [
                {
                    id: 'q1',
                    service_id: serviceId,
                    question_text: 'Are you over 18?',
                    question_type: 'yes_no',
                    required: true,
                    question_options: [
                        { id: 'o1', option_text: 'Yes', value: 'yes' },
                        { id: 'o2', option_text: 'No', value: 'no' }
                    ]
                }
            ];

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockData, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getServiceQuestionsWithOptionsOptimized(serviceId);

            expect(supabase.from).toHaveBeenCalledWith('service_questions');
            expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('question_options'));
            expect(mockQuery.eq).toHaveBeenCalledWith('service_id', serviceId);
            expect(result).toHaveLength(1);
            expect(result[0].options).toHaveLength(2);
        });
    });

    describe('getCurrentUser', () => {
        it('should get current user successfully', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

            const result = await servicesApi.getCurrentUser();

            expect(result).toEqual(mockUser);
        });

        it('should handle auth errors', async () => {
            const mockError = { message: 'Invalid token' };
            supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: mockError });

            await expect(servicesApi.getCurrentUser()).rejects.toThrow('Failed to get current user: Invalid token');
        });
    });

    describe('getServiceBySlug', () => {
        it('should fetch service by slug successfully', async () => {
            const slug = 'hiv-testing';
            const mockService = { id: '1', name: 'HIV Testing', slug: 'hiv-testing', description: 'Quick and confidential' };

            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockService, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getServiceBySlug(slug);

            expect(supabase.from).toHaveBeenCalledWith('services');
            expect(mockQuery.eq).toHaveBeenCalledWith('slug', slug);
            expect(result).toEqual(mockService);
        });

        it('should return null when service not found', async () => {
            const slug = 'non-existent';
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.getServiceBySlug(slug);

            expect(result).toBeNull();
        });

        it('should validate required slug parameter', async () => {
            await expect(servicesApi.getServiceBySlug()).rejects.toThrow('Missing required field: slug');
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when user is authenticated', async () => {
            const mockUser = { id: 'user-1' };
            supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

            const result = await servicesApi.isAuthenticated();

            expect(result).toBe(true);
        });

        it('should return false when user is not authenticated', async () => {
            supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

            const result = await servicesApi.isAuthenticated();

            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            supabase.auth.getUser.mockRejectedValue(new Error('Auth error'));

            const result = await servicesApi.isAuthenticated();

            expect(result).toBe(false);
        });
    });
});

describe('Data Transformation Utilities', () => {
    describe('transformServiceData', () => {
        it('should transform service data correctly', () => {
            const dbService = {
                id: '1',
                name: 'HIV Testing',
                description: 'Quick and confidential'
            };

            const result = transformServiceData(dbService);

            expect(result).toEqual({
                id: '1',
                title: 'HIV Testing',
                desc: 'Quick and confidential',
                category: 'routine',
                color: 'blue',
                icon: 'Heart'
            });
        });

        it('should preserve existing category, color, and icon', () => {
            const dbService = {
                id: '1',
                name: 'HIV Testing',
                description: 'Quick and confidential',
                category: 'urgent',
                color: 'red',
                icon: 'Shield'
            };

            const result = transformServiceData(dbService);

            expect(result.category).toBe('urgent');
            expect(result.color).toBe('red');
            expect(result.icon).toBe('Shield');
        });
    });

    describe('transformQuestionData', () => {
        it('should transform question data correctly', () => {
            const dbQuestion = {
                id: '1',
                service_id: 'service-1',
                question_text: 'Are you over 18?',
                question_type: 'yes_no',
                required: true
            };

            const dbOptions = [
                { id: '1', option_text: 'Yes', value: 'yes' },
                { id: '2', option_text: 'No', value: 'no' }
            ];

            const result = transformQuestionData(dbQuestion, dbOptions);

            expect(result).toEqual({
                id: '1',
                service_id: 'service-1',
                question_text: 'Are you over 18?',
                question_type: 'yes_no',
                required: true,
                options: [
                    { id: '1', text: 'Yes', value: 'yes' },
                    { id: '2', text: 'No', value: 'no' }
                ]
            });
        });
    });

    describe('calculateEligibility', () => {
        it('should return eligible when any answer is yes', () => {
            const answers = { 0: 'no', 1: 'yes', 2: 'no' };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: true,
                score: 33 // 1 yes out of 3 answers = 33%
            });
        });

        it('should return not eligible when all answers are no', () => {
            const answers = { 0: 'no', 1: 'no', 2: 'no' };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: false,
                score: 0
            });
        });

        it('should handle boolean values', () => {
            const answers = { 0: false, 1: true, 2: false };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: true,
                score: 33 // 1 true out of 3 answers = 33%
            });
        });

        it('should handle mixed case', () => {
            const answers = { 0: 'No', 1: 'Yes', 2: 'no' };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: true,
                score: 33 // 1 Yes out of 3 answers = 33%
            });
        });

        it('should calculate correct percentage for multiple yes answers', () => {
            const answers = { 0: 'yes', 1: 'yes', 2: 'no', 3: 'yes', 4: 'no' };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: true,
                score: 60 // 3 yes out of 5 answers = 60%
            });
        });

        it('should handle all yes answers', () => {
            const answers = { 0: 'yes', 1: 'yes', 2: 'yes' };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: true,
                score: 100 // 3 yes out of 3 answers = 100%
            });
        });

        it('should handle empty answers object', () => {
            const answers = {};
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: false,
                score: 0
            });
        });
    });

    describe('extractCommonFields', () => {
        it('should extract common fields from request data', () => {
            const requestData = {
                deliveryMethod: 'Home Delivery',
                deliveryLocation: { address: '123 Main St', coordinates: { lat: 1, lng: 2 } },
                deliveryDate: '2024-12-01T10:00:00Z',
                quantity: '3',
                counsellingSupport: 'Yes',
                counsellingChannel: 'Phone Call'
            };

            const result = extractCommonFields(requestData);

            expect(result).toEqual({
                delivery_method: 'Home Delivery',
                delivery_location: { address: '123 Main St', coordinates: { lat: 1, lng: 2 } },
                preferred_date: '2024-12-01T10:00:00Z',
                quantity: 3,
                counselling_required: true,
                counselling_channel: 'Phone Call'
            });
        });

        it('should handle alternative field names', () => {
            const requestData = {
                accessPoint: 'Facility pickup',
                preferredDate: '2024-12-01T10:00:00Z',
                counsellingSupport: 'No'
            };

            const result = extractCommonFields(requestData);

            expect(result).toEqual({
                delivery_method: 'Facility pickup',
                delivery_location: null,
                preferred_date: '2024-12-01T10:00:00Z',
                quantity: null,
                counselling_required: false,
                counselling_channel: null
            });
        });

        it('should handle empty or invalid data', () => {
            const result1 = extractCommonFields(null);
            const result2 = extractCommonFields({});

            const expectedEmpty = {
                delivery_method: null,
                delivery_location: null,
                preferred_date: null,
                quantity: null,
                counselling_required: null,
                counselling_channel: null
            };

            expect(result1).toEqual(expectedEmpty);
            expect(result2).toEqual(expectedEmpty);
        });
    });

    describe('validateServiceRequestFile', () => {
        it('should validate valid PDF file', () => {
            const mockFile = {
                type: 'application/pdf',
                size: 1024 * 1024 // 1MB
            };

            expect(() => validateServiceRequestFile(mockFile)).not.toThrow();
        });

        it('should validate valid image file', () => {
            const mockFile = {
                type: 'image/jpeg',
                size: 2 * 1024 * 1024 // 2MB
            };

            expect(() => validateServiceRequestFile(mockFile)).not.toThrow();
        });

        it('should reject invalid file type with detailed message', () => {
            const mockFile = {
                type: 'text/plain',
                size: 1024
            };

            expect(() => validateServiceRequestFile(mockFile)).toThrow('Please upload PDF, JPEG, or PNG files only');
        });

        it('should reject oversized file with detailed message', () => {
            const mockFile = {
                type: 'application/pdf',
                size: 6 * 1024 * 1024 // 6MB (over 5MB limit)
            };

            expect(() => validateServiceRequestFile(mockFile)).toThrow('File size must be under 5MB');
        });

        it('should reject null file', () => {
            expect(() => validateServiceRequestFile(null)).toThrow('No file provided');
        });

        it('should reject corrupted file (missing properties)', () => {
            const mockFile = {
                type: 'application/pdf'
                // Missing size property
            };

            expect(() => validateServiceRequestFile(mockFile)).toThrow('File appears to be corrupted');
        });

        it('should reject empty file', () => {
            const mockFile = {
                type: 'application/pdf',
                size: 0
            };

            expect(() => validateServiceRequestFile(mockFile)).toThrow('File appears to be corrupted');
        });
    });

    describe('validateAttachmentUrl', () => {
        it('should validate valid HTTPS URL', () => {
            const validUrl = 'https://example.com/storage/v1/object/public/attachments/file.pdf';
            expect(() => validateAttachmentUrl(validUrl)).not.toThrow();
        });

        it('should validate valid HTTP URL', () => {
            const validUrl = 'http://example.com/file.pdf';
            expect(() => validateAttachmentUrl(validUrl)).not.toThrow();
        });

        it('should reject invalid URL format', () => {
            const invalidUrl = 'not-a-url';
            expect(() => validateAttachmentUrl(invalidUrl)).toThrow('Invalid attachment URL');
        });

        it('should reject non-HTTP protocols', () => {
            const invalidUrl = 'ftp://example.com/file.pdf';
            expect(() => validateAttachmentUrl(invalidUrl)).toThrow('Invalid attachment URL');
        });

        it('should reject null or undefined URL', () => {
            expect(() => validateAttachmentUrl(null)).toThrow('Invalid attachment URL');
            expect(() => validateAttachmentUrl(undefined)).toThrow('Invalid attachment URL');
        });

        it('should reject non-string URL', () => {
            expect(() => validateAttachmentUrl(123)).toThrow('Invalid attachment URL');
        });
    });

    describe('validateDeliveryPreferences', () => {
        it('should validate valid delivery preferences', () => {
            const validData = {
                deliveryMethod: 'Home Delivery',
                deliveryLocation: { address: '123 Main St' },
                deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
                quantity: '2'
            };

            const result = validateDeliveryPreferences(validData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid delivery method', () => {
            const invalidData = {
                deliveryMethod: 'Invalid Method'
            };

            const result = validateDeliveryPreferences(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid delivery method: Invalid Method');
        });

        it('should require location for location-based delivery', () => {
            const invalidData = {
                deliveryMethod: 'Home Delivery'
                // Missing deliveryLocation
            };

            const result = validateDeliveryPreferences(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Delivery location is required for the selected delivery method');
        });

        it('should reject dates too soon', () => {
            const invalidData = {
                deliveryDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
            };

            const result = validateDeliveryPreferences(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Delivery date must be at least 6 hours from now');
        });

        it('should reject dates too far in future', () => {
            const invalidData = {
                deliveryDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString() // 70 days from now
            };

            const result = validateDeliveryPreferences(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Delivery date must be within the next 60 days');
        });

        it('should reject invalid quantity', () => {
            const invalidData = {
                quantity: '15' // Too high
            };

            const result = validateDeliveryPreferences(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Quantity must be a number between 1 and 10');
        });
    });
});