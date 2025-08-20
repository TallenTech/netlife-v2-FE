import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import ScrollToTop from "@/components/ScrollToTop";
import MainLayout from "@/components/layout/MainLayout";
import NetLifeLogo from "@/components/NetLifeLogo";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AutoLogoutWarning from "@/components/AutoLogoutWarning";
import LandingPage from "@/pages/LandingPage";
import WhatsAppAuth from "@/components/auth/WhatsAppAuth";
import ProfileSetup from "@/components/ProfileSetup";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ContactUs from "@/pages/ContactUs";
import NotFound from "@/pages/NotFound";
import { processSyncQueue } from "@/services/offlineSync.js";

function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

function AppWrapper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online. Processing offline queue...");
      processSyncQueue(queryClient);
    };

    const handleSyncSuccess = (event) => {
      toast({
        title: "Sync Successful",
        description: event.detail.message,
        variant: "success",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("requestSynced", handleSyncSuccess);

    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("requestSynced", handleSyncSuccess);
    };
  }, [toast, queryClient]);

  return (
    <>
      <Helmet>
        <title>NetLife - Your Health. Your Privacy. Your Power.</title>
        <meta
          name="description"
          content="Secure, stigma-free digital health services for everyone."
        />
      </Helmet>
      <ScrollToTop />
      <PWAInstallPrompt />
      <AutoLogoutWarning />
      <AppRoutes />
      <Toaster />
    </>
  );
}

function AppRoutes() {
  const {
    isAuthenticated,
    isPartiallyAuthenticated,
    isLoading,
    error,
    logout,
  } = useAuth();

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <>
        <div className="lg:hidden mobile-container bg-white">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center px-6">
              <div className="mb-6">
                <NetLifeLogo className="w-20 h-20 mx-auto" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Connection Issue
              </h2>
              <p className="text-gray-600 mb-6">
                We're having trouble connecting to our services right now.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-200 shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <div className="hidden lg:block min-h-screen bg-white">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-8">
              <div className="mb-8">
                <NetLifeLogo className="w-32 h-32 mx-auto" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                Connection Issue
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                We're having trouble connecting to our services right now.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-white px-10 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-200 shadow-lg text-lg"
              >
                Try Again
              </button>
              <div className="mt-8 space-y-2 text-sm text-gray-500">
                <p>Your Health. Your Privacy. Your Power.</p>
                <p>Secure, stigma-free digital health services</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <Routes>
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <MainLayout handleLogout={logout} />
          ) : isPartiallyAuthenticated ? (
            <Navigate to="/welcome/profile-setup" replace />
          ) : (
            <Navigate to="/welcome" replace />
          )
        }
      />
      <Route
        path="/welcome/*"
        element={
          !isAuthenticated ? (
            <OnboardingFlow isPartiallyAuthed={isPartiallyAuthenticated} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/contact-us" element={<ContactUs />} />
    </Routes>
  );
}

const OnboardingFlow = ({ isPartiallyAuthed }) => {
  const navigate = useNavigate();

  if (isPartiallyAuthed) {
    return (
      <Routes>
        <Route
          path="/profile-setup"
          element={
            <ProfileSetup
              onComplete={() => navigate("/dashboard")}
              isInitialSetup={true}
            />
          }
        />
        <Route path="*" element={<Navigate to="/profile-setup" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage onJoin={() => navigate("/welcome/auth")} />}
      />
      <Route path="/auth" element={<WhatsAppAuth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
