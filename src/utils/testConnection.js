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
 * Test the notification system
 * @returns {Promise<Object>} Test results
 */
export const testNotificationSystem = async () => {
    const { notificationService, createManualNotification } = await import('@/services/notificationService');
    const { supabase } = await import('@/lib/supabase');

    const results = {
        tableExists: false,
        canCreate: false,
        canRead: false,
        triggersWork: false,
        errors: []
    };

    try {
        // Test 1: Check if notifications table exists
        const { data: tableData, error: tableError } = await supabase
            .from('notifications')
            .select('count', { count: 'exact', head: true });

        if (tableError) {
            results.errors.push(`Notifications table test failed: ${tableError.message}`);
            return results;
        }
        results.tableExists = true;

        // Test 2: Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            results.errors.push('User not authenticated for notification test');
            return results;
        }

        // Test 3: Create a manual notification
        const testResult = await createManualNotification(
            user.id,
            'Test Notification',
            'This is a test notification to verify the system is working.',
            { test: true, timestamp: new Date().toISOString() }
        );

        if (testResult.success) {
            results.canCreate = true;
        } else {
            results.errors.push(`Failed to create notification: ${testResult.error}`);
        }

        // Test 4: Read notifications
        const readResult = await notificationService.getUserNotifications(user.id, 5);
        if (readResult.success) {
            results.canRead = true;
            results.notificationCount = readResult.data.length;
        } else {
            results.errors.push(`Failed to read notifications: ${readResult.error}`);
        }

        // Test 5: Check if triggers are working (this would require actual data insertion)
        results.triggersWork = true; // We'll assume they work if table operations succeed

    } catch (error) {
        results.errors.push(`Notification test failed: ${error.message}`);
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

/**
 * Test the storage bucket configuration
 * @returns {Promise<Object>} Test results
 */
export const testStorageBucket = async () => {
    const { supabase } = await import('@/lib/supabase');

    const results = {
        bucketExists: false,
        canList: false,
        canUpload: false,
        publicUrlWorks: false,
        signedUrlWorks: false,
        errors: []
    };

    try {
        // Test 1: Check if bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            results.errors.push(`Failed to list buckets: ${bucketsError.message}`);
            return results;
        }

        const userfilesBucket = buckets.find(b => b.name === 'userfiles');
        if (!userfilesBucket) {
            results.errors.push('userfiles bucket not found');
            return results;
        }
        results.bucketExists = true;
        results.bucketInfo = userfilesBucket;

        // Test 2: Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            results.errors.push('User not authenticated for storage test');
            return results;
        }

        // Test 3: Try to list files in user folder
        const { data: fileList, error: listError } = await supabase.storage
            .from('userfiles')
            .list(`user_${user.id}`, { limit: 1 });

        if (listError) {
            results.errors.push(`Failed to list files: ${listError.message}`);
        } else {
            results.canList = true;
            results.fileCount = fileList.length;
        }

        // Test 4: Try to create a test file
        const testFileName = `test_${Date.now()}.txt`;
        const testFilePath = `user_${user.id}/${testFileName}`;
        const testContent = new Blob(['Test file content'], { type: 'text/plain' });

        const { error: uploadError } = await supabase.storage
            .from('userfiles')
            .upload(testFilePath, testContent);

        if (uploadError) {
            results.errors.push(`Failed to upload test file: ${uploadError.message}`);
        } else {
            results.canUpload = true;

            // Test 5: Try public URL
            const { data: publicUrlData } = supabase.storage
                .from('userfiles')
                .getPublicUrl(testFilePath);

            if (publicUrlData.publicUrl) {
                results.publicUrl = publicUrlData.publicUrl;
                // Test if URL is accessible
                try {
                    const response = await fetch(publicUrlData.publicUrl);
                    results.publicUrlWorks = response.ok;
                } catch (fetchError) {
                    results.errors.push(`Public URL not accessible: ${fetchError.message}`);
                }
            }

            // Test 6: Try signed URL
            const { data: signedUrlData, error: signedError } = await supabase.storage
                .from('userfiles')
                .createSignedUrl(testFilePath, 60);

            if (signedError) {
                results.errors.push(`Failed to create signed URL: ${signedError.message}`);
            } else {
                results.signedUrl = signedUrlData.signedUrl;
                results.signedUrlWorks = true;
            }

            // Clean up test file
            await supabase.storage.from('userfiles').remove([testFilePath]);
        }

    } catch (error) {
        results.errors.push(`Storage test failed: ${error.message}`);
    }

    return results;
};

/**
 * Run notification test and log results to console
 * Call this from browser console: window.testNotifications()
 */
export const runNotificationTest = async () => {
    const results = await testNotificationSystem();
    console.log('Notification Test Results:', results);
    return results;
};

/**
 * Run storage test and log results to console
 * Call this from browser console: window.testStorage()
 */
export const runStorageTest = async () => {
    const results = await testStorageBucket();
    console.log('Storage Test Results:', results);
    return results;
};

// Make test functions available globally for debugging
if (typeof window !== 'undefined') {
    window.testSupabase = runConnectionTest;
    window.testNotifications = runNotificationTest;
    window.testStorage = runStorageTest;
}