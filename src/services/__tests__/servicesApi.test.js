/**
 * Unit tests for the Services API Layer
 * Tests all core functionality with mock Supabase responses
 */

import { servicesApi, transformServiceData, transformQuestionData, calculateEligibility } from '../servicesApi';
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
        it('should submit service request successfully', async () => {
            const mockRequest = {
                user_id: 'user-1',
                service_id: 'service-1',
                request_data: { test: 'data' }
            };

            const mockQuery = {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 'request-1' }, error: null })
            };

            supabase.from.mockReturnValue(mockQuery);

            const result = await servicesApi.submitServiceRequest(mockRequest);

            expect(result).toBe('request-1');
            expect(mockQuery.insert).toHaveBeenCalledWith([{
                ...mockRequest,
                status: 'pending',
                created_at: expect.any(String)
            }]);
        });

        it('should validate required fields', async () => {
            await expect(servicesApi.submitServiceRequest({})).rejects.toThrow('Missing required field: user_id');
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
                score: 100
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
                score: 100
            });
        });

        it('should handle mixed case', () => {
            const answers = { 0: 'No', 1: 'Yes', 2: 'no' };
            const result = calculateEligibility(answers);

            expect(result).toEqual({
                eligible: true,
                score: 100
            });
        });
    });
});