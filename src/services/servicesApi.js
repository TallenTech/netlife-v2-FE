import { supabase } from '@/lib/supabase';
import { handleApiError, logError, validateRequiredFields, retryWithBackoff } from '@/utils/errorHandling';


/**
 * Enhanced attachment processing with robust error handling and retry logic
 * @param {File|Blob|string|null} file - The file to upload (or URL if already uploaded)
 * @param {string} userId - User ID for naming
 * @param {Object} options - Processing options
 * @param {number} options.retryCount - Number of retry attempts (default: 1)
 * @param {boolean} options.validateUrl - Whether to validate existing URLs (default: true)
 * @param {boolean} options.includeMetadata - Whether to include file metadata (default: false)
 * @returns {Promise<AttachmentResult>} Result object with URL and metadata
 */
async function _processAttachment(file, userId, options = {}) {
    const {
        retryCount = 1,
        validateUrl = true,
        includeMetadata = false
    } = options;

    const startTime = Date.now();
    let uploadedFilePath = null;

    try {
        // Handle null/undefined files gracefully
        if (!file) {
            return { url: null, metadata: null };
        }

        // Handle existing URL strings
        if (typeof file === 'string' && file.startsWith('http')) {
            if (validateUrl) {
                try {
                    validateAttachmentUrl(file);
                } catch (urlError) {
                    logError(urlError, '_processAttachment', { userId, action: 'URL validation failed', url: file });
                    throw new Error(ATTACHMENT_ERROR_MESSAGES.INVALID_URL);
                }
            }

            return {
                url: file,
                metadata: includeMetadata ? {
                    type: 'existing_url',
                    processedAt: new Date().toISOString(),
                    processingTime: Date.now() - startTime
                } : null
            };
        }

        // Validate file object
        if (!(file instanceof File || file instanceof Blob)) {
            throw new Error(ATTACHMENT_ERROR_MESSAGES.PROCESSING_FAILED);
        }

        // Validate file before processing
        try {
            validateServiceRequestFile(file);
        } catch (validationError) {
            logError(validationError, '_processAttachment', { userId, action: 'File validation failed' });
            throw validationError; // Re-throw validation errors as-is
        }

        // Create unique file path with better naming
        const ext = file.name ? file.name.split('.').pop().toLowerCase() : 'dat';
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `${timestamp}_${randomSuffix}.${ext}`;
        const filePath = `user_${userId}/${fileName}`;
        uploadedFilePath = filePath; // Store for cleanup if needed

        // Upload with retry logic
        let uploadError = null;
        let uploadSuccess = false;

        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                const { error } = await supabase.storage
                    .from('attachments')
                    .upload(filePath, file, {
                        upsert: false,
                        cacheControl: '3600'
                    });

                if (error) {
                    uploadError = error;

                    // Check if it's a retryable error
                    const isRetryable = _isRetryableError(error);

                    if (!isRetryable || attempt === retryCount) {
                        throw error;
                    }

                    // Wait before retry (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                uploadSuccess = true;
                break;
            } catch (error) {
                uploadError = error;
                if (attempt === retryCount) {
                    throw error;
                }
            }
        }

        if (!uploadSuccess) {
            throw uploadError || new Error('Upload failed after retries');
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) {
            throw new Error('Failed to generate public URL');
        }

        // Upload successful

        // Prepare result
        const result = {
            url: publicUrl,
            metadata: includeMetadata ? {
                originalName: file.name || 'unknown',
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                path: filePath,
                processingTime: Date.now() - startTime
            } : null
        };

        return result;

    } catch (error) {
        // Enhanced error logging
        logError(error, '_processAttachment', {
            userId,
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type,
            processingTime: Date.now() - startTime,
            uploadedFilePath
        });

        // Attempt cleanup if file was uploaded but processing failed
        if (uploadedFilePath) {
            try {
                await _cleanupUploadedFile(uploadedFilePath);
            } catch (cleanupError) {
                logError(cleanupError, '_processAttachment cleanup', { userId, filePath: uploadedFilePath });
            }
        }

        // Return graceful degradation result instead of throwing
        return {
            url: null,
            metadata: null,
            error: _getUserFriendlyErrorMessage(error)
        };
    }
}

