import React from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "./AuthForm";
import { validatePhoneNumber } from "@/lib/phoneUtils";

const PhoneStep = ({
  phoneNumber,
  setPhoneNumber,
  onSubmit,
  isLoading,
  activeTab,
  setActiveTab,
  networkStatus,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      <div className="border-2 border-primary/20 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Welcome to NetLife
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Secure WhatsApp authentication
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="auth-tabs grid w-full grid-cols-2 h-12 sm:h-14 p-1 bg-gray-100 rounded-xl">
          <TabsTrigger 
            value="join" 
            className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Join</span>
          </TabsTrigger>
          <TabsTrigger 
            value="login" 
            className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="join" className="pt-4 sm:pt-6">
          <AuthForm
            isLogin={false}
            {...{ phoneNumber, setPhoneNumber, onSubmit, isLoading }}
            validatePhone={validatePhoneNumber}
          />
        </TabsContent>
        <TabsContent value="login" className="pt-4 sm:pt-6">
          <AuthForm
            isLogin={true}
            {...{ phoneNumber, setPhoneNumber, onSubmit, isLoading }}
            validatePhone={validatePhoneNumber}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col items-center justify-center space-y-2 mt-auto text-gray-500 pt-4 sm:pt-6">
        {networkStatus === "offline" && (
          <div className="flex items-center space-x-2 text-red-500 text-xs sm:text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
            <span>You appear to be offline</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-center">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm">
            Your privacy and security are our priority
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PhoneStep;
