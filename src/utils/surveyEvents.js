// Custom event system for survey status updates
export const SURVEY_EVENTS = {
    SURVEY_COMPLETED: 'survey_completed',
    SURVEY_STATUS_REFRESH: 'survey_status_refresh'
};

export const surveyEvents = {
    // Emit survey completion event
    emitSurveyCompleted: (userId, completed) => {
        const event = new CustomEvent(SURVEY_EVENTS.SURVEY_COMPLETED, {
            detail: { userId, completed }
        });
        window.dispatchEvent(event);
    },

    // Listen for survey completion events
    onSurveyCompleted: (callback) => {
        const handler = (event) => callback(event.detail);
        window.addEventListener(SURVEY_EVENTS.SURVEY_COMPLETED, handler);
        return () => window.removeEventListener(SURVEY_EVENTS.SURVEY_COMPLETED, handler);
    },

    // Emit survey status refresh event
    emitSurveyStatusRefresh: (userId) => {
        const event = new CustomEvent(SURVEY_EVENTS.SURVEY_STATUS_REFRESH, {
            detail: { userId }
        });
        window.dispatchEvent(event);
    },

    // Listen for survey status refresh events
    onSurveyStatusRefresh: (callback) => {
        const handler = (event) => callback(event.detail);
        window.addEventListener(SURVEY_EVENTS.SURVEY_STATUS_REFRESH, handler);
        return () => window.removeEventListener(SURVEY_EVENTS.SURVEY_STATUS_REFRESH, handler);
    }
};