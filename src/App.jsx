import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import ScrollToTop from "@/components/ScrollToTop";
import MainLayout from "@/components/layout/MainLayout";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import AutoLogoutWarning from "@/components/AutoLogoutWarning";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import WhatsAppAuth from "@/components/auth/WhatsAppAuth";
import ProfileSetup from "@/components/ProfileSetup";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ContactUs from "@/pages/ContactUs";
import NotFound from "@/pages/NotFound";
import { processSyncQueue } from "@/services/offlineSync.js";
import NotificationPrompt from "@/components/NotificationPrompt";

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
  const { isAuthenticated, isPartiallyAuthenticated, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout handleLogout={logout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/welcome/*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <OnboardingFlow isPartiallyAuthed={isPartiallyAuthenticated} />
          )
        }
      />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const OnboardingFlow = ({ isPartiallyAuthed }) => {
  const navigate = useNavigate();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  const handleProfileComplete = () => {
    if (Notification.permission === "default") {
      setShowNotificationPrompt(true);
    } else {
      navigate("/dashboard");
    }
  };

  const handlePromptDismiss = () => {
    setShowNotificationPrompt(false);
    navigate("/dashboard");
  };

  if (isPartiallyAuthed) {
    return (
      <>
        <Routes>
          <Route
            path="/profile-setup"
            element={
              <ProfileSetup
                onComplete={handleProfileComplete}
                isInitialSetup={true}
              />
            }
          />
          <Route path="*" element={<Navigate to="/profile-setup" replace />} />
        </Routes>
        {showNotificationPrompt && (
          <NotificationPrompt onDismiss={handlePromptDismiss} />
        )}
      </>
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
