import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Bell,
  FileText,
  HeartPulse,
  PlayCircle,
  MessageCircle,
  HelpCircle,
  Video,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { servicesApi } from "@/services/servicesApi";
import { formatRequestTime, formatSmartTime } from "@/utils/timeUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAuth();
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(true);

  // Fetch recent videos for the dashboard
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setVideosLoading(true);
        const recentVideos = await servicesApi.getRecentVideos(3);
        setVideos(recentVideos);
      } catch (error) {
        console.error('Failed to fetch videos for dashboard:', error);
        // Keep empty array on error - will show fallback content
      } finally {
        setVideosLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Fetch recent service requests for the dashboard
  useEffect(() => {
    const fetchServiceRequests = async () => {
      if (!activeProfile?.id) return;
      
      try {
        setServiceRequestsLoading(true);
        const recentRequests = await servicesApi.getRecentServiceRequests(activeProfile.id, 2);
        setServiceRequests(recentRequests);
      } catch (error) {
        console.error('Failed to fetch service requests for dashboard:', error);
        // Keep empty array on error - will show fallback content
      } finally {
        setServiceRequestsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [activeProfile?.id]);

  const handleFeatureClick = () => {
    toast({
      title:
        "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  // Helper function to get video thumbnail colors
  const getVideoThumbnailColor = (index) => {
    const colors = [
      'bg-secondary-light-green',
      'bg-blue-200', 
      'bg-yellow-200',
      'bg-purple-200',
      'bg-pink-200'
    ];
    return colors[index % colors.length];
  };

  const getVideoIconColor = (index) => {
    const colors = [
      'text-green-700',
      'text-blue-700',
      'text-yellow-700', 
      'text-purple-700',
      'text-pink-700'
    ];
    return colors[index % colors.length];
  };

  // Helper function to get service request status styling
  const getServiceRequestStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          label: 'Complete',
          className: 'bg-secondary-light-green text-green-800'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'processing':
        return {
          label: 'Processing',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: 'Pending',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Helper function to format service request title
  const getServiceRequestTitle = (serviceRequest) => {
    if (serviceRequest.services?.name) {
      return serviceRequest.services.name;
    }
    return 'Service Request';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const surveyData = JSON.parse(
    localStorage.getItem(`netlife_health_survey_${activeProfile?.id}`)
  ) || {
    score: 8,
    completedAt: Date.now(),
  };

  const notificationCount = 3;
  const firstName = activeProfile?.username?.split(" ")[0] || "";
  const usernameElement = (
    <span className="username-gradient">{firstName}</span>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard - NetLife</title>
      </Helmet>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <header className="flex justify-between items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {getGreeting()}, {usernameElement}!
            </h1>
            <p className="text-sm text-gray-500">How are you feeling today?</p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 rounded-full bg-white border text-gray-600"
            >
              <Bell size={22} />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate(`/survey/${activeProfile?.id}`)}
              className="bg-gradient-to-br from-primary to-purple-400 text-white p-4 rounded-2xl text-left flex flex-col justify-between h-32 shadow-lg"
            >
              <FileText size={24} />
              <div>
                <h3 className="font-bold text-lg">New Survey</h3>
                <p className="text-sm opacity-90">Check your health</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/services")}
              className="bg-gradient-to-br from-secondary-teal to-teal-400 text-white p-4 rounded-2xl text-left flex flex-col justify-between h-32 shadow-lg"
            >
              <HeartPulse size={24} />
              <div>
                <h3 className="font-bold text-lg">Request Service</h3>
                <p className="text-sm opacity-90">Get health services</p>
              </div>
            </button>
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">
              Recommended For You
            </h2>
            {videos.length > 0 && (
              <button
                onClick={() => navigate("/videos")}
                className="text-primary text-sm font-semibold hover:underline"
              >
                View All
              </button>
            )}
          </div>
          
          {videosLoading ? (
            // Loading skeleton for videos
            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3">
                  <div className="h-20 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : videos.length > 0 ? (
            // Dynamic videos from database
            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  onClick={() => navigate(`/videos/${video.id}`, { state: { video } })}
                  className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3 cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className={`h-20 ${getVideoThumbnailColor(index)} rounded-lg mb-2 flex items-center justify-center relative overflow-hidden`}>
                    {video.video_url ? (
                      <video
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        src={video.video_url}
                        muted
                        preload="metadata"
                      />
                    ) : null}
                    <PlayCircle size={32} className={`${getVideoIconColor(index)} relative z-10`} />
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-2 mb-2" title={video.title}>
                    {video.title}
                  </h4>
                  <div className="space-y-1">
                    {video.source && (
                      <p className="text-xs text-primary font-medium truncate bg-primary/10 px-2 py-1 rounded-full">
                        {video.source}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatSmartTime(video.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty state when no videos
            <div className="bg-white border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No Videos Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Educational health videos will appear here when available.
              </p>
              <button
                onClick={() => navigate("/videos")}
                className="text-primary text-sm font-semibold hover:underline"
              >
                Explore Videos
              </button>
            </div>
          )}
        </section>

        {/* Original Service Tracker - Commented out for future use
        <section className="mb-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Service Tracker</h2>
          <div
            onClick={() => navigate("/history")}
            className="bg-white border p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-semibold">Last Health Check</p>
              <p className="text-sm text-gray-500">
                {new Date(surveyData.completedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-secondary-light-green text-green-800 text-xs font-bold px-3 py-1 rounded-full">
              Complete
            </div>
          </div>
          <div
            onClick={handleFeatureClick}
            className="bg-white border p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-semibold">PrEP Reminder</p>
              <p className="text-sm text-gray-500">Next dose in 2 hours</p>
            </div>
            <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
              Pending
            </div>
          </div>
        </section>
        */}

        {/* Dynamic Service Requests Section */}
        <section className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Recent Requests</h2>
            {serviceRequests.length > 0 && (
              <button
                onClick={() => navigate("/history")}
                className="text-primary text-sm font-semibold hover:underline"
              >
                View All
              </button>
            )}
          </div>

          {serviceRequestsLoading ? (
            // Loading skeleton for service requests
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white border p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : serviceRequests.length > 0 ? (
            // Dynamic service requests from database
            <div className="space-y-3">
              {serviceRequests.map((request) => {
                const status = getServiceRequestStatus(request.status);
                return (
                  <div
                    key={request.id}
                    onClick={() => navigate(`/records/db_service_request_${request.id}`)}
                    className="bg-white border p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
                    title="Click to view request details"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {getServiceRequestTitle(request)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatRequestTime(request.created_at)}
                      </p>
                      {request.request_data?.deliveryMethod && (
                        <p className="text-xs text-gray-400 mt-1">
                          {request.request_data.deliveryMethod}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className={`${status.className} text-xs font-bold px-3 py-1 rounded-full`}>
                        {status.label}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty state when no service requests
            <div className="bg-white border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <HeartPulse className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No Requests Yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Your service requests will appear here when you make them.
              </p>
              <button
                onClick={() => navigate("/services")}
                className="inline-flex items-center text-primary text-sm font-semibold hover:underline"
              >
                Request a Service
                <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Help</h2>
          <div className="bg-white border rounded-2xl p-4 space-y-3">
            <button
              onClick={() => navigate("/contact-us")}
              className="flex items-center w-full text-left space-x-3"
            >
              <MessageCircle className="text-primary" />
              <span className="font-semibold text-gray-700">Contact Us</span>
            </button>
            <div className="border-t"></div>
            <button
              onClick={() => navigate("/faqs")}
              className="flex items-center w-full text-left space-x-3"
            >
              <HelpCircle className="text-primary" />
              <span className="font-semibold text-gray-700">FAQs</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Dashboard;
