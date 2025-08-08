import React from "react";
import { Helmet } from "react-helmet";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { UserDataProvider } from "@/contexts/UserDataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import ScrollToTop from "@/components/ScrollToTop";
import MainLayout from "@/components/layout/MainLayout";
import NetLifeLogo from "@/components/NetLifeLogo";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import LandingPage from "@/pages/LandingPage";
import WhatsAppAuth from "@/components/auth/WhatsAppAuth";
import ProfileSetup from "@/components/ProfileSetup";

// Import test setup for development

import HealthSurvey from "@/components/HealthSurvey";
import SurveyResults from "@/components/SurveyResults";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
}

function AppWrapper() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mobile-container bg-white">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <NetLifeLogo className="w-16 h-16 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading NetLife...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserDataProvider>
      <Helmet>
        <title>NetLife - Your Health. Your Privacy. Your Power.</title>
        <meta
          name="description"
          content="Secure, stigma-free digital health services for everyone. Take control of your health with NetLife."
        />
      </Helmet>
      <ScrollToTop />
      <PWAInstallPrompt />
      <AppRoutes />
      <Toaster />
    </UserDataProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <Routes>
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <MainLayout handleLogout={logout} />
          ) : (
            <Navigate to="/welcome" replace />
          )
        }
      />
      <Route
        path="/welcome/*"
        element={
          !isAuthenticated ? (
            <OnboardingFlow />
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

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAuthContinue = async (user, isLogin) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
      return;
    }

    if (profile) {
      login(profile);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/welcome/profile-setup", {
        state: { phoneNumber: user.phone },
      });
    }
  };

  const handleProfileComplete = (newProfile) => {
    navigate(`/welcome/survey/${newProfile.id || "main"}`);
  };

  const handleSurveyComplete = () => {
    navigate("/welcome/survey-results");
  };

  const handleGoToDashboard = () => {
    const finalProfile = JSON.parse(localStorage.getItem("netlife_profile"));
    if (finalProfile) {
      login(finalProfile);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/welcome/auth");
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage onJoin={() => navigate("/welcome/auth")} />}
      />
      <Route
        path="/auth"
        element={
          <WhatsAppAuth
            onBack={() => navigate("/welcome")}
            onContinue={handleAuthContinue}
          />
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProfileSetup
            onBack={() => navigate("/welcome/auth")}
            onContinue={handleProfileComplete}
          />
        }
      />
      <Route
        path="/survey/:profileId"
        element={
          <HealthSurvey
            onBack={() => navigate("/welcome/profile-setup")}
            onComplete={handleSurveyComplete}
          />
        }
      />
      <Route
        path="/survey-results"
        element={<SurveyResults onGoToDashboard={handleGoToDashboard} />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
