import React from "react";
import { AnimatePresence } from "framer-motion";
import { useWhatsAppAuth } from "@/hooks/useWhatsAppAuth";
import AuthLayout from "./AuthLayout";
import PhoneStep from "./PhoneStep";
import VerificationStep from "./VerificationStep";

const WhatsAppAuth = ({ onBack, onContinue }) => {
  const {
    step,
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    activeTab,
    setActiveTab,
    isLoading,
    networkStatus,
    resendTimer,
    isResendTimerActive,
    handlePhoneSubmit,
    handleVerifyCode,
    handleResendCode,
    goBackToPhoneStep,
  } = useWhatsAppAuth(onContinue);

  const handleBackNavigation = () => {
    if (step === "verify") {
      goBackToPhoneStep();
    } else {
      onBack();
    }
  };

  return (
    <AuthLayout onBack={handleBackNavigation}>
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <PhoneStep
            key="phone-step"
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            onSubmit={handlePhoneSubmit}
            isLoading={isLoading.send}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            networkStatus={networkStatus}
          />
        ) : (
          <VerificationStep
            key="verify-step"
            phoneNumber={phoneNumber}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            onVerify={handleVerifyCode}
            onResend={handleResendCode}
            onEditNumber={goBackToPhoneStep}
            isLoading={isLoading}
            resendTimer={resendTimer}
            isResendTimerActive={isResendTimerActive}
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default WhatsAppAuth;