/**
 * Check if an error is retryable (network issues, temporary server errors)
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is retryable
 */
function _isRetryableError(error) {
    if (!error) return false;

    const retryableMessages = [
        'network',
        'timeout',
        'connection',
        'temporary',
        'rate limit',
        'service unavailable',
        '503',
        '502',
        '504'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
}

/**
 * Get user-friendly error message from technical error
 * @param {Error} error - The technical error
 * @returns {string} User-friendly error message
 */
function _getUserFriendlyErrorMessage(error) {
    if (!error) return ATTACHMENT_ERROR_MESSAGES.PROCESSING_FAILED;

    const message = error.message?.toLowerCase() || '';

    if (message.includes('file size') || message.includes('too large')) {
        return ATTACHMENT_ERROR_MESSAGES.FILE_TOO_LARGE;
    }

    if (message.includes('file type') || message.includes('invalid')) {
        return ATTACHMENT_ERROR_MESSAGES.INVALID_FILE_TYPE;
    }

    if (message.includes('network') || message.includes('connection')) {
        return 'Upload failed due to network issues. Please check your connection and try again.';
    }

    if (message.includes('storage') || message.includes('quota')) {
        return 'Storage limit reached. Please contact support or try a smaller file.';
    }

    return ATTACHMENT_ERROR_MESSAGES.PROCESSING_FAILED;
}

/**
 * Clean up uploaded file if processing fails
 * @param {string} filePath - Path of the file to clean up
 */
async function _cleanupUploadedFile(filePath) {
    try {
        await supabase.storage
            .from('attachments')
            .remove([filePath]);

        logError(null, '_cleanupUploadedFile', { action: 'File cleaned up', filePath });
    } catch (error) {
        logError(error, '_cleanupUploadedFile', { action: 'Cleanup failed', filePath });
        // Don't throw - cleanup is best effort
    }
}

/**
 * Enhanced cleanup mechanisms for attachment management
 */

/**
 * Clean up multiple uploaded files (batch cleanup)
 * @param {string[]} filePaths - Array of file paths to clean up
 * @param {string} userId - User ID for logging
 * @returns {Promise<CleanupResult>} Cleanup result with success/failure counts
 */
async function _cleanupMultipleFiles(filePaths, userId) {
    if (!filePaths || filePaths.length === 0) {
        return { success: 0, failed: 0, errors: [] };
    }

    const results = { success: 0, failed: 0, errors: [] };

    try {
        // Batch remove files
        const { error } = await supabase.storage
            .from('attachments')
            .remove(filePaths);

        if (error) {
            results.failed = filePaths.length;
            results.errors.push(error.message);
            logError(error, '_cleanupMultipleFiles', { userId, filePaths, action: 'Batch cleanup failed' });
        } else {
            results.success = filePaths.length;
            logError(null, '_cleanupMultipleFiles', { userId, filePaths, action: 'Batch cleanup successful' });
        }
    } catch (error) {
        results.failed = filePaths.length;
        results.errors.push(error.message);
        logError(error, '_cleanupMultipleFiles', { userId, filePaths, action: 'Batch cleanup error' });
    }

    return results;
}

/**
 * Clean up attachment when service request submission fails
 * @param {string} attachmentUrl - The attachment URL to extract path from
 * @param {string} userId - User ID for logging
 * @returns {Promise<boolean>} Whether cleanup was successful
 */
async function _cleanupFailedRequestAttachment(attachmentUrl, userId) {
    if (!attachmentUrl || typeof attachmentUrl !== 'string') {
        return true; // Nothing to clean up
    }

    try {
        // Extract file path from Supabase public URL
        const filePath = _extractFilePathFromUrl(attachmentUrl);
        if (!filePath) {
            logError(null, '_cleanupFailedRequestAttachment', {
                userId,
                attachmentUrl,
                action: 'Could not extract file path from URL'
            });
            return false;
        }

        await _cleanupUploadedFile(filePath);

        logError(null, '_cleanupFailedRequestAttachment', {
            userId,
            attachmentUrl,
            filePath,
            action: 'Failed request attachment cleaned up'
        });

        return true;
    } catch (error) {
        logError(error, '_cleanupFailedRequestAttachment', { userId, attachmentUrl });
        return false;
    }
}

/**
 * Extract file path from Supabase public URL
 * @param {string} publicUrl - The public URL from Supabase storage
 * @returns {string|null} The file path or null if extraction fails
 */
function _extractFilePathFromUrl(publicUrl) {
    try {
        const url = new URL(publicUrl);
        const pathParts = url.pathname.split('/');

        // Supabase storage URLs have format: /storage/v1/object/public/bucket/path
        const publicIndex = pathParts.indexOf('public');
        if (publicIndex === -1 || publicIndex + 2 >= pathParts.length) {
            return null;
        }

        // Skip 'public' and bucket name, get the rest as file path
        const filePath = pathParts.slice(publicIndex + 2).join('/');
        return filePath || null;
    } catch (error) {
        return null;
    }
}

/**
 * Detect and clean up orphaned files (files uploaded but not referenced in database)
 * @param {string} userId - User ID to check orphaned files for
 * @param {number} olderThanHours - Clean files older than this many hours (default: 24)
 * @returns {Promise<CleanupResult>} Cleanup result
 */
async function _cleanupOrphanedFiles(userId, olderThanHours = 24) {
    try {
        const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));

        // List files in user's directory
        const { data: files, error: listError } = await supabase.storage
            .from('attachments')
            .list(`user_${userId}`, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'asc' }
            });

        if (listError) {
            throw listError;
        }

        if (!files || files.length === 0) {
            return { success: 0, failed: 0, errors: [] };
        }

        // Filter files older than cutoff time
        const oldFiles = files.filter(file => {
            const fileDate = new Date(file.created_at);
            return fileDate < cutoffTime;
        });

        if (oldFiles.length === 0) {
            return { success: 0, failed: 0, errors: [] };
        }

        // Get all attachment URLs from service requests for this user
        const { data: requests, error: dbError } = await supabase
            .from('service_requests')
            .select('attachments')
            .eq('user_id', userId)
            .not('attachments', 'is', null);

        if (dbError) {
            logError(dbError, '_cleanupOrphanedFiles', { userId, action: 'Failed to fetch service requests' });
            return { success: 0, failed: 1, errors: [dbError.message] };
        }

        // Extract file paths from database URLs
        const referencedPaths = new Set();
        if (requests) {
            requests.forEach(request => {
                if (request.attachments) {
                    const path = _extractFilePathFromUrl(request.attachments);
                    if (path) {
                        referencedPaths.add(path);
                    }
                }
            });
        }

        // Find orphaned files (old files not referenced in database)
        const orphanedFiles = oldFiles.filter(file => {
            const filePath = `user_${userId}/${file.name}`;
            return !referencedPaths.has(filePath);
        });

        if (orphanedFiles.length === 0) {
            return { success: 0, failed: 0, errors: [] };
        }

        // Clean up orphaned files
        const orphanedPaths = orphanedFiles.map(file => `user_${userId}/${file.name}`);
        const cleanupResult = await _cleanupMultipleFiles(orphanedPaths, userId);

        logError(null, '_cleanupOrphanedFiles', {
            userId,
            totalFiles: files.length,
            oldFiles: oldFiles.length,
            orphanedFiles: orphanedFiles.length,
            cleanupResult,
            action: 'Orphaned files cleanup completed'
        });

        return cleanupResult;
    } catch (error) {
        logError(error, '_cleanupOrphanedFiles', { userId, olderThanHours });
        return { success: 0, failed: 1, errors: [error.message] };
    }
}


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
    // async submitServiceRequest(request) {
    //     try {
    //         validateRequiredFields(request, ['user_id', 'service_id', 'request_data']);

    //         // Validate delivery preferences
    //         const validation = validateDeliveryPreferences(request.request_data);
    //         if (!validation.isValid) {
    //             throw new Error(`Invalid delivery preferences: ${validation.errors.join(', ')}`);
    //         }

    //         // Extract common fields from request_data for easier querying
    //         const extractedFields = extractCommonFields(request.request_data);

    //         // Prepare the complete request data
    //         const requestData = {
    //             user_id: request.user_id,
    //             service_id: request.service_id,
    //             status: request.status || 'pending',
    //             request_data: request.request_data,

    //             // Extracted common fields
    //             delivery_method: extractedFields.delivery_method,
    //             delivery_location: extractedFields.delivery_location,
    //             preferred_date: extractedFields.preferred_date,
    //             quantity: extractedFields.quantity,
    //             counselling_required: extractedFields.counselling_required,
    //             counselling_channel: extractedFields.counselling_channel,

    //             // File attachments
    //             attachments: request.attachments || null,

    //             // Timestamps
    //             created_at: new Date().toISOString(),
    //             updated_at: new Date().toISOString()
    //         };

    //         const { data, error } = await supabase
    //             .from('service_requests')
    //             .insert([requestData])
    //             .select('id')
    //             .single();

    //         if (error) {
    //             // Provide more specific error messages for common issues
    //             let errorMessage = `Failed to submit service request: ${error.message}`;

    //             if (error.message.includes('invalid input syntax for type uuid')) {
    //                 errorMessage = `Invalid user ID format. Please ensure the user ID is a valid UUID.`;
    //             } else if (error.message.includes('violates foreign key constraint')) {
    //                 errorMessage = `User not found in database. Please ensure the test user exists in the profiles table.`;
    //             } else if (error.message.includes('null value in column')) {
    //                 errorMessage = `Missing required field: ${error.message}`;
    //             } else if (error.message.includes('row level security policy')) {
    //                 errorMessage = `Row Level Security is blocking the operation. For testing, you may need to disable RLS on the service_requests table. See FIX_RLS_FOR_TESTING.sql for solutions.`;
    //             }

    //             throw new Error(errorMessage);
    //         }

    //         return data.id;
    //     } catch (error) {
    //         logError(error, 'servicesApi.submitServiceRequest', { request });
    //         throw new Error(handleApiError(error));
    //     }
    // },

    async submitServiceRequest(request) {
        let attachmentResult = null;

        try {
            validateRequiredFields(request, ['user_id', 'service_id', 'request_data']);

            // Process attachment using standardized configuration
            attachmentResult = await _processAttachmentStandardized(
                request.attachments,
                request.user_id,
                'STANDARD'
            );

            // Validate and handle attachment result using standardized functions
            _validateAttachmentResultConsistency('submitServiceRequest', attachmentResult);
            _handleAttachmentResult(attachmentResult, request.user_id, 'servicesApi.submitServiceRequest');

            // Validate delivery preferences
            const validation = validateDeliveryPreferences(request.request_data);
            if (!validation.isValid) {
                throw new Error(`Invalid delivery preferences: ${validation.errors.join(', ')}`);
            }

            // Extract common fields from request_data
            const extractedFields = extractCommonFields(request.request_data);

            const requestData = {
                user_id: request.user_id,
                service_id: request.service_id,
                status: request.status || 'pending',
                request_data: request.request_data,
                attachments: attachmentResult.url, // store public URL or null
                delivery_method: extractedFields.delivery_method,
                delivery_location: extractedFields.delivery_location,
                preferred_date: extractedFields.preferred_date,
                quantity: extractedFields.quantity,
                counselling_required: extractedFields.counselling_required,
                counselling_channel: extractedFields.counselling_channel,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('service_requests')
                .insert([requestData])
                .select('id')
                .single();

            if (error) throw new Error(`Failed to submit service request: ${error.message}`);

            // Log successful submission with attachment status
            logError(null, 'servicesApi.submitServiceRequest', {
                userId: request.user_id,
                requestId: data.id,
                action: 'Service request submitted successfully',
                hasAttachment: !!attachmentResult.url,
                attachmentError: attachmentResult.error || null
            });

            return data.id;
        } catch (error) {
            // Clean up uploaded attachment using standardized function
            await _handleFailedSubmissionCleanup(attachmentResult, request.user_id, 'servicesApi.submitServiceRequest');

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
    // async submitServiceRequestForSync(request, isSync = true) {
    //     try {
    //         validateRequiredFields(request, ['user_id', 'service_id', 'request_data']);

    //         // For sync operations, try to auto-fix common validation issues
    //         if (isSync && request.request_data) {
    //             const requestData = { ...request.request_data };

    //             // Auto-fix delivery location issues
    //             const deliveryMethod = requestData.deliveryMethod || requestData.accessPoint;
    //             const locationBasedMethods = ['Home Delivery', 'Community Group Delivery'];

    //             if (locationBasedMethods.includes(deliveryMethod) && !requestData.deliveryLocation) {
    //                 // Try to use address field or set a default
    //                 requestData.deliveryLocation = requestData.address || 'Location to be confirmed';
    //             }

    //             // Ensure delivery method is set
    //             if (!requestData.deliveryMethod && !requestData.accessPoint) {
    //                 requestData.deliveryMethod = 'Facility pickup';
    //             }

    //             // Update the request with sanitized data
    //             request.request_data = requestData;
    //         }

    //         // Validate delivery preferences
    //         const validation = validateDeliveryPreferences(request.request_data);
    //         if (!validation.isValid) {
    //             throw new Error(`Invalid delivery preferences: ${validation.errors.join(', ')}`);
    //         }

    //         // Extract common fields from request_data for easier querying
    //         const extractedFields = extractCommonFields(request.request_data);

    //         // Prepare the complete request data
    //         const requestData = {
    //             user_id: request.user_id,
    //             service_id: request.service_id,
    //             request_data: request.request_data,
    //             attachments: request.attachments,
    //             status: 'pending',
    //             created_at: new Date().toISOString(),
    //             ...extractedFields
    //         };

    //         const { data, error } = await supabase
    //             .from('service_requests')
    //             .insert([requestData])
    //             .select('id')
    //             .single();

    //         if (error) {
    //             throw new Error(`Failed to submit service request: ${error.message}`);
    //         }

    //         return data.id;
    //     } catch (error) {
    //         logError(error, 'servicesApi.submitServiceRequestForSync', { request, isSync });
    //         throw new Error(handleApiError(error));
    //     }
    // },

    async submitServiceRequestForSync(request, isSync = true) {
        let attachmentResult = null;

        try {
            validateRequiredFields(request, ['user_id', 'service_id', 'request_data']);

            // Process attachment with enhanced error handling
            // Process attachment using standardized SYNC configuration
            attachmentResult = await _processAttachmentStandardized(
                request.attachments,
                request.user_id,
                'SYNC'
            );

            // Validate and handle attachment result using standardized functions
            _validateAttachmentResultConsistency('submitServiceRequestForSync', attachmentResult);
            _handleAttachmentResult(attachmentResult, request.user_id, 'servicesApi.submitServiceRequestForSync');

            if (isSync && request.request_data) {
                const requestData = { ...request.request_data };
                const deliveryMethod = requestData.deliveryMethod || requestData.accessPoint;
                const locationBasedMethods = ['Home Delivery', 'Community Group Delivery'];

                if (locationBasedMethods.includes(deliveryMethod) && !requestData.deliveryLocation) {
                    requestData.deliveryLocation = requestData.address || 'Location to be confirmed';
                }
                if (!requestData.deliveryMethod && !requestData.accessPoint) {
                    requestData.deliveryMethod = 'Facility pickup';
                }
                request.request_data = requestData;
            }

            const validation = validateDeliveryPreferences(request.request_data);
            if (!validation.isValid) {
                throw new Error(`Invalid delivery preferences: ${validation.errors.join(', ')}`);
            }

            const extractedFields = extractCommonFields(request.request_data);

            const requestData = {
                user_id: request.user_id,
                service_id: request.service_id,
                request_data: request.request_data,
                attachments: attachmentResult.url, // Use the URL from the result object
                status: 'pending',
                created_at: new Date().toISOString(),
                ...extractedFields
            };

            const { data, error } = await supabase
                .from('service_requests')
                .insert([requestData])
                .select('id')
                .single();

            if (error) throw new Error(`Failed to submit service request: ${error.message}`);

            // Log successful sync submission with attachment status
            logError(null, 'servicesApi.submitServiceRequestForSync', {
                userId: request.user_id,
                requestId: data.id,
                action: 'Sync service request submitted successfully',
                hasAttachment: !!attachmentResult.url,
                attachmentError: attachmentResult.error || null,
                isSync
            });

            return data.id;
        } catch (error) {
            // Clean up uploaded attachment using standardized function
            await _handleFailedSubmissionCleanup(attachmentResult, request.user_id, 'servicesApi.submitServiceRequestForSync');

            logError(error, 'servicesApi.submitServiceRequestForSync', { request, isSync });
            throw new Error(handleApiError(error));
        }
    },

    async uploadAttachment(file, requestId) {
        try {
            // Use standardized STANDALONE configuration
            const attachmentResult = await _processAttachmentStandardized(
                file,
                requestId || 'standalone',
                'STANDALONE'
            );

            if (attachmentResult.error) {
                throw new Error(attachmentResult.error);
            }

            if (!attachmentResult.url) {
                throw new Error('Failed to upload attachment');
            }

            // Validate and handle result using standardized functions
            _validateAttachmentResultConsistency('uploadAttachment', attachmentResult);
            _handleAttachmentResult(attachmentResult, requestId || 'standalone', 'servicesApi.uploadAttachment');

            return attachmentResult.url;
        } catch (error) {
            logError(error, 'servicesApi.uploadAttachment', { requestId });
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
     * Fetch all videos from the videos table
     * @returns {Promise<Video[]>} Array of video objects
     */
    async getVideos() {
        try {
            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    throw new Error(`Failed to fetch videos: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getVideos');
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Get a single video by ID
     * @param {string} videoId - The video ID
     * @returns {Promise<Video|null>} Video object or null if not found
     */
    async getVideoById(videoId) {
        try {
            validateRequiredFields({ videoId }, ['videoId']);

            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('id', videoId)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No rows returned
                        return null;
                    }
                    throw new Error(`Failed to fetch video: ${error.message}`);
                }

                return data;
            });
        } catch (error) {
            logError(error, 'servicesApi.getVideoById', { videoId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Get recent videos for dashboard (limited number)
     * @param {number} limit - Number of videos to fetch (default: 3)
     * @returns {Promise<Video[]>} Array of recent video objects
     */
    async getRecentVideos(limit = 3) {
        try {
            return await retryWithBackoff(async () => {
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) {
                    throw new Error(`Failed to fetch recent videos: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getRecentVideos', { limit });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Note: Video notifications are now handled automatically by database triggers
     * This function is kept for backward compatibility but notifications are created automatically
     * when videos are inserted into the videos table via the trg_notify_new_video trigger
     * @param {string} videoTitle - Title of the new video
     * @param {string} videoId - ID of the new video
     * @returns {Promise<Object>} Result indicating trigger-based notification
     */
    async notifyNewVideo(videoTitle, videoId) {
        try {
            // Log that notification will be handled by database trigger
            logError(null, 'servicesApi.notifyNewVideo', {
                videoTitle,
                videoId,
                action: 'Video notification will be created automatically by database trigger'
            });

            return {
                success: true,
                message: 'Notification will be created automatically by database trigger',
                triggerBased: true
            };
        } catch (error) {
            logError(error, 'servicesApi.notifyNewVideo', { videoTitle, videoId });
            throw new Error(handleApiError(error));
        }
    },

    /**
     * Get recent service requests for dashboard (limited number)
     * @param {string} userId - The user ID
     * @param {number} limit - Number of service requests to fetch (default: 2)
     * @returns {Promise<ServiceRequest[]>} Array of recent service request objects
     */
    async getRecentServiceRequests(userId, limit = 2) {
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
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) {
                    throw new Error(`Failed to fetch recent service requests: ${error.message}`);
                }

                return data || [];
            });
        } catch (error) {
            logError(error, 'servicesApi.getRecentServiceRequests', { userId, limit });
            throw new Error(handleApiError(error));
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
    },

    /**
     * Clean up orphaned attachment files for a user
     * @param {string} userId - The user ID to clean up files for
     * @param {number} olderThanHours - Clean files older than this many hours (default: 24)
     * @returns {Promise<CleanupResult>} Cleanup result with success/failure counts
     */
    async cleanupOrphanedAttachments(userId, olderThanHours = 24) {
        try {
            validateRequiredFields({ userId }, ['userId']);

            const result = await _cleanupOrphanedFiles(userId, olderThanHours);

            logError(null, 'servicesApi.cleanupOrphanedAttachments', {
                userId,
                olderThanHours,
                result,
                action: 'Public cleanup API called'
            });

            return result;
        } catch (error) {
            logError(error, 'servicesApi.cleanupOrphanedAttachments', { userId, olderThanHours });
            throw new Error(handleApiError(error));
        }
    },



    /**
     * Get attachment storage statistics for a user
     * @param {string} userId - The user ID to get stats for
     * @returns {Promise<AttachmentStats>} Storage statistics
     */
    async getAttachmentStats(userId) {
        try {
            validateRequiredFields({ userId }, ['userId']);

            // Get all files in user's directory
            const { data: files, error: listError } = await supabase.storage
                .from('attachments')
                .list(`user_${userId}`, {
                    limit: 1000,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (listError) {
                throw listError;
            }

            // Get all attachment URLs from service requests
            const { data: requests, error: dbError } = await supabase
                .from('service_requests')
                .select('attachments, created_at')
                .eq('user_id', userId)
                .not('attachments', 'is', null);

            if (dbError) {
                throw dbError;
            }

            const stats = {
                totalFiles: files?.length || 0,
                totalSize: files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0,
                referencedFiles: requests?.length || 0,
                orphanedFiles: 0,
                oldestFile: null,
                newestFile: null
            };

            if (files && files.length > 0) {
                // Calculate orphaned files
                const referencedPaths = new Set();
                if (requests) {
                    requests.forEach(request => {
                        if (request.attachments) {
                            const path = _extractFilePathFromUrl(request.attachments);
                            if (path) {
                                referencedPaths.add(path);
                            }
                        }
                    });
                }

                stats.orphanedFiles = files.filter(file => {
                    const filePath = `user_${userId}/${file.name}`;
                    return !referencedPaths.has(filePath);
                }).length;

                // Get oldest and newest files
                const sortedFiles = [...files].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                stats.oldestFile = sortedFiles[0]?.created_at || null;
                stats.newestFile = sortedFiles[sortedFiles.length - 1]?.created_at || null;
            }

            return stats;
        } catch (error) {
            logError(error, 'servicesApi.getAttachmentStats', { userId });
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

// Error message constants for attachment validation
export const ATTACHMENT_ERROR_MESSAGES = {
    NO_FILE: 'No file provided',
    INVALID_FILE_TYPE: 'Please upload PDF, JPEG, or PNG files only. Other file types are not supported.',
    FILE_TOO_LARGE: 'File size must be under 5MB. Please compress your file or choose a smaller one.',
    FILE_CORRUPTED: 'File appears to be corrupted or unreadable. Please try uploading a different file.',
    INVALID_URL: 'Invalid attachment URL. Please ensure the link is accessible.',
    URL_NOT_ACCESSIBLE: 'Attachment URL is not accessible. Please check the link or upload a new file.',
    PROCESSING_FAILED: 'Failed to process attachment. Please try again or contact support if the issue persists.'
};

// Standardized attachment processing configurations
export const ATTACHMENT_PROCESSING_CONFIGS = {
    // Standard service request submission
    STANDARD: {
        retryCount: 1,
        validateUrl: true,
        includeMetadata: false,
        description: 'Standard service request attachment processing'
    },

    // Sync operations (more resilient)
    SYNC: {
        retryCount: 2,
        validateUrl: true,
        includeMetadata: false,
        description: 'Sync service request attachment processing with enhanced retry'
    },

    // Standalone upload (with metadata)
    STANDALONE: {
        retryCount: 1,
        validateUrl: false,
        includeMetadata: true,
        description: 'Standalone attachment upload with metadata tracking'
    },

    // Health records processing
    HEALTH_RECORD: {
        retryCount: 1,
        validateUrl: true,
        includeMetadata: true,
        description: 'Health record attachment processing'
    }
};

/**
 * Standardized attachment processing wrapper
 * @param {File|Blob|string|null} file - The file to process
 * @param {string} userId - User ID for naming
 * @param {string} configType - Configuration type from ATTACHMENT_PROCESSING_CONFIGS
 * @param {Object} overrides - Optional configuration overrides
 * @returns {Promise<AttachmentResult>} Standardized attachment result
 */
async function _processAttachmentStandardized(file, userId, configType = 'STANDARD', overrides = {}) {
    // Production flag: Set to true to disable attachment processing if needed
    const SKIP_ATTACHMENTS = false; // Attachment processing is enabled

    if (SKIP_ATTACHMENTS) {
        // Attachment processing is disabled
        return {
            url: null,
            metadata: null,
            error: null // No error, just disabled
        };
    }

    const config = ATTACHMENT_PROCESSING_CONFIGS[configType];
    if (!config) {
        throw new Error(`Invalid attachment processing config type: ${configType}`);
    }

    const finalConfig = { ...config, ...overrides };

    // Process attachment with standardized configuration

    return await _processAttachment(file, userId, finalConfig);
}

/**
 * Standardized error handling for attachment processing results
 * @param {AttachmentResult} attachmentResult - Result from attachment processing
 * @param {string} userId - User ID for logging
 * @param {string} operation - Operation name for logging
 * @returns {void}
 */
function _handleAttachmentResult(attachmentResult, userId, operation) {
    if (attachmentResult.error) {
        // Log attachment processing failure for monitoring
        logError(null, `${operation} - attachment handling`, {
            userId,
            action: 'Attachment processing failed, continuing without attachment',
            error: attachmentResult.error,
            hasUrl: !!attachmentResult.url
        });
    }
    // Success cases don't need logging in production
}

/**
 * Standardized cleanup handling for failed submissions
 * @param {AttachmentResult} attachmentResult - Result from attachment processing
 * @param {string} userId - User ID for logging
 * @param {string} operation - Operation name for logging
 * @returns {Promise<void>}
 */
async function _handleFailedSubmissionCleanup(attachmentResult, userId, operation) {
    if (attachmentResult?.url && !attachmentResult.error) {
        try {
            await _cleanupFailedRequestAttachment(attachmentResult.url, userId);
        } catch (cleanupError) {
            logError(cleanupError, `${operation} - cleanup`, {
                userId,
                action: 'Failed to clean up attachment after failed submission',
                attachmentUrl: attachmentResult.url
            });
        }
    }
}

/**
 * Validate that attachment processing is consistent across methods
 * @param {string} methodName - Name of the method being validated
 * @param {AttachmentResult} attachmentResult - Result from attachment processing
 * @returns {boolean} Whether the result follows standard format
 */
function _validateAttachmentResultConsistency(methodName, attachmentResult) {
    const isValid = (
        attachmentResult &&
        typeof attachmentResult === 'object' &&
        (attachmentResult.url === null || typeof attachmentResult.url === 'string') &&
        (attachmentResult.error === undefined || typeof attachmentResult.error === 'string') &&
        (attachmentResult.metadata === null || typeof attachmentResult.metadata === 'object')
    );

    if (!isValid) {
        logError(null, '_validateAttachmentResultConsistency', {
            methodName,
            attachmentResult,
            action: 'Attachment result format validation failed',
            isValid: false
        });
    }

    return isValid;
}

// Validate file for service request attachments
export const validateServiceRequestFile = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB (reduced from 10MB for better performance)

    if (!file) {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.NO_FILE);
    }

    // Check if file has required properties
    if (!file.type || !file.size) {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.FILE_CORRUPTED);
    }

    if (!allowedTypes.includes(file.type)) {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    if (file.size > maxSize) {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    // Additional validation for file integrity
    if (file.size === 0) {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.FILE_CORRUPTED);
    }

    return true;
};

// Validate attachment URL for existing attachments
export const validateAttachmentUrl = (url) => {
    if (!url || typeof url !== 'string') {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.INVALID_URL);
    }

    // Basic URL format validation
    try {
        const urlObj = new URL(url);

        // Ensure it's HTTP/HTTPS
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            throw new Error(ATTACHMENT_ERROR_MESSAGES.INVALID_URL);
        }

        // Check if it looks like a Supabase storage URL (optional but recommended)
        if (url.includes('supabase') && !url.includes('/storage/v1/object/public/')) {
            console.warn('URL may not be a valid Supabase storage URL');
        }

        return true;
    } catch (error) {
        throw new Error(ATTACHMENT_ERROR_MESSAGES.INVALID_URL);
    }
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


