import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageCircle, Shield, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { whatsappAuth } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NetLifeLogo from '@/components/NetLifeLogo';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InputMask from 'react-input-mask';
import { Link } from 'react-router-dom';
import { 
  cleanPhoneNumber, 
  validatePhoneNumber, 
  formatPhoneNumberForDisplay,
  isPhoneNumberComplete,
  getPhoneNumberMask,
  normalizePhoneNumberInput
} from '@/lib/phoneUtils';
import {
  handleError,
  classifyNetworkError,
  getRetryInfo,
  formatCountdown,
  handleValidationError
} from '@/lib/errorHandling';

// Loading Button Component for better UX
const LoadingButton = ({ isLoading, loadingText, children, ...props }) => (
  <Button {...props} disabled={isLoading || props.disabled}>
    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
    {isLoading ? loadingText : children}
  </Button>
);

const AuthForm = ({ isLogin, phoneNumber, setPhoneNumber, onSubmit, isLoading, validatePhone }) => {
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Normalize the input to help users
    value = normalizePhoneNumberInput(value);
    setPhoneNumber(value);
    
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError('');
    }
    
    // Validate if phone number looks complete
    if (isPhoneNumberComplete(value)) {
      const validation = validatePhone(value);
      if (!validation.isValid) {
        setPhoneError(validation.error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col"
    >
      <div className="space-y-4 mb-8">
        <label className="text-gray-800 font-medium">WhatsApp Phone Number</label>
        <div className="space-y-2">
          <InputMask
              mask={getPhoneNumberMask(phoneNumber)}
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isLoading}
          >
              {(inputProps) => (
                <Input 
                  {...inputProps} 
                  type="tel" 
                  placeholder="+256 XXX XXX XXX" 
                  className={`text-lg h-14 ${phoneError ? 'border-red-500 focus:border-red-500' : ''}`}
                />
              )}
          </InputMask>
          {phoneError && (
            <p className="text-red-500 text-sm flex items-center">
              <span className="mr-1">⚠️</span>
              {phoneError}
            </p>
          )}
          <p className="text-gray-500 text-xs">
            Enter your Uganda phone number (e.g., +256 701 234 567)
          </p>
        </div>
      </div>

      <LoadingButton
        onClick={onSubmit}
        isLoading={isLoading}
        loadingText="Sending..."
        disabled={!phoneNumber || !isPhoneNumberComplete(phoneNumber) || phoneError}
        className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl mb-6"
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        {isLogin ? 'Login with WhatsApp' : 'Join with WhatsApp'}
      </LoadingButton>

      <div className="text-center space-y-2">
        <p className="text-gray-600 text-sm">No passwords. No emails.</p>
        <p className="text-gray-500 text-xs">
          By proceeding, you accept our{' '}
          <Link to="/terms-of-service" className="text-primary underline">Terms of Service</Link> and{' '}
          <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link>
        </p>
      </div>
    </motion.div>
  );
};


