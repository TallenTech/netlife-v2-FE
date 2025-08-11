import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Calendar, CheckCircle, HeartPulse, AlertTriangle, FileText, MapPin, Phone, Clock, User, Download, Share2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';
import { serviceRequestForms } from '@/data/serviceRequestForms';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarEmoji } from '@/lib/utils';
import { servicesApi } from '@/services/servicesApi';

const RecordViewer = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadRecord = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle different record types
        if (recordId.startsWith('db_service_request_')) {
          // Database service request
          const dbId = recordId.replace('db_service_request_', '');
          try {
            const currentUser = await servicesApi.getCurrentUser();
            if (currentUser) {
              const requests = await servicesApi.getUserServiceRequests(currentUser.id);
              const dbRecord = requests.find(r => r.id === dbId);
              if (dbRecord) {
                setRecord({
                  type: 'database_service_request',
                  data: dbRecord,
                  profile: activeProfile
                });
              } else {
                setError('Service request not found');
              }
            }
          } catch (dbError) {
            setError('Failed to load database record');
          }
        } else if (recordId.startsWith('db_screening_result_')) {
          // Database screening result
          const dbId = recordId.replace('db_screening_result_', '');
          try {
            const currentUser = await servicesApi.getCurrentUser();
            if (currentUser) {
              const results = await servicesApi.getUserScreeningResults(currentUser.id);
              const dbRecord = results.find(r => r.id === dbId);
              if (dbRecord) {
                setRecord({
                  type: 'database_screening_result',
                  data: dbRecord,
                  profile: activeProfile
                });
              } else {
                setError('Screening result not found');
              }
            }
          } catch (dbError) {
            setError('Failed to load screening result');
          }
        } else {
          // localStorage records
          const item = localStorage.getItem(recordId);
          if (item) {
            try {
              const parsedItem = JSON.parse(item);
              
              // Check if this is a synced service request that should be treated as database record
              if (recordId.startsWith('service_request_') && parsedItem.savedToDatabase && parsedItem.id) {
                // This is a localStorage service request that has been synced to database
                // Try to get the full database record for complete information
                try {
                  const currentUser = await servicesApi.getCurrentUser();
                  if (currentUser) {
                    const requests = await servicesApi.getUserServiceRequests(currentUser.id);
                    const dbRecord = requests.find(r => r.id === parsedItem.id);
                    if (dbRecord) {
                      // Use database record with localStorage fallback
                      setRecord({
                        type: 'database_service_request',
                        data: dbRecord,
                        profile: activeProfile,
                        localStorageData: parsedItem // Keep localStorage data as fallback
                      });
                    } else {
                      // Database record not found, use localStorage data
                      setRecord({
                        type: 'localStorage_record',
                        data: parsedItem,
                        profile: activeProfile
                      });
                    }
                  } else {
                    // No user, use localStorage data
                    setRecord({
                      type: 'localStorage_record',
                      data: parsedItem,
                      profile: activeProfile
                    });
                  }
                } catch (dbError) {
                  // Database fetch failed, use localStorage data
                  setRecord({
                    type: 'localStorage_record',
                    data: parsedItem,
                    profile: activeProfile
                  });
                }
              } else {
                // Regular localStorage record
                setRecord({
                  type: 'localStorage_record',
                  data: parsedItem,
                  profile: activeProfile
                });
              }
            } catch (parseError) {
              setError('Invalid record format');
            }
          } else {
            setError('Record not found');
          }
        }
      } catch (error) {
        setError('Failed to load record');
      } finally {
        setLoading(false);
      }
    };

    if (recordId && activeProfile) {
      loadRecord();
    }
  }, [recordId, activeProfile]);

  // Determine record type and extract data
  let title = "Record Details";
  let recordData = null;
  let recordType = null;

  if (record) {
    if (record.type === 'database_service_request') {
      recordType = 'service_request';
      title = record.data.services?.name || "Service Request";
      recordData = record.data;
    } else if (record.type === 'database_screening_result') {
      recordType = 'screening_result';
      title = `${record.data.services?.name || 'Health Service'} - Screening`;
      recordData = record.data;
    } else if (recordId.startsWith('service_request_')) {
      recordType = 'service_request';
      const serviceId = recordId.split('_')[2];
      const formConfig = serviceRequestForms[serviceId];
      title = formConfig?.title || "Service Request";
      
      // For localStorage service requests, use the request data
      // But if it's been synced to database, we might have richer data
      if (record.type === 'database_service_request') {
        recordData = record.data;
        title = record.data.services?.name || title;
      } else {
        recordData = record.data.request || record.data;
      }
    } else if (recordId.startsWith('health_survey_result_')) {
      recordType = 'health_survey';
      title = "Health Risk Assessment";
      recordData = record.data;
    } else if (recordId.startsWith('screening_results_')) {
      recordType = 'screening_result';
      const serviceId = recordId.split('_')[2];
      const formConfig = serviceRequestForms[serviceId];
      title = formConfig ? `${formConfig.title} - Screening` : "Service Screening";
      recordData = record.data;
    }
  }

  const renderAvatar = (p) => {
    if (p?.profilePhoto) {
        return <AvatarImage src={p.profilePhoto} alt={p.username} />
    }
    if (p?.avatar) {
        return <AvatarFallback className="text-2xl bg-transparent">{getAvatarEmoji(p.avatar)}</AvatarFallback>
    }
    return <AvatarFallback>{p?.username?.charAt(0).toUpperCase()}</AvatarFallback>
  }

  // Helper function to safely render any value as a string
  const safeRenderValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      if (value.name) {
        return value.name;
      } else if (value.address) {
        return `${value.address}${value.details ? ` - ${value.details}` : ''}`;
      } else if (Array.isArray(value)) {
        return value.join(', ');
      } else {
        return JSON.stringify(value, null, 2);
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  }

  // Action handlers
  const handleDownload = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += 15;

      // User info
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text(`User: ${record.profile.username}`, margin, yPosition);
      yPosition += 10;

      const date = recordData.created_at ? new Date(recordData.created_at).toLocaleDateString() :
                   recordData.completed_at ? new Date(recordData.completed_at).toLocaleDateString() :
                   record.data.completedAt ? new Date(record.data.completedAt).toLocaleDateString() :
                   'Recently';
      pdf.text(`Date: ${date}`, margin, yPosition);
      yPosition += 15;

      // Content based on record type
      if (recordType === 'service_request') {
        let data;
        if (record.type === 'database_service_request') {
          data = recordData.request_data || recordData;
        } else if (recordId.startsWith('service_request_') && record.data.request) {
          data = record.data.request;
        } else {
          data = recordData;
        }
        
        pdf.setFont(undefined, 'bold');
        pdf.text('Service Request Details:', margin, yPosition);
        yPosition += 10;
        pdf.setFont(undefined, 'normal');

        // Add key fields
        const fields = [
          { label: 'Service', value: title },
          { label: 'Status', value: recordData.status || 'Submitted' },
          { label: 'Full Name', value: data?.fullName },
          { label: 'Phone', value: data?.phoneNumber },
          { label: 'Email', value: data?.email },
          { label: 'Delivery Method', value: data?.deliveryMethod || data?.accessPoint },
          { label: 'Location', value: data?.deliveryLocation },
        ];

        fields.forEach(field => {
          if (field.value) {
            pdf.text(`${field.label}: ${field.value}`, margin, yPosition);
            yPosition += 8;
          }
        });

      } else if (recordType === 'screening_result') {
        pdf.setFont(undefined, 'bold');
        pdf.text('Screening Results:', margin, yPosition);
        yPosition += 10;
        pdf.setFont(undefined, 'normal');

        pdf.text(`Eligibility Score: ${recordData.score}%`, margin, yPosition);
        yPosition += 8;
        pdf.text(`Eligible: ${recordData.eligible ? 'Yes' : 'No'}`, margin, yPosition);
        yPosition += 15;

        // Add answers if available
        const answers = recordData.answers || recordData.answers_summary;
        if (answers && typeof answers === 'object') {
          pdf.setFont(undefined, 'bold');
          pdf.text('Screening Answers:', margin, yPosition);
          yPosition += 10;
          pdf.setFont(undefined, 'normal');

          Object.entries(answers).forEach(([key, value], index) => {
            const answer = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
            pdf.text(`Q${index + 1}: ${answer}`, margin, yPosition);
            yPosition += 8;
          });
        }
      }

      // Save the PDF
      pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`);
      
      toast({
        title: 'Download Complete',
        description: 'Your record has been downloaded as a PDF.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Unable to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `NetLife Record: ${title}`,
        text: `View my health record from NetLife - ${title}`,
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: 'Shared Successfully',
          description: 'Record link has been shared.',
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Record link has been copied to clipboard.',
        });
      }
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Unable to share record. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      // Create a record item similar to History page format
      const recordItem = {
        id: recordId,
        title: title,
        type: recordType === 'service_request' ? 'service_request' : 
              recordType === 'screening_result' ? 'service_screening' : 
              'health_survey',
        data: record.type === 'database_service_request' || record.type === 'database_screening_result' 
              ? { savedToDatabase: true, id: recordData.id, ...recordData }
              : record.data
      };

      // Use similar deletion logic as History page
      let deleteSuccess = false;
      let dbDeletionSuccess = false;
      let localDeletionSuccess = false;

      if (recordItem.type === 'service_request') {
        // Delete from database if it exists
        if (recordItem.data?.savedToDatabase && recordItem.data?.id) {
          try {
            await servicesApi.deleteServiceRequest(recordItem.data.id);
            dbDeletionSuccess = true;
          } catch (dbError) {
            // Continue with localStorage cleanup
          }
        }

        // Delete from localStorage
        if (recordId.startsWith('service_request_')) {
          try {
            localStorage.removeItem(recordId);
            localDeletionSuccess = true;
          } catch (localError) {
            // Ignore localStorage errors
          }
        }

        deleteSuccess = dbDeletionSuccess || localDeletionSuccess;

      } else if (recordItem.type === 'service_screening') {
        // Delete screening result from database
        if (recordItem.data?.databaseResultId || recordItem.data?.id) {
          try {
            const resultId = recordItem.data.databaseResultId || recordItem.data.id;
            await servicesApi.deleteScreeningResult(resultId);
            dbDeletionSuccess = true;
          } catch (dbError) {
            // Continue with localStorage cleanup
          }
        }

        // Delete from localStorage
        if (recordId.startsWith('screening_results_')) {
          try {
            localStorage.removeItem(recordId);
            localDeletionSuccess = true;
          } catch (localError) {
            // Ignore localStorage errors
          }
        }

        deleteSuccess = dbDeletionSuccess || localDeletionSuccess;

      } else if (recordItem.type === 'health_survey') {
        // Delete health survey from localStorage
        try {
          localStorage.removeItem(recordId);
          deleteSuccess = true;
        } catch (localError) {
          // Ignore localStorage errors
        }
      }

      if (deleteSuccess) {
        toast({
          title: 'Record Deleted',
          description: `"${title}" has been removed from your history.`,
        });
        
        // Navigate back to history
        navigate('/history');
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Unable to delete this record. Please try again.',
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
      setDeleteDialogOpen(false);
    }
  };

  const renderServiceRequest = () => {
    // Handle different data sources for service requests
    let data;
    if (record.type === 'database_service_request') {
      // Database service request - use request_data field
      data = recordData.request_data || recordData;
    } else if (recordId.startsWith('service_request_') && record.data.request) {
      // localStorage service request - use request field
      data = record.data.request;
    } else {
      // Fallback to recordData
      data = recordData;
    }
    
    return (
      <div className="space-y-6">
        {/* Service Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <HeartPulse size={20} />
            Service Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-700">Service</p>
              <p className="text-lg text-blue-900">{title}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">Status</p>
              <p className="text-lg text-blue-900 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                {safeRenderValue(recordData?.status) || 'Submitted'}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        {(data?.fullName || data?.phoneNumber || data?.email) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={20} />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.fullName && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Full Name</p>
                  <p className="text-lg text-gray-800">{safeRenderValue(data.fullName)}</p>
                </div>
              )}
              {data.phoneNumber && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Phone Number</p>
                  <p className="text-lg text-gray-800 flex items-center gap-2">
                    <Phone size={16} />
                    {safeRenderValue(data.phoneNumber)}
                  </p>
                </div>
              )}
              {data.email && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Email</p>
                  <p className="text-lg text-gray-800">{safeRenderValue(data.email)}</p>
                </div>
              )}
              {data.age && (
                <div>
                  <p className="text-sm font-semibold text-gray-500">Age</p>
                  <p className="text-lg text-gray-800">{safeRenderValue(data.age)} years</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Information */}
        {(data?.deliveryMethod || data?.accessPoint || data?.deliveryLocation) && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
              <MapPin size={20} />
              Delivery Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data.deliveryMethod || data.accessPoint) && (
                <div>
                  <p className="text-sm font-semibold text-green-700">Delivery Method</p>
                  <p className="text-lg text-green-900">{safeRenderValue(data.deliveryMethod || data.accessPoint)}</p>
                </div>
              )}
              {data.deliveryLocation && (
                <div>
                  <p className="text-sm font-semibold text-green-700">Location</p>
                  <p className="text-lg text-green-900">{safeRenderValue(data.deliveryLocation)}</p>
                </div>
              )}
              {(data.deliveryDate || data.preferredDate) && (
                <div>
                  <p className="text-sm font-semibold text-green-700">Preferred Date</p>
                  <p className="text-lg text-green-900 flex items-center gap-2">
                    <Clock size={16} />
                    {new Date(data.deliveryDate || data.preferredDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {data.quantity && (
                <div>
                  <p className="text-sm font-semibold text-green-700">Quantity</p>
                  <p className="text-lg text-green-900">{safeRenderValue(data.quantity)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Additional Details</h3>
          <div className="space-y-3">
            {Object.entries(data || {}).map(([key, value]) => {
              // Skip already displayed fields
              const skipFields = ['fullName', 'phoneNumber', 'email', 'age', 'deliveryMethod', 'accessPoint', 'deliveryLocation', 'deliveryDate', 'preferredDate', 'quantity', 'timestamp', 'attachments'];
              if (skipFields.includes(key) || !value) return null;

              let displayValue = '';
              
              // Use safe render function
              displayValue = safeRenderValue(value);
              
              // Skip empty values
              if (!displayValue) return null;

              const fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={key} className="border-b border-gray-200 pb-2">
                  <p className="text-sm font-semibold text-gray-500">{fieldLabel}</p>
                  <p className="text-lg text-gray-800 whitespace-pre-wrap">{displayValue}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderHealthSurvey = () => (
    <div className="space-y-6">
      <div className="text-center bg-primary/10 p-6 rounded-2xl">
        <p className="font-semibold text-primary">Prevention Score</p>
        <p className="text-6xl font-bold text-primary my-1">{recordData.score}/10</p>
        <p className="text-primary/80">A great result!</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Recommendations</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {recordData.recommendations?.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderScreeningResult = () => {
    const data = record.type === 'database_screening_result' ? recordData : recordData;
    const answers = data.answers || data.answers_summary;
    
    return (
      <div className="space-y-6">
        {/* Score Display */}
        <div className="text-center bg-primary/10 p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="text-primary" size={24} />
            <p className="font-semibold text-primary text-lg">Eligibility Score</p>
          </div>
          <p className="text-6xl font-bold text-primary my-2">{data.score}%</p>
          <div className="flex items-center justify-center gap-2">
            {data.eligible ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : (
              <AlertTriangle className="text-orange-500" size={20} />
            )}
            <p className="text-primary/80 font-medium">
              {data.eligible ? 'Eligible for service' : 'Not currently eligible'}
            </p>
          </div>
        </div>

        {/* Service Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <HeartPulse size={20} />
            Service Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-700">Service</p>
              <p className="text-lg text-blue-900">{title}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">Screening Date</p>
              <p className="text-lg text-blue-900 flex items-center gap-2">
                <Calendar size={16} />
                {data.completed_at ? new Date(data.completed_at).toLocaleDateString() : 
                 data.completedAt ? new Date(data.completedAt).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Screening Answers */}
        {answers && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Screening Answers
            </h3>
            <div className="space-y-3">
              {typeof answers === 'object' ? (
                Object.entries(answers).map(([questionKey, answer], index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-500 mb-1">
                      Question {parseInt(questionKey.replace('question_', '')) + 1 || index + 1}
                    </p>
                    <p className="text-lg text-gray-800 capitalize">
                      {typeof answer === 'boolean' ? (answer ? 'Yes' : 'No') : String(answer)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-600">Screening answers not available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className={`p-4 rounded-lg border ${data.eligible ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${data.eligible ? 'text-green-900' : 'text-orange-900'}`}>
            {data.eligible ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            Recommendation
          </h3>
          <p className={`text-lg ${data.eligible ? 'text-green-800' : 'text-orange-800'}`}>
            {data.eligible 
              ? 'Based on your screening results, you are eligible for this service. You can proceed with your service request.'
              : 'Based on your screening results, you may not currently meet the eligibility criteria for this service. Please consult with a healthcare provider for personalized advice.'
            }
          </p>
        </div>

        {/* Completion Details */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock size={16} />
            <p className="text-sm">
              <strong>Completed:</strong> {
                data.completed_at ? new Date(data.completed_at).toLocaleString() :
                data.completedAt ? new Date(data.completedAt).toLocaleString() : 'Recently'
              }
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="bg-white p-6 rounded-2xl border space-y-6 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="flex items-center gap-4 pb-6 border-b">
        <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>

      {/* Record Metadata Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>

      {/* Content Sections Skeleton */}
      <div className="border-t pt-6 space-y-6">
        {/* Service Information Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-5 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-12"></div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-5 bg-gray-200 rounded w-36"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Information Section */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-5 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-5 bg-gray-200 rounded w-36"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border-b border-gray-200 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderError = () => (
    <div className="text-center py-10 px-6 bg-red-50 rounded-2xl border border-red-200">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Record</h3>
      <p className="text-red-600 mb-4">{error}</p>
      <div className="space-x-3">
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
        <Button onClick={() => navigate('/history')}>
          Back to History
        </Button>
      </div>
    </div>
  );
  
  const renderEmptyRecord = () => (
    <div className="text-center py-10 px-6 bg-yellow-50 rounded-2xl border border-yellow-200">
      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
      <h3 className="mt-4 text-lg font-semibold text-yellow-800">Record Not Found</h3>
      <p className="mt-2 text-sm text-yellow-600">
        The record you are looking for could not be found. It might have been deleted or the link is incorrect.
      </p>
      <Button onClick={() => navigate('/history')} className="mt-6">Go Back to History</Button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{title} - NetLife Records</title>
      </Helmet>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <header className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
              <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
          </div>
          
          {/* Action buttons - responsive design */}
          <div className="flex items-center space-x-2">
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download size={16} className="mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 size={16} className="mr-2" />
                Delete
              </Button>
            </div>

            {/* Mobile dropdown menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 size={16} className="mr-2" />
                    Share Record
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Record
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="bg-white p-6 rounded-2xl border">
            {renderLoading()}
          </div>
        ) : error ? (
          <div className="bg-white p-6 rounded-2xl border">
            {renderError()}
          </div>
        ) : record && record.profile ? (
          <div className="bg-white p-6 rounded-2xl border space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-6 border-b">
              <Avatar className="h-16 w-16">
                {renderAvatar(record.profile)}
              </Avatar>
              <div>
                <h2 className="font-bold text-lg text-gray-900">
                  <span className="username-gradient">{record.profile.username}</span>
                </h2>
                <p className="text-sm text-gray-500">Record Details</p>
              </div>
            </div>

            {/* Record Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-primary" />
                <div>
                  <strong>Date:</strong> {
                    recordData?.created_at ? new Date(recordData.created_at).toLocaleDateString() :
                    recordData?.completed_at ? new Date(recordData.completed_at).toLocaleDateString() :
                    record.data?.completedAt ? new Date(record.data.completedAt).toLocaleDateString() :
                    record.data?.request?.timestamp ? new Date(record.data.request.timestamp).toLocaleDateString() :
                    recordId.startsWith('service_request_') ? new Date(parseInt(recordId.split('_')[3])).toLocaleDateString() :
                    'Recently'
                  }
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                {recordType === 'service_request' ? <HeartPulse size={16} className="text-primary" /> : <FileText size={16} className="text-primary" />}
                <div>
                  <strong>Type:</strong> {
                    recordType === 'service_request' ? 'Service Request' : 
                    recordType === 'screening_result' ? 'Screening Result' :
                    recordType === 'health_survey' ? 'Health Survey' :
                    'Record'
                  }
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle size={16} className="text-primary" />
                <div>
                  <strong>Status:</strong> {
                    recordType === 'service_request' ? (
                      recordData?.status || 
                      (record.data?.savedToDatabase ? 'Submitted' : 'Pending Sync') ||
                      'Submitted'
                    ) : 
                    recordType === 'screening_result' ? 'Complete' :
                    'Complete'
                  }
                </div>
              </div>
            </div>

            {/* Record Content */}
            <div className="border-t pt-6">
              {recordType === 'service_request' && renderServiceRequest()}
              {recordType === 'screening_result' && renderScreeningResult()}
              {recordType === 'health_survey' && renderHealthSurvey()}
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border">
            {renderEmptyRecord()}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{title}"? This action cannot be undone and will permanently remove this record from your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete Record
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default RecordViewer;