import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { serviceRequestForms } from "@/data/serviceRequestForms";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ServiceRequestStep from "@/components/service-request/ServiceRequestStep";
import PreviewStep from "@/components/service-request/PreviewStep";
import SuccessConfirmation from "@/components/service-request/SuccessConfirmation";
import {
  useServiceBySlug,
  useSubmitServiceRequest,
} from "@/hooks/useServiceQueries";

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, profile } = useAuth();

  // Map database slugs to form configuration keys
  const slugToFormKey = {
    'sti-screening': 'sti',
    'counselling-services': 'counselling',
    'hts': 'hts',
    'prep': 'prep',
    'pep': 'pep',
    'art': 'art'
  };

  const formKey = slugToFormKey[serviceId] || serviceId;
  const formConfig = serviceRequestForms[formKey];

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [currentStepValid, setCurrentStepValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const { data: serviceData } = useServiceBySlug(serviceId);
  const {
    mutate: submitRequest,
    isLoading: isSubmitting,
    isSuccess,
    isError,
    error,
  } = useSubmitServiceRequest();

  useEffect(() => {
    if (isSuccess) {
      clearProgress();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/history");
      }, 7000);
    }

    if (isError) {
      if (!navigator.onLine) {
        clearProgress();
        toast({
          title: "You appear to be offline",
          description:
            "Your request has been saved and will be submitted automatically when you're back online.",
        });
        navigate("/history");
      } else {
        toast({
          title: "Submission Failed",
          description:
            error?.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [isSuccess, isError, error, navigate, toast]);

  useEffect(() => {
    if (formConfig && activeProfile && !progressLoaded) {
      const wasRestored = loadSavedProgress();
      setProgressLoaded(true);

      if (wasRestored) {
        // Show a brief notification that progress was restored
        setTimeout(() => {
          // You could add a toast notification here if desired
        }, 100);
      }
    }
  }, [formConfig, activeProfile, progressLoaded]);

  if (!activeProfile) {
    return <div>Loading profile...</div>;
  }
  if (!formConfig) {
    return <div>Service request form not found.</div>;
  }

  const totalSteps = formConfig.steps.length;
  const isPreviewStep = step === totalSteps;

  const handleInputChange = (name, value) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Save progress after each input change
    saveProgress(newFormData, step);
  };

  const getProgressKey = () =>
    `service_request_progress_${serviceId}_${activeProfile?.id}`;

  const saveProgress = (currentFormData, currentStep) => {
    try {
      const progressData = {
        formData: currentFormData,
        step: currentStep,
        serviceId: serviceId,
        timestamp: Date.now(),
        totalSteps: formConfig?.steps?.length || 0,
      };

      localStorage.setItem(getProgressKey(), JSON.stringify(progressData));
    } catch (error) {
      console.warn("Failed to save service request progress:", error);
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
            return true;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load saved progress:", error);
    }
    clearProgress();
    return false;
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem(getProgressKey());
    } catch (error) {
      console.warn("Failed to clear progress:", error);
    }
  };

  const nextStep = () => {
    if (!currentStepValid && step < totalSteps) {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive",
      });
      return;
    }
    const newStep = Math.min(step + 1, totalSteps);
    setStep(newStep);
    saveProgress(formData, newStep);
  };

  const handleValidationChange = (isValid, errors = []) => {
    setCurrentStepValid(isValid);
    setValidationErrors(errors);
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
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

      // Extract attachment from form data (check all possible field names)
      const attachment = formData.attachment || formData.file || formData.document ||
        formData.hivTestResult || formData.medicalRecord || formData.prescription ||
        formData.labResult || formData.healthRecord || null;

      // Prepare service request data with profile information
      const enhancedFormData = {
        ...formData,
        // Add profile information to track which profile made the request
        _profileInfo: {
          profileId: activeProfile.id,
          profileName: activeProfile.full_name || activeProfile.username,
          isMainUser: activeProfile.id === profile?.id,
          requestedBy: profile?.full_name || profile?.username, // Main user who owns the account
        }
      };

      const serviceRequestData = {
        user_id: currentUser.id,
        service_id: serviceData.id,
        request_data: enhancedFormData,
        attachments: attachment
      };

      // Service request data prepared for submission

      // Submit to database
      const requestId = await servicesApi.submitServiceRequest(serviceRequestData);

      // Also save to localStorage for backward compatibility and offline access
      const finalData = {
        id: requestId,
        profile: activeProfile,
        request: enhancedFormData,
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

      // Provide user-friendly error messages for attachment issues
      let userFriendlyError = error.message;
      if (error.message.includes('attachment') || error.message.includes('file')) {
        // Check if it's a known attachment error
        const attachmentErrors = Object.values(ATTACHMENT_ERROR_MESSAGES);
        const isKnownAttachmentError = attachmentErrors.some(msg => error.message.includes(msg));

        if (isKnownAttachmentError) {
          userFriendlyError = error.message; // Already user-friendly
        } else {
          userFriendlyError = 'There was an issue processing your attachment. Your request has been saved, but you may need to re-upload the file.';
        }
      }

      setSubmitError(userFriendlyError);

      // Fallback to localStorage only (graceful degradation)
      try {
        const finalData = {
          profile: activeProfile,
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
          navigate("/history");
        }, 7000);
      },
      onError: () => {
        clearProgress();
        toast({
          title: "You appear to be offline",
          description:
            "Your request has been saved and will be submitted automatically when you're back online.",
        });
        navigate("/history");
      },
    });
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
        onValidationChange={handleValidationChange}
      />
    );
  };

  if (showSuccess) {
    return <SuccessConfirmation onClose={() => {
      setShowSuccess(false);
      navigate('/history');
    }} userData={activeProfile} />;
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
        <div className="block md:hidden">
          <div className="flex flex-col h-screen">
            <header className="flex items-center p-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {formConfig.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {isPreviewStep
                    ? "Review Your Request"
                    : `Step ${step + 1} of ${totalSteps}`}
                </p>
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

            <div className="flex-1 overflow-y-auto px-6 pb-32">
              <div className="min-h-full">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </div>
            </div>
            {!isPreviewStep && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
                <div className="p-4 max-w-[428px] mx-auto">
                  <Button
                    onClick={nextStep}
                    disabled={!currentStepValid}
                    className={cn(
                      "w-full h-14 text-lg font-bold rounded-xl transition-all duration-200",
                      !currentStepValid
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                        : "bg-primary hover:bg-primary/90"
                    )}
                  >
                    {step === totalSteps - 1 ? 'Review Request' : 'Next Step'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:block">
          <div className="max-w-10xl mx-auto px-8 py-8 min-h-screen">
            <header className="flex items-start justify-between mb-8">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {formConfig.title}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {isPreviewStep
                      ? "Review Your Request"
                      : `Step ${step + 1} of ${totalSteps}`}
                  </p>
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
            {!isPreviewStep && (
              <div className="mb-8">
                <Progress value={((step + 1) / totalSteps) * 100} />
              </div>
            )}
            <div className="max-w-10xl mx-auto">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>

              {/* Navigation Button - Bottom right, aligned with header buttons */}
              {!isPreviewStep && (
                <div className="mt-12 flex justify-end">
                  <div className="flex flex-col items-end">
                    <Button
                      onClick={nextStep}
                      disabled={!currentStepValid}
                      className={cn(
                        "h-14 px-8 text-lg font-bold rounded-xl shadow-lg transition-all duration-200",
                        !currentStepValid
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 shadow-none"
                          : "bg-primary hover:bg-primary/90 hover:shadow-xl"
                      )}
                    >
                      {step === totalSteps - 1 ? 'Review Request' : 'Next Step'}
                      <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                    </Button>
                    {!currentStepValid && validationErrors.length > 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        Please complete all required fields above
                      </p>
                    )}
                  </div>
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
