import React from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Pages and Components
import LandingPage from "@/pages/LandingPage";
import WhatsAppAuth from "@/components/WhatsAppAuth";
import ProfileSetup from "@/components/ProfileSetup";
import HealthSurvey from "@/components/HealthSurvey";
import SurveyResults from "@/components/SurveyResults";
import MainLayout from "@/components/layout/MainLayout";
import NetLifeLogo from "@/components/NetLifeLogo";
import NotFound from "@/pages/NotFound";
import ScrollToTop from "@/components/ScrollToTop";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

// Contexts and Hooks
import { UserDataProvider } from "@/contexts/UserDataContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// PWA Install Component
import InstallPWAButton from "@/components/InstallPWAButton";

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

      {/* PWA Install Button: Floats above other content */}
      <div className="fixed bottom-5 right-5 z-50 drop-shadow-lg">
        <InstallPWAButton />
      </div>

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

  const handleAuthContinue = (data, isLogin) => {
    const existingProfile = JSON.parse(localStorage.getItem("netlife_profile"));

    if (isLogin) {
      if (existingProfile && existingProfile.phoneNumber === data.phoneNumber) {
        login(existingProfile);
      } else {
        const tempProfile = {
          id: "main",
          username: "Returning User",
          birthDate: "1990-01-01",
          gender: "Other",
          district: "Kampala",
          subCounty: "",
          avatar: "avatar-1",
          profilePhoto: null,
          phoneNumber: data.phoneNumber,
          createdAt: Date.now(),
        };
        localStorage.setItem("netlife_profile", JSON.stringify(tempProfile));
        localStorage.setItem(
          `netlife_health_survey_main`,
          JSON.stringify({ score: 8, completedAt: Date.now() })
        );
        login(tempProfile);
      }
    } else {
      navigate("/welcome/profile-setup");
    }
  };

  const handleProfileComplete = (profile) => {
    navigate(`/welcome/survey/${profile.id || "main"}`);
  };

  const handleSurveyComplete = () => {
    navigate("/welcome/survey-results");
  };

  const handleGoToDashboard = () => {
    const fullProfile =
      JSON.parse(localStorage.getItem("netlife_profile")) || {};
    login(fullProfile);
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