const WhatsAppAuth = ({ onBack, onContinue }) => {
  const [step, setStep] = useState('phone'); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loadingStates, setLoadingStates] = useState({
    sendingCode: false,
    verifyingCode: false,
    resendingCode: false
  });
  const [resendTimer, setResendTimer] = useState(0);
  const [activeTab, setActiveTab] = useState('join');
  const [retryAttempts, setRetryAttempts] = useState({
    sendCode: 0,
    verifyCode: 0,
    resendCode: 0
  });
  const [networkStatus, setNetworkStatus] = useState('online');
  const { toast } = useToast();

  // Helper function to update specific loading state
  const setLoadingState = (key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  // Helper function to update retry attempts
  const incrementRetryAttempt = (key) => {
    setRetryAttempts(prev => ({ ...prev, [key]: prev[key] + 1 }));
  };

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced countdown timer with better formatting
  const startCountdownTimer = (seconds, callback = null) => {
    setResendTimer(seconds);
    
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (callback) callback();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return interval;
  };





  // Enhanced error handling with retry logic
  const handleApiError = (error, operation, fallbackMessage = null) => {
    // Check network status first
    if (networkStatus === 'offline') {
      return handleError(toast, 'NETWORK_ERROR', 'You appear to be offline. Please check your connection.');
    }

    // Classify the error
    const errorCode = error?.code || error?.error || classifyNetworkError(error);
    
    // Handle the error with comprehensive messaging
    const errorInfo = handleError(toast, errorCode, fallbackMessage || error?.message);
    
    // Log for debugging
    console.error(`${operation} error:`, error);
    
    return errorInfo;
  };

  // Retry logic with exponential backoff
  const shouldRetry = (operation, errorCode) => {
    const retryInfo = getRetryInfo(errorCode);
    const currentAttempts = retryAttempts[operation] || 0;
    
    return retryInfo.canRetry && currentAttempts < retryInfo.maxAttempts;
  };

  const handlePhoneSubmit = async () => {
    // Validate phone number first
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      handleValidationError('phoneNumber', validation.error);
      handleError(toast, 'INVALID_PHONE_NUMBER', validation.error);
      return;
    }

    setLoadingState('sendingCode', true);
    
    try {
      const cleanedPhone = validation.cleanedNumber;
      console.log('Sending OTP to:', cleanedPhone);
      
      const result = await whatsappAuth.sendCode(cleanedPhone);
      
      if (result.success) {
        // Reset retry attempts on success
        setRetryAttempts(prev => ({ ...prev, sendCode: 0 }));
        
        setStep('verify');
        startCountdownTimer(60);

        toast({
          title: "Code Sent!",
          description: result.message || `Verification code sent to ${formatPhoneNumberForDisplay(cleanedPhone)}`,
        });

        // In development mode, show the code for testing
        if (result.code) {
          console.log('Development mode - OTP code:', result.code);
          toast({
            title: "Development Mode",
            description: `OTP Code: ${result.code}`,
            duration: 10000,
          });
        }
      } else {
        incrementRetryAttempt('sendCode');
        const errorInfo = handleApiError(result, 'sendCode', "Failed to send verification code");
        
        // Handle rate limiting with specific timer
        if (result.error === 'RATE_LIMIT_EXCEEDED') {
          const retryDelay = result.retryAfter || 300; // 5 minutes default
          startCountdownTimer(retryDelay);
        }
      }
    } catch (error) {
      incrementRetryAttempt('sendCode');
      handleApiError(error, 'sendCode', "Network error while sending verification code");
    } finally {
      setLoadingState('sendingCode', false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      handleError(toast, 'INVALID_CODE', "Please enter the complete 6-digit code");
      return;
    }

    setLoadingState('verifyingCode', true);
    
    try {
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        handleError(toast, 'INVALID_PHONE_NUMBER', validation.error);
        return;
      }

      const cleanedPhone = validation.cleanedNumber;
      console.log('Verifying OTP for:', cleanedPhone, 'Code:', verificationCode);
      
      const result = await whatsappAuth.verifyCode(cleanedPhone, verificationCode);
      
      if (result.success) {
        // Reset retry attempts on success
        setRetryAttempts(prev => ({ ...prev, verifyCode: 0 }));
        
        // Store authentication data
        const authData = {
          phoneNumber: cleanedPhone,
          verified: true,
          timestamp: Date.now(),
          user: result.user
        };
        
        localStorage.setItem('netlife_auth', JSON.stringify(authData));
        
        toast({
          title: "Verification Successful!",
          description: result.message || "Your phone number has been verified",
        });

        // Pass the user data to the parent component
        onContinue(result.user || { phoneNumber: cleanedPhone, verified: true }, activeTab === 'login');
      } else {
        incrementRetryAttempt('verifyCode');
        handleApiError(result, 'verifyCode', "Verification failed");

        // Clear the verification code on certain errors
        if (['INVALID_CODE', 'CODE_EXPIRED', 'CODE_ALREADY_USED'].includes(result.error)) {
          setVerificationCode('');
        }
        
        // Handle max attempts exceeded
        if (result.error === 'MAX_ATTEMPTS_EXCEEDED') {
          startCountdownTimer(60); // 1 minute before allowing new code request
        }
      }
    } catch (error) {
      incrementRetryAttempt('verifyCode');
      handleApiError(error, 'verifyCode', "Network error during verification");
      
      // Clear the verification code on network error
      setVerificationCode('');
    } finally {
      setLoadingState('verifyingCode', false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || loadingStates.resendingCode) return;
    
    setLoadingState('resendingCode', true);
    
    try {
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        handleError(toast, 'INVALID_PHONE_NUMBER', validation.error);
        return;
      }

      const cleanedPhone = validation.cleanedNumber;
      console.log('Resending OTP to:', cleanedPhone);
      
      const result = await whatsappAuth.sendCode(cleanedPhone);
      
      if (result.success) {
        // Reset retry attempts on success
        setRetryAttempts(prev => ({ ...prev, resendCode: 0 }));
        
        startCountdownTimer(60);

        toast({
          title: "Code Resent",
          description: result.message || "A new verification code has been sent",
        });

        // In development mode, show the code for testing
        if (result.code) {
          console.log('Development mode - Resent OTP code:', result.code);
          toast({
            title: "Development Mode",
            description: `New OTP Code: ${result.code}`,
            duration: 10000,
          });
        }
      } else {
        incrementRetryAttempt('resendCode');
        const errorInfo = handleApiError(result, 'resendCode', "Failed to resend verification code");
        
        // Handle rate limiting with specific timer
        if (result.error === 'RATE_LIMIT_EXCEEDED') {
          const retryDelay = result.retryAfter || 300; // 5 minutes default
          startCountdownTimer(retryDelay);
        }
      }
    } catch (error) {
      incrementRetryAttempt('resendCode');
      handleApiError(error, 'resendCode', "Network error while resending code");
    } finally {
      setLoadingState('resendingCode', false);
    }
  };

  return (
    <>
      {/* Mobile Layout - Keep exactly as it was */}
      <div className="lg:hidden mobile-container bg-white">
        <div className="h-screen flex flex-col">
          <div className="flex items-center justify-between p-6 pt-12">
            <button
              onClick={step === 'verify' ? () => setStep('phone') : onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <NetLifeLogo className="w-12 h-12" />
          </div>

          <div className="flex-1 flex flex-col px-6 pb-6">
          {step === 'phone' ? (
            <div className="flex-1 flex flex-col">
              <div className="border-2 border-primary/20 rounded-2xl p-6 mb-8 text-primary">
                <div className="flex items-center space-x-4 mb-4">
                  <NetLifeLogo className="w-12 h-12" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Welcome to NetLife</h1>
                    <p className="text-gray-600 text-sm">Secure WhatsApp authentication</p>
                  </div>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="join"><UserPlus className="w-4 h-4 mr-2"/>Join</TabsTrigger>
                  <TabsTrigger value="login"><LogIn className="w-4 h-4 mr-2"/>Login</TabsTrigger>
                </TabsList>
                <TabsContent value="join" className="pt-4">
                    <AuthForm 
                        isLogin={false} 
                        phoneNumber={phoneNumber} 
                        setPhoneNumber={setPhoneNumber}
                        onSubmit={handlePhoneSubmit}
                        isLoading={loadingStates.sendingCode}
                        validatePhone={validatePhoneNumber}
                    />
                </TabsContent>
                <TabsContent value="login" className="pt-4">
                    <AuthForm 
                        isLogin={true} 
                        phoneNumber={phoneNumber}
                        setPhoneNumber={setPhoneNumber}
                        onSubmit={handlePhoneSubmit}
                        isLoading={loadingStates.sendingCode}
                        validatePhone={validatePhoneNumber}
                    />
                </TabsContent>
              </Tabs>
              <div className="flex flex-col items-center justify-center space-y-2 mt-auto text-gray-500">
                {networkStatus === 'offline' && (
                  <div className="flex items-center space-x-2 text-red-500 text-sm">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>You appear to be offline</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm">Your privacy and security are our priority</span>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="border-2 border-primary/20 rounded-2xl p-6 mb-8 text-center text-primary">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold mb-2 text-gray-900">Verify Your Number</h1>
                <p className="text-gray-600 text-sm mb-2">
                  We've sent a 6-digit code to
                </p>
                <p className="font-semibold text-gray-800">{phoneNumber}</p>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-gray-800 font-medium">Enter Verification Code</label>
                 <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="_ _ _ _ _ _"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-14 text-center text-2xl font-bold tracking-[1.5em]"
                />
              </div>

              <LoadingButton
                onClick={handleVerifyCode}
                isLoading={loadingStates.verifyingCode}
                loadingText="Verifying..."
                disabled={verificationCode.length !== 6}
                className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-semibold text-lg rounded-xl mb-6"
              >
                Verify Code
              </LoadingButton>

              <div className="text-center space-y-2">
                <p className="text-gray-600 text-sm">Didn't receive the code?</p>
                <button
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || loadingStates.resendingCode}
                  className="text-primary font-medium underline disabled:text-gray-400 disabled:no-underline flex items-center justify-center"
                >
                  {loadingStates.resendingCode && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {resendTimer > 0 ? `Resend in ${formatCountdown(resendTimer)}` : 
                   loadingStates.resendingCode ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </motion.div>
          )}
          </div>
        </div>
      </div>

      {/* Desktop Layout - New responsive design */}
      <div className="hidden lg:block min-h-screen bg-gray-50">
        {/* Header with back button and logo at extreme ends */}
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={step === 'verify' ? () => setStep('phone') : onBack}
              className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <NetLifeLogo className="w-14 h-14" />
          </div>
        </div>

        {/* Main Content Container - Centered with controlled width */}
        <div className="flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            {step === 'phone' ? (
              <div className="space-y-6">
                <div className="border-2 border-primary/20 rounded-xl p-6 text-primary">
                  <div className="flex items-center space-x-4 mb-4">
                    <NetLifeLogo className="w-12 h-12" />
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Welcome to NetLife</h1>
                      <p className="text-gray-600 text-sm">Secure WhatsApp authentication</p>
                    </div>
                  </div>
                </div>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="join" className="text-base">
                      <UserPlus className="w-4 h-4 mr-2"/>Join
                    </TabsTrigger>
                    <TabsTrigger value="login" className="text-base">
                      <LogIn className="w-4 h-4 mr-2"/>Login
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="join" className="pt-6">
                      <AuthForm 
                          isLogin={false} 
                          phoneNumber={phoneNumber} 
                          setPhoneNumber={setPhoneNumber}
                          onSubmit={handlePhoneSubmit}
                          isLoading={loadingStates.sendingCode}
                          validatePhone={validatePhoneNumber}
                      />
                  </TabsContent>
                  <TabsContent value="login" className="pt-6">
                      <AuthForm 
                          isLogin={true} 
                          phoneNumber={phoneNumber}
                          setPhoneNumber={setPhoneNumber}
                          onSubmit={handlePhoneSubmit}
                          isLoading={loadingStates.sendingCode}
                          validatePhone={validatePhoneNumber}
                      />
                  </TabsContent>
                </Tabs>
                
                <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
                  {networkStatus === 'offline' && (
                    <div className="flex items-center space-x-2 text-red-500 text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>You appear to be offline</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="text-sm">Your privacy and security are our priority</span>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="border-2 border-primary/20 rounded-2xl p-8 text-center text-primary">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10" />
                  </div>
                  <h1 className="text-2xl font-bold mb-3 text-gray-900">Verify Your Number</h1>
                  <p className="text-gray-600 mb-2">
                    We've sent a 6-digit code to
                  </p>
                  <p className="font-semibold text-gray-800 text-lg">{phoneNumber}</p>
                </div>

                <div className="space-y-4">
                  <label className="text-gray-800 font-medium text-lg">Enter Verification Code</label>
                   <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="_ _ _ _ _ _"
                      maxLength="6"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-16 text-center text-3xl font-bold tracking-[1.5em]"
                  />
                </div>

                <LoadingButton
                  onClick={handleVerifyCode}
                  isLoading={loadingStates.verifyingCode}
                  loadingText="Verifying..."
                  disabled={verificationCode.length !== 6}
                  className="w-full h-16 bg-primary text-white hover:bg-primary/90 font-semibold text-xl rounded-xl"
                >
                  Verify Code
                </LoadingButton>

                <div className="text-center space-y-3">
                  <p className="text-gray-600">Didn't receive the code?</p>
                  <button
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || loadingStates.resendingCode}
                    className="text-primary font-medium underline disabled:text-gray-400 disabled:no-underline flex items-center justify-center text-lg"
                  >
                    {loadingStates.resendingCode && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    {resendTimer > 0 ? `Resend in ${formatCountdown(resendTimer)}` : 
                     loadingStates.resendingCode ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WhatsAppAuth;