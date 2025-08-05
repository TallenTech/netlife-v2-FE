import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import SideNav from '@/components/layout/SideNav';
import Dashboard from '@/pages/Dashboard';
import Services from '@/pages/Services';
import Videos from '@/pages/Videos';
import History from '@/pages/History';
import Account from '@/pages/Account';
import Privacy from '@/pages/Privacy';
import Notifications from '@/pages/Notifications';
import ContactUs from '@/pages/ContactUs';
import FAQs from '@/pages/FAQs';
import ServiceScreening from '@/pages/ServiceScreening';
import ScreeningResults from '@/pages/ScreeningResults';
import AnalyzingResults from '@/pages/AnalyzingResults';
import ServiceScreeningIntro from '@/pages/ServiceScreeningIntro';
import ServiceRequest from '@/pages/ServiceRequest';
import VideoPlayer from '@/pages/VideoPlayer';
import RecordViewer from '@/pages/RecordViewer';
import HealthInterests from '@/pages/HealthInterests';
import ManageProfiles from '@/pages/ManageProfiles';
import HealthRecords from '@/pages/HealthRecords';
import AddProfileFlow from '@/pages/AddProfileFlow';
import NotFound from '@/pages/NotFound';
import HealthSurvey from '@/components/HealthSurvey';
import SurveyResults from '@/components/SurveyResults';
import { useAuth } from '@/contexts/AuthContext';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';


const MainLayout = ({ handleLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="desktop-container">
        <SideNav handleLogout={handleLogout} />
        <div className="flex-1 md:pl-64">
          <main className="main-content">
            <div className="desktop-padding">
              <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/:serviceId/intro" element={<ServiceScreeningIntro />} />
                  <Route path="/services/:serviceId/screening" element={<ServiceScreening />} />
                  <Route path="/services/:serviceId/analyzing" element={<AnalyzingResults />} />
                  <Route path="/services/:serviceId/results" element={<ScreeningResults />} />
                  <Route path="/services/:serviceId/request" element={<ServiceRequest />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/videos/:videoId" element={<VideoPlayer />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/records/:recordId" element={<RecordViewer />} />
                  <Route path="/account" element={<Account handleLogout={handleLogout} />} />
                  <Route path="/account/health-interests" element={<HealthInterests />} />
                  <Route path="/account/manage-profiles" element={<ManageProfiles />} />
                  <Route path="/account/add-profile" element={<AddProfileFlow />} />
                  <Route path="/account/health-records" element={<HealthRecords />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/contact-us" element={<ContactUs />} />
                  <Route path="/faqs" element={<FAQs />} />
                  <Route path="/survey/:profileId" element={<HealthSurvey />} />
                  <Route path="/survey-results" element={<SurveyResults />} />
                  <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
        </div>
        <BottomNav handleLogout={handleLogout} />
      </div>
    </div>
  );
};

export default MainLayout;