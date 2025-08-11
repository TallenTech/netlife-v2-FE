import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Share2, FileText, HeartPulse, FilePlus, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import { serviceRequestForms } from '@/data/serviceRequestForms';
import { useNavigate } from 'react-router-dom';
import { servicesApi } from '@/services/servicesApi';

const tabs = ['Services', 'Screening', 'Records'];

const History = () => {
  const [activeTab, setActiveTab] = useState('Services');
  const [historyItems, setHistoryItems] = useState({ Services: [], Screening: [], Records: [] });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ isActive: false, lastSync: null });
  const [manualRefreshActive, setManualRefreshActive] = useState(false);
  const [errorState, setErrorState] = useState({ hasError: false, errorMessage: null, errorType: null });
  const { activeProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const firstName = activeProfile?.username?.split(' ')[0] || '';
  const usernameElement = <span className="username-gradient">{firstName}</span>;

  // Comprehensive error handling utility
  const handleError = (error, context, options = {}) => {
    const { 
      showToast = true, 
      logToConsole = true, 
      setErrorState: updateErrorState = false,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    // Determine error type and user-friendly message
    let errorType = 'unknown';
    let userMessage = fallbackMessage;

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = 'network';
      userMessage = 'Network connection issue. Please check your internet connection and try again.';
    } else if (error.message?.includes('timeout')) {
      errorType = 'timeout';
      userMessage = 'Request timed out. Please try again.';
    } else if (error.message?.includes('authentication') || error.message?.includes('JWT')) {
      errorType = 'auth';
      userMessage = 'Authentication expired. Please log in again.';
    } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      errorType = 'permission';
      userMessage = 'You don\'t have permission to perform this action.';
    } else if (error.message?.includes('not found')) {
      errorType = 'notfound';
      userMessage = 'The requested item was not found. It may have been deleted.';
    } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      errorType = 'validation';
      userMessage = 'Invalid data provided. Please check your input and try again.';
    } else if (error.message) {
      userMessage = error.message;
    }

    // Log error for debugging
    if (logToConsole) {
      // Error logging removed for production
    }

    // Update error state if requested
    if (updateErrorState) {
      setErrorState({
        hasError: true,
        errorMessage: userMessage,
        errorType: errorType
      });
    }

    // Show toast notification
    if (showToast) {
      toast({
        title: 'Error',
        description: userMessage,
        variant: 'destructive',
      });
    }

    return { errorType, userMessage };
  };

  // Clear error state
  const clearError = () => {
    setErrorState({ hasError: false, errorMessage: null, errorType: null });
  };

  // History item skeleton component
  const HistoryItemSkeleton = () => (
    <div className="bg-white border p-4 rounded-2xl shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4 flex-1">
          <div className="bg-gray-200 p-3 rounded-full w-11 h-11"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="border-t my-3"></div>
      <div className="h-3 bg-gray-200 rounded w-48 mb-3"></div>
      <div className="border-t my-3"></div>
      <div className="flex items-center justify-end gap-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );

  // Function to load history data
  const loadHistory = async () => {
    if (!activeProfile) return;
      setLoading(true);
      const services = [];
      const screening = [];
      const records = [];
      
      // Load from localStorage first (immediate display)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('service_request_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if(item.profile && (
            item.profile.id === activeProfile.id || 
            (item.profile.phoneNumber && item.profile.phoneNumber === activeProfile.phoneNumber) ||
            (item.profile.username && item.profile.username === activeProfile.username)
          )) {
              const serviceId = key.split('_')[2];
              const timestamp = parseInt(key.split('_')[3]);
              const formConfig = serviceRequestForms[serviceId];
              const recordItem = {
                id: key,
                title: formConfig?.title || 'Service Request',
                date: new Date(timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
                status: 'Submitted',
                icon: HeartPulse,
                data: item,
                type: 'service_request',
              };
              services.push(recordItem);
              records.push(recordItem);
          }
        }
      }

      // Load health surveys
      const surveyData = localStorage.getItem(`netlife_health_survey_${activeProfile.id}`);
      if (surveyData) {
        const parsedSurvey = JSON.parse(surveyData);
        const surveyRecord = {
          id: `health_survey_result_${activeProfile.id}`,
          title: 'Health Risk Assessment',
          date: new Date(parsedSurvey.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
          status: 'Complete',
          result: `${parsedSurvey.score}/10 Score`,
          icon: FileText,
          data: parsedSurvey,
          type: 'health_survey',
        };
        screening.push(surveyRecord);
        records.push(surveyRecord);
      }

      // Load service screening results
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('screening_results_')) {
          try {
            const screeningData = JSON.parse(localStorage.getItem(key));
            
            // Extract service ID and profile ID from key: screening_results_{serviceId}_{profileId}
            const keyParts = key.split('_');
            const serviceId = keyParts[2];
            const profileId = keyParts[3];
            
            // Check if this screening belongs to the current profile
            if (profileId === activeProfile.id) {
              // Get service info to create a proper title
              let serviceTitle = 'Service Screening';
              const serviceNameMap = {
                'hts': 'HIV Testing',
                'prep': 'PrEP Access',
                'pep': 'PEP Access', 
                'art': 'ART Support',
                'sti': 'STI Screening',
                'counselling': 'Counselling'
              };
              
              try {
                // First, try to use the service slug from the screening data (for newer records)
                if (screeningData.serviceSlug) {
                  const formConfig = serviceRequestForms[screeningData.serviceSlug];
                  if (formConfig) {
                    serviceTitle = `${formConfig.title} - Screening`;
                  } else if (serviceNameMap[screeningData.serviceSlug]) {
                    serviceTitle = `${serviceNameMap[screeningData.serviceSlug]} - Screening`;
                  }
                } else {
                  // Fallback for older records: try to match the UUID with known services
                  // This is a temporary solution - ideally we'd look up from database
                  const formConfig = serviceRequestForms[serviceId];
                  if (formConfig) {
                    serviceTitle = `${formConfig.title} - Screening`;
                  } else if (serviceNameMap[serviceId]) {
                    serviceTitle = `${serviceNameMap[serviceId]} - Screening`;
                  } else {
                    // Try to infer from common patterns or use a more descriptive fallback
                    if (serviceId.includes('hiv') || serviceId.includes('test')) {
                      serviceTitle = 'HIV Testing - Screening';
                    } else if (serviceId.includes('prep')) {
                      serviceTitle = 'PrEP Access - Screening';
                    } else if (serviceId.includes('pep')) {
                      serviceTitle = 'PEP Access - Screening';
                    } else if (serviceId.includes('art')) {
                      serviceTitle = 'ART Support - Screening';
                    } else if (serviceId.includes('sti')) {
                      serviceTitle = 'STI Screening - Screening';
                    } else if (serviceId.includes('counsel')) {
                      serviceTitle = 'Counselling - Screening';
                    } else {
                      // Last resort: use a generic title
                      serviceTitle = 'Health Service Screening';
                    }
                  }
                }
              } catch (e) {
                serviceTitle = 'Health Service Screening';
              }

              const screeningRecord = {
                id: key,
                title: serviceTitle,
                date: screeningData.completedAt ? 
                  new Date(screeningData.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }) :
                  'Recently',
                status: 'Complete',
                result: `${screeningData.score}% Eligibility Score`,
                icon: FileText,
                data: screeningData,
                type: 'service_screening',
                serviceId: serviceId,
                eligible: screeningData.eligible
              };
              
              screening.push(screeningRecord);
              records.push(screeningRecord);
              
              // For records without service slug, try to enhance with database lookup
              if (!screeningData.serviceSlug && serviceId.length > 10) { // Likely a UUID
                enhanceScreeningRecordWithServiceName(screeningRecord, serviceId);
              }
            }
          } catch (error) {
            // Skip corrupted screening result
          }
        }
      }

      // Try to load additional data from database
      try {
        const currentUser = await servicesApi.getCurrentUser();
        if (currentUser) {
          const databaseRequests = await servicesApi.getUserServiceRequests(currentUser.id);
          
          // Also load screening results from database
          const databaseScreeningResults = await servicesApi.getUserScreeningResults(currentUser.id);
          
          // Convert database screening results to history format
          databaseScreeningResults.forEach(dbResult => {
            // Check if this result is already in localStorage (avoid duplicates)
            const existsInLocal = screening.some(localItem => 
              localItem.data.databaseResultId === dbResult.id ||
              (localItem.serviceId === dbResult.service_id && 
               Math.abs(new Date(localItem.data.completedAt) - new Date(dbResult.completed_at)) < 60000) // Within 1 minute
            );
            
            if (!existsInLocal) {
              const screeningRecord = {
                id: `db_screening_result_${dbResult.id}`,
                title: `${dbResult.services?.name || 'Health Service'} - Screening`,
                date: new Date(dbResult.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
                status: 'Complete',
                result: `${dbResult.score}% Eligibility Score`,
                icon: FileText,
                data: {
                  score: dbResult.score,
                  eligible: dbResult.eligible,
                  answers: dbResult.answers_summary,
                  completedAt: dbResult.completed_at,
                  databaseResultId: dbResult.id,
                  savedToDatabase: true
                },
                type: 'service_screening',
                serviceId: dbResult.service_id,
                eligible: dbResult.eligible
              };
              
              screening.push(screeningRecord);
              records.push(screeningRecord);
            }
          });
          
          // Convert database requests to history format
          databaseRequests.forEach(dbRequest => {
            // Check if this request is already in localStorage (avoid duplicates)
            const existsInLocal = services.some(localItem => 
              localItem.data.id === dbRequest.id || 
              (localItem.data.request_data && JSON.stringify(localItem.data.request_data) === JSON.stringify(dbRequest.request_data))
            );
            
            if (!existsInLocal) {
              const recordItem = {
                id: `db_service_request_${dbRequest.id}`,
                title: dbRequest.services?.name || 'Service Request',
                date: new Date(dbRequest.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
                status: dbRequest.status === 'pending' ? 'Submitted' : dbRequest.status,
                icon: HeartPulse,
                data: {
                  id: dbRequest.id,
                  profile: activeProfile,
                  request: dbRequest.request_data,
                  completedAt: dbRequest.created_at,
                  savedToDatabase: true
                },
                type: 'service_request',
              };
              services.push(recordItem);
              records.push(recordItem);
            }
          });
        }
      } catch (error) {
        // Continue with localStorage data only
      }

      setHistoryItems({
        Services: services.sort((a, b) => new Date(b.data.completedAt) - new Date(a.data.completedAt)),
        Screening: screening.sort((a, b) => {
          const dateA = a.data.completedAt ? new Date(a.data.completedAt) : new Date(0);
          const dateB = b.data.completedAt ? new Date(b.data.completedAt) : new Date(0);
          return dateB - dateA;
        }),
        Records: records.sort((a, b) => {
          const dateA = a.data?.completedAt ? new Date(a.data.completedAt) : new Date(0);
          const dateB = b.data?.completedAt ? new Date(b.data.completedAt) : new Date(0);
          return dateB - dateA;
        }),
      });
      
      // Clean up orphaned localStorage data (data that exists locally but not in database)
      await cleanupOrphanedLocalData(services, screening);
      
      setLoading(false);
  };

  // Load history when activeProfile changes
  useEffect(() => {
    if (activeProfile) {
      loadHistory();
    }
  }, [activeProfile]);

  // Function to clean up localStorage data that no longer exists in database
  const cleanupOrphanedLocalData = async (dbServices, dbScreening) => {
    try {
      const currentUser = await servicesApi.getCurrentUser();
      if (!currentUser) return;

      // Get all database IDs for comparison
      const dbServiceIds = new Set(dbServices
        .filter(s => s.data.savedToDatabase && s.data.id)
        .map(s => s.data.id));
      
      const dbScreeningIds = new Set(dbScreening
        .filter(s => s.data.databaseResultId)
        .map(s => s.data.databaseResultId));

      // Check localStorage items and remove if they claim to be in database but aren't
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('service_request_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.savedToDatabase && item.id && !dbServiceIds.has(item.id)) {
            localStorage.removeItem(key);
          }
        } else if (key.startsWith('screening_results_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.databaseResultId && !dbScreeningIds.has(item.databaseResultId)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      // Cleanup failed, continue
    }
  };

  // Function to clean up related localStorage entries when database record is deleted
  const cleanupRelatedLocalStorageEntries = async (recordType, databaseId) => {
    try {
      let cleanedCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (recordType === 'service_request' && key.startsWith('service_request_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.id === databaseId || item.data?.id === databaseId) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } else if (recordType === 'screening_result' && key.startsWith('screening_results_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.databaseResultId === databaseId) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      }
      

    } catch (error) {
      // Cleanup failed, continue
    }
  };

  // Function to queue failed deletions for retry (simple logging implementation)
  const queueDeletionForLater = (recordType, databaseId) => {
    try {
      const failedDeletions = JSON.parse(localStorage.getItem('failed_deletions') || '[]');
      const deletionRecord = {
        type: recordType,
        id: databaseId,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };
      
      // Check if this deletion is already queued
      const existingIndex = failedDeletions.findIndex(item => 
        item.type === recordType && item.id === databaseId
      );
      
      if (existingIndex >= 0) {
        failedDeletions[existingIndex].retryCount++;
        failedDeletions[existingIndex].timestamp = new Date().toISOString();
      } else {
        failedDeletions.push(deletionRecord);
      }
      
      localStorage.setItem('failed_deletions', JSON.stringify(failedDeletions));
    } catch (error) {
      // Queue failed, continue
    }
  };

  // Function to enhance screening records with proper service names from database
  const enhanceScreeningRecordWithServiceName = async (screeningRecord, serviceUUID) => {
    try {
      // This would require a new API function to get service by ID
      // For now, we'll use a simple mapping based on common UUIDs
      // In a real implementation, you'd call: const service = await servicesApi.getServiceById(serviceUUID);
      
      // For now, we'll leave the record as is since we don't have the API function
      // The user will see "Health Service Screening" for older records
      
    } catch (error) {
      // Enhancement failed, continue
    }
  };

  // Function to sanitize and validate service request data before sync
  const sanitizeServiceRequestData = (requestData) => {
    if (!requestData || typeof requestData !== 'object') return null;

    try {
      // Create a copy to avoid modifying original data
      const sanitized = { ...requestData };

      // Handle delivery method and location validation
      const deliveryMethod = sanitized.deliveryMethod || sanitized.accessPoint;
      if (deliveryMethod) {
        const locationBasedMethods = ['Home Delivery', 'Community Group Delivery'];
        
        // If location-based delivery method but no location provided, set default
        if (locationBasedMethods.includes(deliveryMethod) && !sanitized.deliveryLocation) {
          // Try multiple fallback sources for location
          sanitized.deliveryLocation = 
            sanitized.address || 
            sanitized.location || 
            sanitized.deliveryAddress ||
            'Location to be confirmed';
        }
      }

      // Ensure required fields have fallback values
      if (!sanitized.deliveryMethod && !sanitized.accessPoint) {
        sanitized.deliveryMethod = 'Facility pickup'; // Safe default
      }

      // Clean up date fields
      if (sanitized.deliveryDate && isNaN(new Date(sanitized.deliveryDate).getTime())) {
        delete sanitized.deliveryDate;
      }
      if (sanitized.preferredDate && isNaN(new Date(sanitized.preferredDate).getTime())) {
        delete sanitized.preferredDate;
      }

      // Ensure basic required fields exist
      if (!sanitized.contactMethod) {
        sanitized.contactMethod = 'phone'; // Default contact method
      }

      // Clean up any null or undefined values that might cause issues
      Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === null || sanitized[key] === undefined) {
          delete sanitized[key];
        }
      });

      return sanitized;
    } catch (error) {
      // If sanitization fails, return null to mark for removal
      return null;
    }
  };

  // Function to sync localStorage data to database (for backup)
  const syncLocalDataToDatabase = async () => {
    try {
      const currentUser = await servicesApi.getCurrentUser();
      if (!currentUser) return;

      const keysToRemove = []; // Track problematic entries for cleanup

      // Find localStorage service requests that haven't been synced to database
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('service_request_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            
            // Check if this item belongs to current user and hasn't been synced
            if (item.profile && 
                (item.profile.id === activeProfile.id || 
                 item.profile.phoneNumber === activeProfile.phoneNumber) &&
                !item.savedToDatabase) {
              
              try {
                // Get service data
                const serviceId = key.split('_')[2];
                const serviceData = await servicesApi.getServiceBySlug(serviceId);
                
                if (serviceData && item.request) {
                  // Sanitize the request data before submission
                  const sanitizedRequest = sanitizeServiceRequestData(item.request);
                  
                  if (sanitizedRequest) {
                    const serviceRequestData = {
                      user_id: currentUser.id,
                      service_id: serviceData.id,
                      request_data: sanitizedRequest,
                      attachments: sanitizedRequest.attachments || null
                    };

                    const requestId = await servicesApi.submitServiceRequestForSync(serviceRequestData, true);
                    
                    // Update localStorage item to mark as synced
                    item.savedToDatabase = true;
                    item.id = requestId;
                    localStorage.setItem(key, JSON.stringify(item));
                  } else {
                    // Request data is too corrupted, mark for removal
                    keysToRemove.push(key);
                  }
                } else {
                  // Service not found or invalid request, mark for removal
                  keysToRemove.push(key);
                }
              } catch (syncError) {
                // Categorize sync errors
                const errorMessage = syncError.message.toLowerCase();
                
                // Permanent validation errors - remove these entries
                const permanentErrors = [
                  'invalid delivery preferences',
                  'validation failed',
                  'required field',
                  'invalid date format',
                  'service not found',
                  'user not found'
                ];
                
                const isPermanentError = permanentErrors.some(error => 
                  errorMessage.includes(error)
                );
                
                if (isPermanentError) {
                  // Mark problematic entry for removal
                  keysToRemove.push(key);
                } else {
                  // Temporary errors (network, server issues) - keep for retry
                  // These will be retried on next sync cycle
                }
              }
            }
          } catch (parseError) {
            // Corrupted localStorage entry, mark for removal
            keysToRemove.push(key);
          }
        }
      }

      // Clean up problematic entries
      if (keysToRemove.length > 0) {
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (removeError) {
            // Ignore removal errors
          }
        });
        
        // Optionally notify user about cleanup (only for manual refresh)
        // This helps users understand why some requests might disappear
      }

    } catch (error) {
      // Sync failed, continue
    }
  };

  // Function to retry failed deletions
  const retryFailedDeletions = async () => {
    try {
      const failedDeletions = JSON.parse(localStorage.getItem('failed_deletions') || '[]');
      if (failedDeletions.length === 0) return;

      const remainingDeletions = [];

      for (const deletion of failedDeletions) {
        try {
          if (deletion.type === 'service_request') {
            await servicesApi.deleteServiceRequest(deletion.id);
          } else if (deletion.type === 'screening_result') {
            await servicesApi.deleteScreeningResult(deletion.id);
          } else if (deletion.type === 'screening_answers') {
            // Format: userId_serviceId
            const [userId, serviceId] = deletion.id.split('_');
            await servicesApi.deleteUserScreeningAnswers(userId, serviceId);
          }
          // Don't add to remaining deletions if successful
        } catch (error) {
          // Keep in queue if still failing, but limit retry attempts
          if (deletion.retryCount < 3) {
            deletion.retryCount++;
            remainingDeletions.push(deletion);
          } else {
            // Give up after 3 attempts
          }
        }
      }

      // Update the queue with remaining failed deletions
      localStorage.setItem('failed_deletions', JSON.stringify(remainingDeletions));
      

    } catch (error) {
      // Retry processing failed, continue
    }
  };

  // Enhanced background sync system with visibility-aware intervals
  useEffect(() => {
    if (!activeProfile) return;

    let backgroundSyncInterval;
    let retryInterval;
    let isPageVisible = !document.hidden;

    // Initial sync after component mount (delayed to not block UI)
    const initialSyncTimeout = setTimeout(async () => {
      try {
        await syncLocalDataToDatabase();
        await retryFailedDeletions();
        await refreshFromDatabase(); // Initial background sync
      } catch (error) {
        // Initial sync failed, continue
      }
    }, 2000);

    // Function to start background sync intervals
    const startSyncIntervals = () => {
      // Background sync every 30 seconds for real-time updates
      backgroundSyncInterval = setInterval(async () => {
        if (!isPageVisible) return; // Skip sync when page is not visible
        
        try {
          await refreshFromDatabase();
        } catch (error) {
          // Background sync failed, continue
        }
      }, 30000);

      // Retry failed deletions every 2 minutes
      retryInterval = setInterval(async () => {
        if (!isPageVisible) return; // Skip retry when page is not visible
        
        try {
          await retryFailedDeletions();
        } catch (error) {
          // Retry failed, continue
        }
      }, 120000);
    };

    // Function to stop sync intervals
    const stopSyncIntervals = () => {
      if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
      if (retryInterval) clearInterval(retryInterval);
    };

    // Handle page visibility changes for performance optimization
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      
      if (isPageVisible) {
        startSyncIntervals();
        // Immediate sync when page becomes visible
        setTimeout(() => refreshFromDatabase(), 1000);
      } else {
        stopSyncIntervals();
      }
    };

    // Start initial intervals
    startSyncIntervals();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearTimeout(initialSyncTimeout);
      stopSyncIntervals();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeProfile]);

  // Enhanced background synchronization system
  const refreshFromDatabase = async (showToast = false, isManualRefresh = false) => {
    try {
      // Only show loading state for manual refresh
      if (isManualRefresh) {
        setManualRefreshActive(true);
      }
      
      const currentUser = await servicesApi.getCurrentUser();
      if (!currentUser) {
        if (isManualRefresh) {
          setManualRefreshActive(false);
        }
        return;
      }

      // Get fresh data from database
      const [databaseRequests, databaseScreeningResults] = await Promise.all([
        servicesApi.getUserServiceRequests(currentUser.id),
        servicesApi.getUserScreeningResults(currentUser.id)
      ]);

      // console.log('📊 Database state:', {
      //   requests: databaseRequests.length,
      //   screenings: databaseScreeningResults.length
      // });

      // Create lookup sets for efficient comparison
      const dbServiceIds = new Set(databaseRequests.map(r => r.id));
      const dbScreeningIds = new Set(databaseScreeningResults.map(r => r.id));

      let removedCount = 0;
      let syncedCount = 0;

      // Scan all localStorage keys for orphan detection
      const localStorageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('service_request_') || key.startsWith('screening_results_')) {
          localStorageKeys.push(key);
        }
      }

      // Process each localStorage item
      for (const key of localStorageKeys) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          let shouldRemove = false;

          if (key.startsWith('service_request_')) {
            // Check if this service request still exists in database
            if (item.savedToDatabase && item.id) {
              const existsInDb = dbServiceIds.has(item.id);
              if (!existsInDb) {
                shouldRemove = true;
              }
            }
          } else if (key.startsWith('screening_results_')) {
            // Check if this screening result still exists in database
            if (item.databaseResultId) {
              const existsInDb = dbScreeningIds.has(item.databaseResultId);
              if (!existsInDb) {
                shouldRemove = true;
              }
            }
          }

          if (shouldRemove) {
            localStorage.removeItem(key);
            removedCount++;
          } else {
            syncedCount++;
          }
        } catch (parseError) {
          // Optionally remove corrupted items
          localStorage.removeItem(key);
          removedCount++;
        }
      }

      // Reload history if changes were detected
      if (removedCount > 0) {
        await loadHistory();
      }

      // Update sync status (always update last sync time)
      setSyncStatus({ isActive: false, lastSync: new Date() });
      
      // Stop manual refresh loading state
      if (isManualRefresh) {
        setManualRefreshActive(false);
      }

      // Show user feedback if requested (only for manual refresh)
      if (showToast && isManualRefresh) {
        toast({
          title: 'History Refreshed',
          description: removedCount > 0 
            ? `Updated history and removed ${removedCount} outdated items.`
            : 'Your history is up to date.',
        });
      }

      return { synced: syncedCount, removed: removedCount };
    } catch (error) {
      setSyncStatus({ isActive: false, lastSync: syncStatus.lastSync });
      
      // Stop manual refresh loading state
      if (isManualRefresh) {
        setManualRefreshActive(false);
      }
      
      if (showToast && isManualRefresh) {
        toast({
          title: 'Sync Failed',
          description: 'Unable to sync with server. Please try again.',
          variant: 'destructive',
        });
      }
      return { synced: 0, removed: 0, error: error.message };
    }
  };

  // Legacy function name for backward compatibility
  const syncDataWithDatabase = refreshFromDatabase;

  const handleShare = async (item) => {
    const shareUrl = `${window.location.origin}/records/${item.id}`;
    const shareData = {
      title: `My NetLife Record: ${item.title}`,
      text: `View my health record from NetLife, shared securely.`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link Copied!',
        description: 'A shareable link to your record has been copied to your clipboard.',
      });
    }
  };

  const handleDownload = (item) => {
    toast({
      title: "Generating PDF...",
      description: "Your record is being prepared for download."
    });

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`NetLife Health Record: ${item.title}`, 14, 22);

    doc.setFontSize(12);
    doc.text(`User: ${activeProfile.username}`, 14, 32);
    doc.text(`Date: ${item.date}`, 14, 38);
    
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    doc.setFontSize(10);
    let y = 55;

    if (item.type === 'service_request') {
      Object.entries(item.data.request).forEach(([key, value]) => {
        const fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${fieldLabel}:`, 14, y);
        doc.text(String(value), 60, y);
        y += 7;
      });
    } else if (item.type === 'health_survey') {
        doc.text(`Prevention Score: ${item.data.score}/10`, 14, y);
        y += 10;
        doc.text('Recommendations:', 14, y);
        y += 7;
        item.data.recommendations.forEach(rec => {
            doc.text(`- ${rec}`, 18, y);
            y += 7;
        });
    }
    
    doc.save(`netlife-record-${item.title.replace(/\s+/g, '-')}.pdf`);
  };


  const handleItemClick = (item) => {
    navigate(`/records/${item.id}`);
  };

  const handleDeleteClick = (item, event) => {
    // Prevent the item click event from firing
    event.stopPropagation();
    
    // Show confirmation dialog
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      let deleteSuccess = false;
      let dbDeletionSuccess = false;
      let localDeletionSuccess = false;

      // Handle different types of items with comprehensive cleanup
      if (itemToDelete.type === 'service_request') {
        // 1. Delete from database first (database-first strategy)
        if (itemToDelete.data?.savedToDatabase && itemToDelete.data?.id) {
          try {
            await servicesApi.deleteServiceRequest(itemToDelete.data.id);
            dbDeletionSuccess = true;
          } catch (dbError) {
            // Queue for retry if it's a network/temporary issue
            if (dbError.message?.includes('network') || dbError.message?.includes('timeout') || dbError.message?.includes('connection')) {
              queueDeletionForLater('service_request', itemToDelete.data.id);
            }
            // Continue with localStorage cleanup even if database deletion fails
          }
        } else if (itemToDelete.id?.startsWith('db_service_request_')) {
          // This is a database-only record
          const dbId = itemToDelete.id.replace('db_service_request_', '');
          try {
            await servicesApi.deleteServiceRequest(dbId);
            dbDeletionSuccess = true;
          } catch (dbError) {
            // Queue for retry if it's a network/temporary issue
            if (dbError.message?.includes('network') || dbError.message?.includes('timeout') || dbError.message?.includes('connection')) {
              queueDeletionForLater('service_request', dbId);
            }
          }
        }

        // 2. Delete from localStorage
        if (itemToDelete.id?.startsWith('service_request_')) {
          try {
            localStorage.removeItem(itemToDelete.id);
            localDeletionSuccess = true;
          } catch (localError) {
            // localStorage deletion failed
          }
        }

        // 3. Clean up any related localStorage entries
        if (dbDeletionSuccess && itemToDelete.data?.id) {
          try {
            await cleanupRelatedLocalStorageEntries('service_request', itemToDelete.data.id);
          } catch (cleanupError) {
            // Cleanup failed, but main deletion succeeded
          }
        }

        deleteSuccess = dbDeletionSuccess || localDeletionSuccess;
        
      } else if (itemToDelete.type === 'service_screening') {
        // 1. Delete screening result from database
        if (itemToDelete.data.databaseResultId) {
          try {
            await servicesApi.deleteScreeningResult(itemToDelete.data.databaseResultId);
            dbDeletionSuccess = true;
          } catch (dbError) {
            // Queue for retry if it's a network/temporary issue
            if (dbError.message.includes('network') || dbError.message.includes('timeout') || dbError.message.includes('connection')) {
              queueDeletionForLater('screening_result', itemToDelete.data.databaseResultId);
            }
          }
        } else if (itemToDelete.id.startsWith('db_screening_result_')) {
          // This is a database-only record
          const dbId = itemToDelete.id.replace('db_screening_result_', '');
          try {
            await servicesApi.deleteScreeningResult(dbId);
            dbDeletionSuccess = true;
          } catch (dbError) {
            // Queue for retry if it's a network/temporary issue
            if (dbError.message.includes('network') || dbError.message.includes('timeout') || dbError.message.includes('connection')) {
              queueDeletionForLater('screening_result', dbId);
            }
          }
        }

        // 2. Delete related screening answers from database (using our new API function)
        if (itemToDelete.serviceId && activeProfile) {
          try {
            const currentUser = await servicesApi.getCurrentUser();
            if (currentUser) {
              await servicesApi.deleteUserScreeningAnswers(currentUser.id, itemToDelete.serviceId);
            }
          } catch (dbError) {
            // Queue this for retry if it's a network issue
            if (dbError.message.includes('network') || dbError.message.includes('timeout')) {
              queueDeletionForLater('screening_answers', `${currentUser?.id}_${itemToDelete.serviceId}`);
            }
          }
        }

        // 3. Delete from localStorage
        if (itemToDelete.id.startsWith('screening_results_')) {
          localStorage.removeItem(itemToDelete.id);
          localDeletionSuccess = true;
        }

        // 4. Clean up any related localStorage entries
        if (dbDeletionSuccess && itemToDelete.data.databaseResultId) {
          await cleanupRelatedLocalStorageEntries('screening_result', itemToDelete.data.databaseResultId);
        }

        deleteSuccess = dbDeletionSuccess || localDeletionSuccess;
        
      } else if (itemToDelete.type === 'health_survey') {
        // Delete health survey (localStorage only)
        localStorage.removeItem(`netlife_health_survey_${activeProfile.id}`);
        deleteSuccess = true;
      }

      // Provide user feedback based on results
      if (deleteSuccess) {
        const deletionType = dbDeletionSuccess && localDeletionSuccess ? 'completely' : 
                           dbDeletionSuccess ? 'from database' : 'from local storage';
        
        toast({
          title: 'Record Deleted',
          description: `"${itemToDelete.title}" has been ${deletionType} removed from your history.`,
        });
        
        // Reload history to reflect changes immediately
        loadHistory();
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Unable to delete this record. Please check your connection and try again.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: `An error occurred while deleting the record: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      // Always close dialog and reset state
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const renderEmptyState = (tab) => {
    const messages = {
      Services: { title: "No Service History", message: "You haven't requested any services yet. Explore our services to get started.", cta: "Go to Services", action: () => navigate('/services'), icon: HeartPulse},
      Screening: { title: "No Screening History", message: "You haven't completed any health screenings. Take a survey to assess your health.", cta: "Take a Survey", action: () => navigate(`/survey/${activeProfile.id}`), icon: FileText },
      Records: { title: "No Health Records", message: "Your submitted forms and results will appear here.", cta: "Go to Dashboard", action: () => navigate('/dashboard'), icon: FilePlus },
    };
    const { title, message, cta, action, icon: Icon } = messages[tab];
    return (
      <div className="text-center py-16 px-6 bg-gray-50 rounded-2xl">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center mb-4"><Icon size={32} /></div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 mt-2 mb-6">{message}</p>
        <Button onClick={action}>{cta}</Button>
      </div>
    );
  };

  return (
    <>
      <Helmet><title>Health History - NetLife</title></Helmet>
      <div className="p-4 md:p-6 bg-white min-h-screen">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-extrabold text-gray-900">Health History</h1>
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {syncStatus.lastSync && (
                <span className="text-xs text-gray-400 hidden sm:block">
                  Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshFromDatabase(true, true)}
                disabled={loading || manualRefreshActive}
                className="flex items-center space-x-2 hover:bg-gray-50"
              >
                <RefreshCw size={14} className={loading || manualRefreshActive ? 'animate-spin' : ''} />
                <span>{manualRefreshActive ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>
          <p className="text-gray-500">Hi {usernameElement}, here's a summary of your activities.</p>
        </header>

        <div className="bg-gray-100 p-1 rounded-full flex justify-around items-center mb-6">
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => !loading && setActiveTab(tab)} 
              disabled={loading}
              className={`w-full py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-white text-primary shadow-md' 
                  : loading 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <HistoryItemSkeleton key={`skeleton-${index}`} />
            ))
          ) : historyItems[activeTab].length > 0 ? (
            historyItems[activeTab].map(item => (
              <div key={item.id} className="bg-white border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div onClick={() => handleItemClick(item)} className="flex justify-between items-start cursor-pointer">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-primary/10 text-primary p-3 rounded-full"><item.icon size={20} /></div>
                      <div>
                        <h3 className="font-bold text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.status === 'Complete' || item.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                </div>
                {item.result && (
                  <>
                    <div className="border-t my-3"></div>
                    <p className="text-sm text-gray-600">Result: <span className="font-semibold text-gray-800">{item.result}</span></p>
                  </>
                )}
                <div className="border-t my-3"></div>
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => handleDeleteClick(item, e)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 size={14} className="mr-2" /> Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleShare(item)}>
                        <Share2 size={14} className="mr-2" /> Share
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(item)}>
                        <Download size={14} className="mr-2" /> Download
                    </Button>
                </div>
              </div>
            ))
          ) : (
            renderEmptyState(activeTab)
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone and will remove the record from both your device and our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default History;