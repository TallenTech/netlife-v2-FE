import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transformServiceData } from "@/services/servicesApi.utils";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceBySlug } from "@/hooks/useServiceQueries";

const ServiceScreeningIntro = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { activeProfile } = useAuth();

  const { data: serviceData, isLoading, error } = useServiceBySlug(serviceId);
  const service = serviceData ? transformServiceData(serviceData) : null;

  const handleStart = () => {
    navigate(`/services/${serviceId}/screening`);
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading service information...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <header className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/services")}
              className="mr-2 text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </header>

          <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Service Not Available
            </h2>
            <p className="text-gray-600 mb-6">
              {error?.message || "The requested service could not be found."}
            </p>
            <Button
              onClick={() => navigate("/services")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Screening for {service.title} - NetLife</title>
      </Helmet>
      <div className="bg-white min-h-screen">
        <div className="max-w-8xl mx-auto px-6 py-8">
          <header className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/services")}
              className="mr-2 text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </header>

          <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mb-8"
            >
              <FileText className="w-14 h-14 text-primary" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-semibold mb-2 text-gray-900"
            >
              Hi,{" "}
              <span className="font-bold">
                {(activeProfile?.full_name || activeProfile?.username)?.split(
                  " "
                )[0] || "there"}
              </span>
              !
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-4xl font-bold mb-4 text-gray-900"
            >
              {service.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-lg text-gray-700 max-w-sm mb-4"
            >
              {service.desc}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-base text-gray-600 max-w-sm mb-8"
            >
              Please answer a few confidential questions to check your
              eligibility for this service.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full max-w-md mx-auto"
          >
            <Button
              onClick={handleStart}
              className="w-full h-16 bg-primary text-white text-lg font-bold rounded-xl shadow-lg hover:bg-primary/90"
            >
              Start Screening
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ServiceScreeningIntro;
