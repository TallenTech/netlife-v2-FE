import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { serviceRequestForms } from '@/data/serviceRequestForms';
import { useUserData } from '@/contexts/UserDataContext';
import ServiceRequestStep from '@/components/service-request/ServiceRequestStep';
import PreviewStep from '@/components/service-request/PreviewStep';
import SuccessConfirmation from '@/components/service-request/SuccessConfirmation';

const ServiceRequest = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useUserData();
  const formConfig = serviceRequestForms[serviceId];

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  if (!formConfig) {
    return <div>Service request form not found.</div>;
  }

  if (!activeProfile) {
    return <div>Loading profile...</div>;
  }

  const totalSteps = formConfig.steps.length;
  const isPreviewStep = step === totalSteps;

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => {
    if (step > 0) {
        setStep(s => s - 1);
    } else {
        navigate(-1);
    }
  };
  const goToStep = (s) => setStep(s);

  const handleSubmit = () => {
    const finalData = {
        profile: activeProfile,
        request: formData,
        completedAt: new Date().toISOString(),
    };
    const recordId = `service_request_${serviceId}_${Date.now()}`;
    localStorage.setItem(recordId, JSON.stringify(finalData));
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/history');
    }, 7000);
  };

  const renderStepContent = () => {
    if (isPreviewStep) {
      return <PreviewStep formData={formData} setFormData={setFormData} formConfig={formConfig} goToStep={goToStep} onSubmit={handleSubmit} />;
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
      <div className="mobile-container bg-gray-50">
        <div className="flex flex-col h-screen">
          <header className="flex items-center p-6">
            <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{formConfig.title}</h1>
              <p className="text-sm text-gray-500">{isPreviewStep ? 'Review Your Request' : `Step ${step + 1} of ${totalSteps}`}</p>
            </div>
          </header>

          {!isPreviewStep && (
            <div className="px-6 mb-6">
              <Progress value={((step + 1) / totalSteps) * 100} />
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {!isPreviewStep && (
            <div className="mt-auto p-4 sm:p-6 bg-white border-t fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto">
               <div className="max-w-md mx-auto">
                 <Button onClick={nextStep} className="w-full h-14 text-lg font-bold rounded-xl">
                    {step === totalSteps - 1 ? 'Proceed' : 'Next'}
                 </Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ServiceRequest;