import React, { useState, useEffect, useMemo } from "react";
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
  MoreVertical,
  Users,
  Heart,
  FolderOpen,
  LogOut,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { formatRequestTime, formatSmartTime } from "@/utils/timeUtils";
import { notificationService } from "@/services/notificationService";
import { surveyService } from "@/services/surveyService";
import { surveyEvents } from "@/utils/surveyEvents";
import NetLifeLogo from "@/components/NetLifeLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useVideos, useUserServiceRequests } from "@/hooks/useServiceQueries";
import { useUnreadNotificationCount } from "@/hooks/useNotificationQueries";
import { useSurveyStatus } from "@/hooks/useSurveyQueries";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, profile, logout } = useAuth();
  const queryClient = useQueryClient();

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: allServiceRequests, isLoading: serviceRequestsLoading } =
    useUserServiceRequests(profile?.id);
  const { data: unreadNotificationCount = 0 } = useUnreadNotificationCount(
    profile?.id
  );
  const { data: surveyStatus, isLoading: surveyStatusLoading } =
    useSurveyStatus(activeProfile?.id);

  useEffect(() => {
    const unsubscribe = surveyEvents.onSurveyCompleted(
      ({ userId, completed }) => {
        if (userId === activeProfile?.id && completed) {
          queryClient.invalidateQueries({
            queryKey: ["surveyStatus", activeProfile?.id],
          });
        }
      }
    );
    return unsubscribe;
  }, [activeProfile?.id, queryClient]);

  useEffect(() => {
    if (!profile?.id) return;
    const subscription = notificationService.subscribeToNotifications(
      profile.id,
      () => {
        queryClient.invalidateQueries({
          queryKey: ["unreadNotificationCount", profile.id],
        });
      }
    );
    return () => {
      if (subscription) {
        notificationService.unsubscribeFromNotifications(subscription);
      }
    };
  }, [profile?.id, queryClient]);

  const handleSurveyClick = () => {
    if (surveyStatus?.canTakeSurvey) {
      navigate(`/survey/${activeProfile?.id}`);
    } else {
      const message = surveyService.getNextAvailableMessage(
        surveyStatus?.nextAvailableAt
      );
      toast({
        title: "Survey Not Available",
        description: message,
      });
    }
  };

  const getVideoThumbnailColor = (index) => {
    const colors = [
      "bg-secondary-light-green",
      "bg-blue-200",
      "bg-yellow-200",
      "bg-purple-200",
      "bg-pink-200",
    ];
    return colors[index % colors.length];
  };

  const getVideoIconColor = (index) => {
    const colors = [
      "text-green-700",
      "text-blue-700",
      "text-yellow-700",
      "text-purple-700",
      "text-pink-700",
    ];
    return colors[index % colors.length];
  };

  const getServiceRequestStatus = (status, isOffline) => {
    if (isOffline) {
      return {
        label: "Pending Sync",
        className: "bg-yellow-100 text-yellow-800",
      };
    }
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          label: "Complete",
          className: "bg-secondary-light-green text-green-800",
        };
      case "pending":
        return { label: "Pending", className: "bg-yellow-100 text-yellow-800" };
      case "processing":
        return {
          label: "Processing",
          className: "bg-blue-100 text-blue-800",
        };
      case "cancelled":
        return { label: "Cancelled", className: "bg-red-100 text-red-800" };
      default:
        return { label: "Pending", className: "bg-gray-100 text-gray-800" };
    }
  };

  const getServiceRequestTitle = (serviceRequest) => {
    return serviceRequest.services?.name || "Service Request";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const filteredServiceRequests = useMemo(() => {
    const requests = allServiceRequests || [];
    if (activeProfile?.id === profile?.id) {
      return requests.slice(0, 2);
    }
    return requests
      .filter((request) => {
        const profileInfo = request.request_data?._profileInfo;
        return profileInfo && profileInfo.profileId === activeProfile.id;
      })
      .slice(0, 2);
  }, [allServiceRequests, activeProfile, profile]);

  const firstName = activeProfile?.username?.split(" ")[0] || "";
  const usernameElement = (
    <span className="username-gradient">{firstName}</span>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard - NetLife</title>
      </Helmet>

      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-gray-50">
        <div className="flex justify-between items-center px-4 py-3">
          <NetLifeLogo className="w-20 h-8" />
          <div className="flex items-center space-x-0 -mr-4">
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 text-gray-600 hover:text-primary transition-colors"
            >
              <Bell size={24} />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-gray-50">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 text-gray-600 hover:text-primary transition-colors"
            >
              <MoreVertical size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 bg-gray-50 min-h-screen pt-16 md:pt-4">
        <header className="hidden md:flex justify-between items-center gap-4 mb-6">
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
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="md:hidden mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {getGreeting()}, {usernameElement}!
          </h1>
          <p className="text-sm text-gray-500">How are you feeling today?</p>
        </div>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {surveyStatusLoading ? (
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
                  surveyStatus?.canTakeSurvey
                    ? "bg-gradient-to-br from-primary to-purple-400 text-white"
                    : "bg-gradient-to-br from-primary to-purple-400 text-white opacity-75"
                } p-4 rounded-2xl text-left flex flex-col justify-between h-32 shadow-lg transition-all duration-200 ${
                  surveyStatus?.canTakeSurvey
                    ? "hover:shadow-xl transform hover:-translate-y-1"
                    : "cursor-default"
                }`}
              >
                <FileText size={24} />
                <div>
                  <h3 className="font-bold text-lg">
                    {surveyStatus?.canTakeSurvey
                      ? "New Survey"
                      : "Survey Completed"}
                  </h3>
                  <p className="text-sm opacity-90">
                    {surveyStatus?.canTakeSurvey
                      ? "A new survey is available"
                      : surveyService.getNextAvailableMessage(
                          surveyStatus?.nextAvailableAt
                        )}
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
            {(videos || []).length > 0 && (
              <button
                onClick={() => navigate("/videos")}
                className="text-primary text-sm font-semibold hover:underline"
              >
                View All
              </button>
            )}
          </div>

          {videosLoading ? (
            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3"
                >
                  <div className="h-20 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (videos || []).length > 0 ? (
            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
              {(videos || []).slice(0, 3).map((video, index) => (
                <div
                  key={video.id}
                  onClick={() =>
                    navigate(`/videos/${video.id}`, { state: { video } })
                  }
                  className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3 cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div
                    className={`h-20 ${getVideoThumbnailColor(
                      index
                    )} rounded-lg mb-2 flex items-center justify-center relative overflow-hidden`}
                  >
                    {video.video_url ? (
                      <video
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                        src={video.video_url}
                        muted
                        preload="metadata"
                      />
                    ) : null}
                    <PlayCircle
                      size={32}
                      className={`${getVideoIconColor(index)} relative z-10`}
                    />
                  </div>
                  <h4
                    className="font-semibold text-sm line-clamp-2 mb-2"
                    title={video.title}
                  >
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
            <div className="bg-white border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                No Videos Yet
              </h3>
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

        {(serviceRequestsLoading || filteredServiceRequests.length > 0) && (
          <section className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Recent Requests
              </h2>
              {filteredServiceRequests.length > 0 && (
                <button
                  onClick={() => navigate("/history")}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            {serviceRequestsLoading ? (
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
              <div className="space-y-3">
                {filteredServiceRequests.map((request) => {
                  const status = getServiceRequestStatus(
                    request.status,
                    request.isOffline
                  );
                  const profileInfo = request.request_data?._profileInfo;
                  const isMainUser = activeProfile.id === profile.id;

                  const getProfileDisplay = () => {
                    if (!profileInfo)
                      return {
                        name: "Legacy Request",
                        isForSelf: true,
                        showProfile: false,
                      };
                    const isForSelf = profileInfo.isMainUser;
                    const profileName = profileInfo.profileName;
                    if (isMainUser)
                      return {
                        name: profileName,
                        isForSelf: isForSelf,
                        showProfile: true,
                      };
                    else
                      return {
                        name: profileName,
                        isForSelf: false,
                        showProfile: true,
                      };
                  };

                  const profileDisplay = getProfileDisplay();

                  return (
                    <div
                      key={request.id}
                      onClick={() => navigate(`/records/${request.id}`)}
                      className="bg-white border p-4 sm:p-5 rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {getServiceRequestTitle(request)}
                            </h3>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                            <div
                              className={`${status.className} text-xs font-bold px-3 py-1 rounded-full`}
                            >
                              {status.label}
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {profileDisplay.showProfile && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
                                <User size={12} className="text-purple-600" />
                                <span className="text-xs text-purple-700 font-medium">
                                  {profileDisplay.isForSelf
                                    ? "Self"
                                    : profileDisplay.name}
                                </span>
                              </div>
                              {isMainUser && !profileDisplay.isForSelf && (
                                <span className="text-xs text-purple-600 font-medium">
                                  (Family Member)
                                </span>
                              )}
                            </div>
                          )}

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

      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.4,
              }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <div className="px-6 pb-8 pt-4 safe-area-inset-bottom">
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      navigate("/account/manage-profiles");
                    }}
                    className="flex items-center w-full text-left space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Manage & Switch Profiles
                      </h3>
                      <p className="text-sm text-gray-500">
                        Currently browsing as:{" "}
                        <span className="font-medium">
                          {activeProfile?.full_name || activeProfile?.username}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      navigate("/account/health-interests");
                    }}
                    className="flex items-center w-full text-left space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Health Interests
                      </h3>
                      <p className="text-sm text-gray-500">
                        Tailor content to your preferences
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      navigate("/my-files");
                    }}
                    className="flex items-center w-full text-left space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">My Files</h3>
                      <p className="text-sm text-gray-500">
                        Store and manage your documents
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      logout();
                    }}
                    className="flex items-center w-full text-left space-x-4 p-4 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-600">Logout</h3>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Dashboard;
