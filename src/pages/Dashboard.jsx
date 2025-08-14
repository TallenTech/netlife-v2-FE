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
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { servicesApi } from "@/services/servicesApi";
import { formatRequestTime, formatSmartTime } from "@/utils/timeUtils";
import { notificationService } from "@/services/notificationService";
import { surveyService } from "@/services/surveyService";
import { surveyEvents } from "@/utils/surveyEvents";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, profile, managedProfiles } = useAuth();
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(true);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [surveyStatus, setSurveyStatus] = useState({
    status: 'available',
    lastCompletedAt: null,
    nextAvailableAt: null,
    canTakeSurvey: true
  });
  const [surveyStatusLoading, setSurveyStatusLoading] = useState(true);

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
      if (!activeProfile?.id || !profile?.id) return;
      
      try {
        setServiceRequestsLoading(true);
        
        // Always fetch using main user ID (since all requests are stored with main user ID)
        const allRecentRequests = await servicesApi.getRecentServiceRequests(profile.id, 10); // Get more to filter
        
        // Filter based on current profile
        const isMainUser = activeProfile.id === profile.id;
        let filteredRequests;
        
        if (isMainUser) {
          // Main user sees all requests (their own + managed profiles)
          filteredRequests = allRecentRequests;
        } else {
          // Managed profile sees only their own requests
          filteredRequests = allRecentRequests.filter(request => {
            const profileInfo = request.request_data?._profileInfo;
            return profileInfo && profileInfo.profileId === activeProfile.id;
          });
        }
        
        // Limit to 2 most recent after filtering
        setServiceRequests(filteredRequests.slice(0, 2));
      } catch (error) {
        console.error('Failed to fetch service requests for dashboard:', error);
        // Keep empty array on error - will show fallback content
      } finally {
        setServiceRequestsLoading(false);
      }
    };

    fetchServiceRequests();
  }, [activeProfile?.id, profile?.id]);

  // Fetch survey status
  useEffect(() => {
    const fetchSurveyStatus = async () => {
      if (!activeProfile?.id) return;
      
      try {
        setSurveyStatusLoading(true);
        const status = await surveyService.getSurveyStatus(activeProfile.id);
        setSurveyStatus(status);
      } catch (error) {
        console.error('Failed to fetch survey status:', error);
      } finally {
        setSurveyStatusLoading(false);
      }
    };

    fetchSurveyStatus();

    // Listen for survey completion events to refresh status
    const unsubscribe = surveyEvents.onSurveyCompleted(({ userId, completed }) => {
      if (userId === activeProfile?.id && completed) {
        // Refresh survey status when this user completes a survey
        fetchSurveyStatus();
      }
    });

    return unsubscribe;
  }, [activeProfile?.id]);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!activeProfile?.id) return;
      
      try {
        const { success, count } = await notificationService.getUnreadCount(activeProfile.id);
        if (success) {
          setUnreadNotificationCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch unread notification count:', error);
      }
    };

    fetchUnreadCount();
    
    // Set up real-time subscription for notification count updates
    let subscription;
    if (activeProfile?.id) {
      subscription = notificationService.subscribeToNotifications(
        activeProfile.id,
        () => {
          // Refetch count when notifications change
          fetchUnreadCount();
        }
      );
    }

    return () => {
      if (subscription) {
        notificationService.unsubscribeFromNotifications(subscription);
      }
    };
  }, [activeProfile?.id]);

  const handleFeatureClick = () => {
    toast({
      title:
        "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleSurveyClick = () => {
    if (surveyStatus.canTakeSurvey) {
      navigate(`/survey/${activeProfile?.id}`);
    } else {
      const message = surveyService.getNextAvailableMessage(surveyStatus.nextAvailableAt);
      toast({
        title: "Survey Not Available",
        description: message,
      });
    }
  };

  // Function to refresh survey status (called after survey completion)
  const refreshSurveyStatus = async () => {
    if (!activeProfile?.id) return;
    
    try {
      const status = await surveyService.getSurveyStatus(activeProfile.id);
      setSurveyStatus(status);
    } catch (error) {
      console.error('Failed to refresh survey status:', error);
    }
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
              className="relative p-2 rounded-full bg-white border text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Bell size={22} />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
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
            {surveyStatusLoading ? (
              // Loading skeleton for survey card
              <div className="bg-gray-200 p-4 rounded-2xl text-left flex flex-col justify-between h-32 shadow-lg animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
                <div>
                  <div className="h-5 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSurveyClick}
                className={`${
                  surveyStatus.canTakeSurvey
                    ? 'bg-gradient-to-br from-primary to-purple-400 text-white'
                    : 'bg-gradient-to-br from-primary to-purple-400 text-white opacity-75'
                } p-4 rounded-2xl text-left flex flex-col justify-between h-32 shadow-lg transition-all duration-200 ${
                  surveyStatus.canTakeSurvey ? 'hover:shadow-xl transform hover:-translate-y-1' : 'cursor-default'
                }`}
              >
                <FileText size={24} />
                <div>
                  <h3 className="font-bold text-lg">
                    {surveyStatus.canTakeSurvey ? 'New Survey' : 'Survey Completed'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {surveyStatus.canTakeSurvey 
                      ? 'A new survey is available' 
                      : surveyService.getNextAvailableMessage(surveyStatus.nextAvailableAt)
                    }
                  </p>
                </div>
              </button>
            )}
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

        {/* Dynamic Service Requests Section - Only show if there are requests or loading */}
        {(serviceRequestsLoading || serviceRequests.length > 0) && (
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
            ) : (
              // Dynamic service requests from database
              <div className="space-y-3">
                {serviceRequests.map((request) => {
                  const status = getServiceRequestStatus(request.status);
                  const profileInfo = request.request_data?._profileInfo;
                  const isMainUser = activeProfile.id === profile.id;
                  
                  // Determine profile display information
                  const getProfileDisplay = () => {
                    if (!profileInfo) {
                      return { name: 'Legacy Request', isForSelf: true, showProfile: false };
                    }
                    
                    const isForSelf = profileInfo.isMainUser;
                    const profileName = profileInfo.profileName;
                    
                    if (isMainUser) {
                      // Main user viewing - show who the request is for
                      return {
                        name: profileName,
                        isForSelf: isForSelf,
                        showProfile: true
                      };
                    } else {
                      // Managed profile viewing - only their own requests
                      return {
                        name: profileName,
                        isForSelf: false, // Always show as "for them" since they're viewing their own
                        showProfile: true
                      };
                    }
                  };
                  
                  const profileDisplay = getProfileDisplay();
                  
                  return (
                    <div
                      key={request.id}
                      onClick={() => navigate(`/records/db_service_request_${request.id}`)}
                      className="bg-white border p-4 sm:p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
                      title="Click to view request details"
                    >
                      <div className="space-y-3">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {getServiceRequestTitle(request)}
                            </h3>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            <div className={`${status.className} text-xs font-bold px-3 py-1 rounded-full`}>
                              {status.label}
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                        
                        {/* Profile tag and metadata */}
                        <div className="space-y-2">
                          {/* Profile tag */}
                          {profileDisplay.showProfile && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
                                <User size={12} className="text-purple-600" />
                                <span className="text-xs text-purple-700 font-medium">
                                  {profileDisplay.isForSelf ? 'Self' : profileDisplay.name}
                                </span>
                              </div>
                              {/* Show profile context for main user */}
                              {isMainUser && !profileDisplay.isForSelf && (
                                <span className="text-xs text-purple-600 font-medium">
                                  (Family Member)
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Date and delivery info */}
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">
                              {formatRequestTime(request.created_at)}
                            </p>
                            
                            {request.request_data?.deliveryMethod && (
                              <p className="text-xs text-gray-400">
                                {request.request_data.deliveryMethod}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

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
      
      {/* WhatsApp Floating Button - Temporarily disabled */}
      {/* <WhatsAppFloat /> */}
    </>
  );
};

export default Dashboard;
