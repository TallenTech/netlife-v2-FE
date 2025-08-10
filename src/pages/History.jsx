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
import { Download, Share2, FileText, HeartPulse, FilePlus, ChevronRight, Trash2 } from 'lucide-react';
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
  const { activeProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const firstName = activeProfile?.username?.split(' ')[0] || '';
  const usernameElement = <span className="username-gradient">{firstName}</span>;

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

  useEffect(() => {
    if (!activeProfile) return;

    const loadHistory = async () => {
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
                console.warn('Could not determine service title for:', serviceId);
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
              console.log('✅ Added screening record:', serviceTitle, screeningData.score + '%');
              
              // For records without service slug, try to enhance with database lookup
              if (!screeningData.serviceSlug && serviceId.length > 10) { // Likely a UUID
                enhanceScreeningRecordWithServiceName(screeningRecord, serviceId);
              }
            }
          } catch (error) {
            console.warn('Failed to parse screening result:', key, error);
          }
        }
      }

      // Try to load additional data from database
      try {
        const currentUser = await servicesApi.getCurrentUser();
        if (currentUser) {
          const databaseRequests = await servicesApi.getUserServiceRequests(currentUser.id);
          console.log('🔍 Loaded from database:', databaseRequests.length, 'requests');
          
          // Also load screening results from database
          const databaseScreeningResults = await servicesApi.getUserScreeningResults(currentUser.id);
          console.log('🔍 Loaded screening results from database:', databaseScreeningResults.length, 'results');
          
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
        console.warn('Failed to load history from database:', error.message);
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
      
      setLoading(false);
    };

    loadHistory();
  }, [activeProfile]);

  // Function to enhance screening records with proper service names from database
  const enhanceScreeningRecordWithServiceName = async (screeningRecord, serviceUUID) => {
    try {
      // This would require a new API function to get service by ID
      // For now, we'll use a simple mapping based on common UUIDs
      // In a real implementation, you'd call: const service = await servicesApi.getServiceById(serviceUUID);
      
      console.log('🔍 Attempting to enhance screening record for UUID:', serviceUUID);
      
      // For now, we'll leave the record as is since we don't have the API function
      // The user will see "Health Service Screening" for older records
      
    } catch (error) {
      console.warn('Failed to enhance screening record:', error);
    }
  };

  // Function to sync localStorage data to database (for backup)
  const syncLocalDataToDatabase = async () => {
    try {
      const currentUser = await servicesApi.getCurrentUser();
      if (!currentUser) return;

      // Find localStorage service requests that haven't been synced to database
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('service_request_')) {
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
              
              if (serviceData) {
                const serviceRequestData = {
                  user_id: currentUser.id,
                  service_id: serviceData.id,
                  request_data: item.request,
                  attachments: item.request.attachments || null
                };

                const requestId = await servicesApi.submitServiceRequest(serviceRequestData);
                
                // Update localStorage item to mark as synced
                item.savedToDatabase = true;
                item.id = requestId;
                localStorage.setItem(key, JSON.stringify(item));
                
                console.log('✅ Synced local request to database:', requestId);
              }
            } catch (syncError) {
              console.warn('Failed to sync request to database:', syncError.message);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to sync local data to database:', error.message);
    }
  };

  // Run sync on component mount (after a delay to not block initial load)
  useEffect(() => {
    if (activeProfile) {
      setTimeout(syncLocalDataToDatabase, 2000);
    }
  }, [activeProfile]);

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

      // Handle different types of items
      if (itemToDelete.type === 'service_request') {
        // Delete service request
        if (itemToDelete.data.savedToDatabase && itemToDelete.data.id) {
          try {
            await servicesApi.deleteServiceRequest(itemToDelete.data.id);
            console.log('✅ Deleted service request from database:', itemToDelete.data.id);
          } catch (dbError) {
            console.warn('Failed to delete from database:', dbError.message);
            // Continue with localStorage deletion
          }
        }
        
        // Delete from localStorage
        if (itemToDelete.id.startsWith('service_request_')) {
          localStorage.removeItem(itemToDelete.id);
          deleteSuccess = true;
        } else if (itemToDelete.id.startsWith('db_service_request_')) {
          // This is a database-only record
          const dbId = itemToDelete.id.replace('db_service_request_', '');
          try {
            await servicesApi.deleteServiceRequest(dbId);
            deleteSuccess = true;
            console.log('✅ Deleted database service request:', dbId);
          } catch (dbError) {
            console.error('Failed to delete database service request:', dbError.message);
          }
        }
        
      } else if (itemToDelete.type === 'service_screening') {
        // Delete screening result
        if (itemToDelete.data.databaseResultId) {
          try {
            await servicesApi.deleteScreeningResult(itemToDelete.data.databaseResultId);
            console.log('✅ Deleted screening result from database:', itemToDelete.data.databaseResultId);
          } catch (dbError) {
            console.warn('Failed to delete screening result from database:', dbError.message);
          }
        }
        
        // Delete from localStorage
        if (itemToDelete.id.startsWith('screening_results_')) {
          localStorage.removeItem(itemToDelete.id);
          deleteSuccess = true;
        } else if (itemToDelete.id.startsWith('db_screening_result_')) {
          // This is a database-only record
          const dbId = itemToDelete.id.replace('db_screening_result_', '');
          try {
            await servicesApi.deleteScreeningResult(dbId);
            deleteSuccess = true;
            console.log('✅ Deleted database screening result:', dbId);
          } catch (dbError) {
            console.error('Failed to delete database screening result:', dbError.message);
          }
        }
        
      } else if (itemToDelete.type === 'health_survey') {
        // Delete health survey
        localStorage.removeItem(`netlife_health_survey_${activeProfile.id}`);
        deleteSuccess = true;
      }

      if (deleteSuccess) {
        toast({
          title: 'Record Deleted',
          description: `"${itemToDelete.title}" has been removed from your history.`,
        });
        
        // Reload history to reflect changes
        await loadHistory();
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Unable to delete this record. Please try again.',
          variant: 'destructive',
        });
      }
      
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({
        title: 'Delete Failed',
        description: 'An error occurred while deleting the record.',
        variant: 'destructive',
      });
    } finally {
      // Close dialog and reset state
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
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-gray-900">Health History</h1>
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            )}
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