import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { whatsappAuth } from "@/services/whatsappService";
import { useCountdown } from "./useCountdown";
import {
  cleanPhoneNumber,
  validatePhoneNumber,
  formatPhoneNumberForDisplay,
} from "@/lib/phoneUtils";
import { handleError } from "@/lib/errorHandling";

export const useWhatsAppAuth = (onSuccess) => {
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [activeTab, setActiveTab] = useState("join");
  const [isLoading, setIsLoading] = useState({
    send: false,
    verify: false,
    resend: false,
  });
  const [networkStatus, setNetworkStatus] = useState("online");
  const { toast } = useToast();
  const {
    seconds: resendTimer,
    start: startResendTimer,
    isActive: isResendTimerActive,
  } = useCountdown(60);

  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online");
    const handleOffline = () => setNetworkStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleApiError = (error, operation) => {
    if (networkStatus === "offline") {
      return handleError(toast, "NETWORK_ERROR", "You appear to be offline.");
    }
    const errorCode = error?.code || error?.error;
    handleError(toast, errorCode, error.message);
    console.error(`${operation} error:`, error);
  };

  const handlePhoneSubmit = async () => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      return handleError(toast, "INVALID_PHONE_NUMBER", validation.error);
    }

    setIsLoading((prev) => ({ ...prev, send: true }));
    try {
      await whatsappAuth.sendCode(validation.cleanedNumber);
      setStep("verify");
      startResendTimer();
      toast({
        title: "Code Sent!",
        description: `Code sent to ${formatPhoneNumberForDisplay(
          validation.cleanedNumber
        )}`,
      });
    } catch (error) {
      handleApiError(error, "sendCode");
    } finally {
      setIsLoading((prev) => ({ ...prev, send: false }));
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      return handleError(
        toast,
        "INVALID_CODE",
        "Please enter the 6-digit code."
      );
    }

    setIsLoading((prev) => ({ ...prev, verify: true }));
    try {
      const result = await whatsappAuth.verifyCode(
        phoneNumber,
        verificationCode
      );

      if (result.success && onSuccess) {
        onSuccess(result.user, activeTab === "login");
      } else {
        setVerificationCode("");
      }
    } catch (error) {
      handleApiError(error, "verifyCode");
    } finally {
      setIsLoading((prev) => ({ ...prev, verify: false }));
    }
  };

  const handleResendCode = async () => {
    if (isResendTimerActive || isLoading.resend) return;

    setIsLoading((prev) => ({ ...prev, resend: true }));
    try {
      await whatsappAuth.sendCode(phoneNumber);
      startResendTimer();
      toast({
        title: "Code Resent",
        description: "A new code has been sent.",
      });
    } catch (error) {
      handleApiError(error, "resendCode");
    } finally {
      setIsLoading((prev) => ({ ...prev, resend: false }));
    }
  };

  const goBackToPhoneStep = () => {
    setStep("phone");
    setVerificationCode("");
  };

  return {
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
  };
};
