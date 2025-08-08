/**
 * Type definitions for the Services Management System
 * Using JSDoc comments for type checking in JavaScript
 */

/**
 * @typedef {Object} Service - Database service structure
 * @property {string} id - Unique service identifier (UUID)
 * @property {string} name - Service name
 * @property {string} description - Service description
 * @property {string} slug - URL-friendly service identifier
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} ServiceUI - UI-enhanced service structure
 * @property {string} id - Unique service identifier
 * @property {string} slug - URL-friendly service identifier
 * @property {string} title - Service name (mapped from name)
 * @property {string} desc - Service description (mapped from description)
 * @property {string} category - UI category (routine, urgent, follow-up) - hardcoded
 * @property {string} color - UI color theme - hardcoded
 * @property {string} icon - Icon name for UI - hardcoded
 */

/**
 * @typedef {Object} ServiceQuestion
 * @property {string} id - Unique question identifier
 * @property {string} service_id - Associated service ID
 * @property {string} question_text - The question text
 * @property {'yes_no'|'multiple_choice'|'text'|'select'} question_type - Type of question
 * @property {boolean} required - Whether the question is required
 * @property {string} created_at - Creation timestamp
 * @property {QuestionOption[]} [options] - Available answer options
 */

/**
 * @typedef {Object} QuestionOption
 * @property {string} id - Unique option identifier
 * @property {string} question_id - Associated question ID
 * @property {string} option_text - Display text for the option
 * @property {string} value - Value to store when selected
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} ScreeningAnswer
 * @property {string} user_id - User who provided the answer
 * @property {string} service_id - Service being screened for
 * @property {string} question_id - Question being answered
 * @property {string} [selected_option_id] - Selected option ID (for multiple choice)
 * @property {string} [answer_text] - Text answer (for text questions)
 * @property {string} [created_at] - Answer timestamp
 */

/**
 * @typedef {Object} ServiceRequest
 * @property {string} user_id - User making the request
 * @property {string} service_id - Service being requested
 * @property {'pending'|'approved'|'completed'|'cancelled'} status - Request status
 * @property {Object} request_data - Additional request data (form responses, etc.)
 * @property {string} [created_at] - Request timestamp
 */

/**
 * @typedef {Object} ScreeningResult
 * @property {boolean} eligible - Whether user is eligible for the service
 * @property {number} score - Eligibility score (0-100)
 * @property {Object} answers - User's answers to screening questions
 * @property {string} service_id - Service that was screened for
 * @property {string} user_id - User who completed the screening
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {string} [code] - Error code
 * @property {Object} [details] - Additional error details
 */

// Export empty object to make this a module
export { };