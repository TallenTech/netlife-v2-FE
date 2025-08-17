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
import { fileToBase64 } from "@/utils/attachmentHelpers";

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, profile } = useAuth();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [currentStepValid, setCurrentStepValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const { data: serviceData } = useServiceBySlug(serviceId);
  const { mutateAsync: submitRequestAsync, isLoading: isSubmitting } =
    useSubmitServiceRequest();

  // Try to get form config by serviceId first, then by service name
  let formConfig = serviceRequestForms[serviceId];

  // If not found by serviceId, try to match by service name
  if (!formConfig && serviceData?.name) {
    const serviceName = serviceData.name.toLowerCase();
    const availableForms = Object.keys(serviceRequestForms);

    // Map service names to form keys
    const nameToFormMap = {
      "sti screening": "sti-screening",
      counseling: "counselling-services",
      counselling: "counselling-services",
      "counselling services": "counselling-services",
      "hiv testing": "hts",
      "hiv testing services (hts)": "hts",
      "prep access": "prep",
      "pre-exposure prophylaxis (prep)": "prep",
      "pep access": "pep",
      "post-exposure prophylaxis (pep)": "pep",
      "art support": "art",
      "antiretroviral therapy (art)": "art",
    };

    const mappedFormKey = nameToFormMap[serviceName];
    if (mappedFormKey && serviceRequestForms[mappedFormKey]) {
      formConfig = serviceRequestForms[mappedFormKey];
    }
  }

  useEffect(() => {
    if (formConfig && activeProfile && !progressLoaded) {
      loadSavedProgress();
      setProgressLoaded(true);
    }
  }, [formConfig, activeProfile, progressLoaded]);

  if (!activeProfile) return <div>Loading profile...</div>;
  if (!formConfig) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Service Not Available
          </h2>
          <p className="text-gray-600 mb-4">
            The request form for this service is not currently available.
          </p>
          <p className="text-sm text-gray-500 mb-4">Service ID: {serviceId}</p>
          <Button
            onClick={() => navigate("/services")}
            className="bg-primary text-white"
          >
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  const totalSteps = formConfig.steps.length;
  const isPreviewStep = step === totalSteps;

  const handleInputChange = (name, value) => {
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    saveProgress(newFormData, step);
  };

  const getProgressKey = () =>
    `service_request_progress_${serviceId}_${activeProfile?.id}`;

  const saveProgress = (currentFormData, currentStep) => {
    try {
      localStorage.setItem(
        getProgressKey(),
        JSON.stringify({
          formData: currentFormData,
          step: currentStep,
          serviceId: serviceId,
          timestamp: Date.now(),
          totalSteps: formConfig.steps.length,
        })
      );
    } catch (error) {}
  };

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(getProgressKey());
      if (saved) {
        const data = JSON.parse(saved);
        if (
          data.serviceId === serviceId &&
          data.totalSteps === formConfig.steps.length &&
          Date.now() - data.timestamp < 24 * 60 * 60 * 1000
        ) {
          setFormData(data.formData || {});
          setStep(data.step || 0);
        }
      }
    } catch (error) {
      clearProgress();
    }
  };

  const clearProgress = () => {
    try {
      localStorage.removeItem(getProgressKey());
    } catch (error) {}
  };

  const nextStep = () => {
    if (!currentStepValid && step < totalSteps) {
      toast({
        title: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }
    const newStep = Math.min(step + 1, totalSteps);
    setStep(newStep);
    saveProgress(formData, newStep);
  };

  const prevStep = () => (step > 0 ? setStep(step - 1) : navigate(-1));
  const goToStep = (s) => setStep(s);
  const handleValidationChange = (isValid) => setCurrentStepValid(isValid);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!serviceData || !profile || !activeProfile) {
      toast({
        title: "Error",
        description: "User or service data is missing.",
        variant: "destructive",
      });
      return;
    }

    const finalFormData = { ...formData };

    const attachmentFile =
      finalFormData.attachment || finalFormData.file || finalFormData.document;

    if (attachmentFile && attachmentFile instanceof File) {
      try {
        console.log("Converting attachment to Base64...");
        const base64String = await fileToBase64(attachmentFile);
        finalFormData.attachment = {
          name: attachmentFile.name,
          data: base64String,
        };
        delete finalFormData.file;
        delete finalFormData.document;
        console.log("Attachment converted successfully.");
      } catch (error) {
        console.error("Failed to process attachment:", error);
        toast({
          title: "Attachment Error",
          description: "Could not process the attached file.",
          variant: "destructive",
        });
        return;
      }
    } else {
      delete finalFormData.attachment;
      delete finalFormData.file;
      delete finalFormData.document;
    }

    const serviceRequestData = {
      user_id: profile.id,
      service_id: serviceData.id,
      request_data: {
        ...finalFormData,
        _profileInfo: {
          profileId: activeProfile.id,
          profileName: activeProfile.full_name || activeProfile.username,
          isMainUser: activeProfile.id === profile.id,
          requestedBy: profile.full_name || profile.username,
        },
      },
    };

    try {
      await submitRequestAsync(serviceRequestData);

      clearProgress();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/history");
      }, 7000);
    } catch (error) {
      if (!navigator.onLine) {
        clearProgress();
        toast({
          title: "You appear to be offline",
          description:
            "Your request has been saved and will be submitted when you're back online.",
        });
        navigate("/history");
      } else {
        toast({
          title: "Submission Failed",
          description:
            error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const renderStepContent = () => {
    if (isPreviewStep) {
      return (
        <PreviewStep
          formData={formData}
          setFormData={setFormData}
          formConfig={formConfig}
          goToStep={goToStep}
          onSubmit={handleSubmit}
          submitting={isSubmitting}
        />
      );
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
    return (
      <SuccessConfirmation
        onClose={() => {
          setShowSuccess(false);
          navigate("/history");
        }}
        userData={activeProfile}
      />
    );
  }

  const handleBack = () =>
    isPreviewStep ? setStep(totalSteps - 1) : prevStep();

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
                      "w-full h-14 text-lg font-bold rounded-xl",
                      !currentStepValid &&
                        "bg-gray-300 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    {step === totalSteps - 1 ? "Review Request" : "Next Step"}
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
              {!isPreviewStep && (
                <div className="mt-12 flex justify-end">
                  <div className="flex flex-col items-end">
                    <Button
                      onClick={nextStep}
                      disabled={!currentStepValid}
                      className={cn(
                        "h-14 px-8 text-lg font-bold rounded-xl shadow-lg",
                        !currentStepValid &&
                          "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 shadow-none"
                      )}
                    >
                      {step === totalSteps - 1 ? "Review Request" : "Next Step"}
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
