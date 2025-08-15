import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import MainLayout from "@/components/layout/MainLayout";
import NetLifeLogo from "@/components/NetLifeLogo";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import LandingPage from "@/pages/LandingPage";
import WhatsAppAuth from "@/components/auth/WhatsAppAuth";
import ProfileSetup from "@/components/ProfileSetup";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
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
  useEffect(() => {
    const handleOnline = () => {
      console.log("App is online. Processing offline queue...");
      processSyncQueue();
    };

    window.addEventListener("online", handleOnline);

    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

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
    return (
      <div className="mobile-container bg-white">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <NetLifeLogo className="w-16 h-16 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              Connecting to NetLife...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-container bg-white">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center p-4">
            <NetLifeLogo className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Connection Issue
            </h2>
            <p className="text-gray-600 mb-4">
              We're having trouble connecting to our services right now.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
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
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
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
