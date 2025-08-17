import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import BottomNav from "@/components/layout/BottomNav";
import SideNav from "@/components/layout/SideNav";
import Dashboard from "@/pages/Dashboard";
import Services from "@/pages/Services";
import Videos from "@/pages/Videos";
import History from "@/pages/History";
import Account from "@/pages/Account";
import Privacy from "@/pages/Privacy";
import Notifications from "@/pages/Notifications";

import FAQs from "@/pages/FAQs";
import ServiceScreening from "@/pages/ServiceScreening";
import ScreeningResults from "@/pages/ScreeningResults";
import AnalyzingResults from "@/pages/AnalyzingResults";
import ServiceScreeningIntro from "@/pages/ServiceScreeningIntro";
import ServiceRequest from "@/pages/ServiceRequest";
import VideoPlayer from "@/pages/VideoPlayer";
import RecordViewer from "@/pages/RecordViewer";
import HealthInterests from "@/pages/HealthInterests";
import ManageProfiles from "@/pages/ManageProfiles";
import HealthRecords from "@/pages/HealthRecords";
import AddProfileFlow from "@/pages/AddProfileFlow";
import MyFiles from "@/pages/MyFiles";
import NotFound from "@/pages/NotFound";

import HealthSurvey from "@/components/HealthSurvey";
import SurveyResults from "@/components/SurveyResults";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import SurveyCompletionDialog from "@/components/survey/SurveyCompletionDialog";
import { surveyEvents } from "@/utils/surveyEvents";
import { useAuth } from "@/contexts/AuthContext";
import TermsOfService from "@/pages/TermsOfService";

const MainLayout = ({ handleLogout }) => {
  const { activeProfile } = useAuth();
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);

  // Check for survey return on component mount and focus
  useEffect(() => {
    const checkSurveyReturn = () => {
      const surveyStarted = localStorage.getItem('survey_started');

      if (surveyStarted && activeProfile?.id) {
        try {
          const surveyData = JSON.parse(surveyStarted);

          // Check if this is the same user who started the survey
          if (surveyData.userId === activeProfile.id) {
            // Check if survey was started recently (within last 24 hours)
            const startedAt = new Date(surveyData.startedAt);
            const now = new Date();
            const hoursSinceStart = (now - startedAt) / (1000 * 60 * 60);

            if (hoursSinceStart < 24) {
              setShowSurveyDialog(true);
            } else {
              // Clean up old survey data
              localStorage.removeItem('survey_started');
            }
          }
        } catch (error) {
          console.error('Error parsing survey data:', error);
          localStorage.removeItem('survey_started');
        }
      }
    };

    // Check on mount
    checkSurveyReturn();

    // Check when user returns to tab (focus event)
    const handleFocus = () => {
      setTimeout(checkSurveyReturn, 1000); // Small delay to ensure user has settled
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeProfile]);

  const handleSurveyCompletion = (completed) => {
    if (completed) {
      // User completed survey - they won't be able to take it again for 3 months
      console.log('Survey completed successfully');
      // Emit event to refresh survey status across the app
      surveyEvents.emitSurveyCompleted(activeProfile?.id, true);
    } else {
      // User didn't complete - they can try again anytime
      console.log('Survey not completed - user can try again');
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-gray-50 md:flex">
      <SideNav handleLogout={handleLogout} />
      <BottomNav />

      <main className="h-full flex-1 overflow-y-auto no-scrollbar md:pl-64 pb-20 md:pb-0">
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route
            path="/services/:serviceId/intro"
            element={<ServiceScreeningIntro />}
          />
          <Route
            path="/services/:serviceId/screening"
            element={<ServiceScreening />}
          />
          <Route
            path="/services/:serviceId/analyzing"
            element={<AnalyzingResults />}
          />
          <Route
            path="/services/:serviceId/results"
            element={<ScreeningResults />}
          />
          <Route
            path="/services/:serviceId/request"
            element={<ServiceRequest />}
          />
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/:videoId" element={<VideoPlayer />} />
          <Route path="/history" element={<History />} />
          <Route path="/records/:recordId" element={<RecordViewer />} />

          <Route
            path="/account"
            element={<Account handleLogout={handleLogout} />}
          />
          <Route
            path="/account/health-interests"
            element={<HealthInterests />}
          />
          <Route path="/account/manage-profiles" element={<ManageProfiles />} />
          <Route path="/account/health-records" element={<HealthRecords />} />
          <Route path="/my-files" element={<MyFiles />} />
          <Route path="/add-profile" element={<AddProfileFlow />} />

          <Route path="/privacy" element={<Privacy />} />
          <Route path="/use-of-terms" element={<TermsOfService />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/survey/:profileId" element={<HealthSurvey />} />
          <Route path="/survey-results" element={<SurveyResults />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Survey Completion Dialog */}
      <SurveyCompletionDialog
        isOpen={showSurveyDialog}
        onClose={() => setShowSurveyDialog(false)}
        userId={activeProfile?.id}
        onCompletion={handleSurveyCompletion}
      />
    </div>
  );
};

export default MainLayout;
