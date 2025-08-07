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
        console.log('🔍 Testing Supabase connection...');

        // Test 0: Direct connection test
        const directTest = await testDirectConnection();
        if (!directTest.success) {
            results.errors.push(`Direct connection failed: ${directTest.error}`);
            console.error('❌ Direct connection failed:', directTest.error);
            return results;
        }

        // Test 1: Fetch services
        try {
            const services = await servicesApi.getServices();
            results.services = true;
            console.log('✅ Services table accessible:', services.length, 'services found');

            if (services.length === 0) {
                results.errors.push('No services found in database. Run the database-setup.sql script.');
            }

            // Test 2: Fetch questions for first service
            if (services.length > 0) {
                try {
                    const questions = await servicesApi.getServiceQuestions(services[0].id);
                    results.questions = true;
                    console.log('✅ Service questions table accessible:', questions.length, 'questions found');

                    if (questions.length === 0) {
                        results.errors.push('No questions found for services. Check service_questions table.');
                    }

                    // Test 3: Fetch options for first question
                    if (questions.length > 0) {
                        try {
                            const options = await servicesApi.getQuestionOptions(questions[0].id);
                            results.options = true;
                            console.log('✅ Question options table accessible:', options.length, 'options found');

                            if (options.length === 0) {
                                results.errors.push('No options found for questions. Check question_options table.');
                            }
                        } catch (error) {
                            results.errors.push(`Question options test failed: ${error.message}`);
                            console.error('❌ Question options test failed:', error);
                        }
                    }
                } catch (error) {
                    results.errors.push(`Service questions test failed: ${error.message}`);
                    console.error('❌ Service questions test failed:', error);
                }
            }
        } catch (error) {
            results.errors.push(`Services test failed: ${error.message}`);
            console.error('❌ Services test failed:', error);
        }

        results.connection = results.services;

        if (results.connection && results.errors.length === 0) {
            console.log('🎉 All tests passed! Your Supabase setup is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the errors above.');
        }

    } catch (error) {
        results.errors.push(`Connection test failed: ${error.message}`);
        console.error('❌ Connection test failed:', error);
    }

    return results;
};

/**
 * Run connection test and log results to console
 * Call this from browser console: window.testSupabase()
 */
export const runConnectionTest = async () => {
    const results = await testSupabaseConnection();

    console.log('\n📊 Test Results Summary:');
    console.log('Connection:', results.connection ? '✅' : '❌');
    console.log('Services:', results.services ? '✅' : '❌');
    console.log('Questions:', results.questions ? '✅' : '❌');
    console.log('Options:', results.options ? '✅' : '❌');

    if (results.errors.length > 0) {
        console.log('\n🚨 Errors:');
        results.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }

    return results;
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
    window.testSupabase = runConnectionTest;
}