import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import {
  Heart,
  Shield,
  Calendar,
  Star,
  HeartPulse,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServiceQueries";
import { transformServiceData } from "@/services/servicesApi.utils";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const iconMap = {
  Heart: Heart,
  Shield: Shield,
  Calendar: Calendar,
  Star: Star,
  HeartPulse: HeartPulse,
  UserCheck: UserCheck,
};

const fallbackServices = [
  {
    id: "hts",
    slug: "hts",
    title: "HIV Testing",
    desc: "Quick and confidential",
    icon: Heart,
    category: "routine",
    color: "red",
  },
  {
    id: "sti-screening",
    slug: "sti-screening",
    title: "STI Screening",
    desc: "Comprehensive screening",
    icon: Shield,
    category: "routine",
    color: "blue",
  },
  {
    id: "prep",
    slug: "prep",
    title: "PrEP Access",
    desc: "Prevention medication",
    icon: Calendar,
    category: "follow-up",
    color: "green",
  },
  {
    id: "pep",
    slug: "pep",
    title: "PEP Access",
    desc: "Post-exposure treatment",
    icon: Star,
    category: "urgent",
    color: "yellow",
  },
  {
    id: "art",
    slug: "art",
    title: "ART Support",
    desc: "Treatment support",
    icon: HeartPulse,
    category: "follow-up",
    color: "purple",
  },
  {
    id: "counselling-services",
    slug: "counselling-services",
    title: "Counseling",
    desc: "Professional guidance",
    icon: UserCheck,
    category: "routine",
    color: "indigo",
  },
];

const filters = ["Services", "Screening", "Records"];

const Services = () => {
  const [activeFilter, setActiveFilter] = useState("Services");
  const navigate = useNavigate();

  // Ensure page scrolls to top when navigated to
  useScrollToTop();

  const { data, isLoading, isError, refetch, isFetching } = useServices();

  const services = useMemo(() => {
    if (isError && !data) {
      return fallbackServices;
    }
    if (!data) {
      return [];
    }
    return data.map((service) => {
      const transformed = transformServiceData(service);
      return {
        ...transformed,
        icon: iconMap[transformed.icon] || Heart,
      };
    });
  }, [data, isError]);

  const handleRequest = (service) => {
    const serviceIdentifier = service.slug || service.id;
    navigate(`/services/${serviceIdentifier}/intro`);
  };

  const handleRetry = () => {
    refetch();
  };

  const filteredServices =
    activeFilter === "Services"
      ? services
      : services.filter((s) => s.category === activeFilter.toLowerCase());

  const ServiceSkeleton = () => (
    <div className="bg-white border border-gray-200 p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-sm animate-pulse min-h-[180px] sm:min-h-[200px]">
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gray-200"></div>
      <div className="flex-1 flex flex-col justify-center space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
        <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
      </div>
      <div className="w-full h-10 bg-gray-200 rounded-xl"></div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Health Services - NetLife</title>
      </Helmet>

      {/* Fixed Page Title - Desktop Only */}
      <div className="hidden md:block fixed top-0 left-64 z-30 bg-white/95 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Health Services
          </h1>
          <p className="text-sm text-gray-600">
            Choose the service you need
          </p>
        </div>
      </div>

      {/* Mobile Header - Fixed */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Health Services
              </h1>
              <p className="text-xs text-gray-500">
                Choose the service you need
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 sm:py-6 bg-white min-h-screen pt-16 md:pt-20">
        {/* Sticky Filter Component - Directly under header */}
        <div className="sticky top-16 md:top-20 z-20 pb-2">
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-full p-1 inline-flex">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 md:px-6 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${activeFilter === filter
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isError && !isFetching && (
          <div className="mb-4 p-3 border rounded-lg flex items-center space-x-2 bg-red-50 border-red-200">
            <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-800">Failed to load fresh data</p>
              <p className="text-xs text-red-600">
                Displaying cached or fallback services. Please check your
                connection.
              </p>
            </div>
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <RefreshCw size={14} className="mr-1" />
              Retry
            </Button>
          </div>
        )}

        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <ServiceSkeleton key={`skeleton-${index}`} />
            ))
          ) : filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Heart size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No Services Available
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                {activeFilter === "Services"
                  ? "No health services are currently available."
                  : `No ${activeFilter.toLowerCase()} services are currently available.`}
              </p>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="px-6 py-2.5"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh Services
              </Button>
            </div>
          ) : (
            filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white border border-gray-200 p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[180px] sm:min-h-[200px]"
              >
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-${service.color}-100 shadow-sm`}
                >
                  <service.icon
                    size={32}
                    className={`text-${service.color}-600`}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-1">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {service.desc}
                  </p>
                </div>
                <Button
                  onClick={() => handleRequest(service)}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 font-semibold transition-colors duration-200"
                >
                  Request Now
                </Button>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Services;
