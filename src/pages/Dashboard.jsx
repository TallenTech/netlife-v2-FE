import React from "react";
import { Helmet } from "react-helmet";
import {
  Bell,
  FileText,
  HeartPulse,
  PlayCircle,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleFeatureClick = () => {
    toast({
      title:
        "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Use the profile ID for the survey key
  const surveyData = JSON.parse(
    localStorage.getItem(`netlife_health_survey_${profile?.id}`)
  ) || {
    score: 8,
    completedAt: Date.now(),
  };

  const notificationCount = 3;
  const firstName = profile?.username?.split(" ")[0] || "";
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
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
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
              onClick={() => navigate(`/survey/${profile?.id}`)}
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
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Recommended For You
          </h2>
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
            {/* These would eventually come from the database */}
            <div
              onClick={() => navigate("/videos")}
              className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3 cursor-pointer"
            >
              <div className="h-20 bg-secondary-light-green rounded-lg mb-2 flex items-center justify-center">
                <PlayCircle size={32} className="text-green-700" />
              </div>
              <h4 className="font-semibold text-sm">HIV Prevention</h4>
              <p className="text-xs text-gray-500">3:45</p>
            </div>
            <div
              onClick={() => navigate("/videos")}
              className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3 cursor-pointer"
            >
              <div className="h-20 bg-blue-200 rounded-lg mb-2 flex items-center justify-center">
                <PlayCircle size={32} className="text-blue-700" />
              </div>
              <h4 className="font-semibold text-sm">Understanding PrEP</h4>
              <p className="text-xs text-gray-500">5:20</p>
            </div>
            <div
              onClick={() => navigate("/videos")}
              className="flex-shrink-0 w-40 bg-white border rounded-2xl p-3 cursor-pointer"
            >
              <div className="h-20 bg-yellow-200 rounded-lg mb-2 flex items-center justify-center">
                <PlayCircle size={32} className="text-yellow-700" />
              </div>
              <h4 className="font-semibold text-sm">STI Symptoms</h4>
              <p className="text-xs text-gray-500">4:10</p>
            </div>
          </div>
        </section>

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
