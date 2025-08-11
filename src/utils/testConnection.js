/**
 * Utility to test Supabase connection
 * Use this to verify your database setup is working
 */

import { servicesApi } from '@/services/servicesApi';
import { testDirectConnection } from '@/lib/supabase';

/**
 * Test the Supabase connection and database setup
 * @returns {Promise<Object>} Test results
 */
export const testSupabaseConnection = async () => {
    const results = {
        connection: false,
        services: false,
        questions: false,
        options: false,
        errors: []
    };

    try {
        // Test 0: Direct connection test
        const directTest = await testDirectConnection();
        if (!directTest.success) {
            results.errors.push(`Direct connection failed: ${directTest.error}`);
            return results;
        }

        // Test 1: Fetch services
        try {
            const services = await servicesApi.getServices();
            results.services = true;

            if (services.length === 0) {
                results.errors.push('No services found in database. Run the database-setup.sql script.');
            }

            // Test 2: Fetch questions for first service
            if (services.length > 0) {
                try {
                    const questions = await servicesApi.getServiceQuestions(services[0].id);
                    results.questions = true;

                    if (questions.length === 0) {
                        results.errors.push('No questions found for services. Check service_questions table.');
                    }

                    // Test 3: Fetch options for first question
                    if (questions.length > 0) {
                        try {
                            const options = await servicesApi.getQuestionOptions(questions[0].id);
                            results.options = true;

                            if (options.length === 0) {
                                results.errors.push('No options found for questions. Check question_options table.');
                            }
                        } catch (error) {
                            results.errors.push(`Question options test failed: ${error.message}`);
                        }
                    }
                } catch (error) {
                    results.errors.push(`Service questions test failed: ${error.message}`);
                }
            }
        } catch (error) {
            results.errors.push(`Services test failed: ${error.message}`);
        }

        results.connection = results.services;

        // Test completed

    } catch (error) {
        results.errors.push(`Connection test failed: ${error.message}`);
    }

    return results;
};

/**
 * Run connection test and log results to console
 * Call this from browser console: window.testSupabase()
 */
export const runConnectionTest = async () => {
    const results = await testSupabaseConnection();
    return results;
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
    window.testSupabase = runConnectionTest;
}