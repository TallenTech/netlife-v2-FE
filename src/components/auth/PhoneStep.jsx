import React from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "./AuthForm";
import NetLifeLogo from "@/components/NetLifeLogo";
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
      <div className="border-2 border-primary/20 rounded-2xl p-6 mb-8 text-primary">
        <div className="flex items-center space-x-4 mb-4">
          <NetLifeLogo className="w-12 h-12" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome to NetLife
            </h1>
            <p className="text-gray-600 text-sm">
              Secure WhatsApp authentication
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 text-base">
          <TabsTrigger value="join">
            <UserPlus className="w-4 h-4 mr-2" />
            Join
          </TabsTrigger>
          <TabsTrigger value="login">
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </TabsTrigger>
        </TabsList>
        <TabsContent value="join" className="pt-6">
          <AuthForm
            isLogin={false}
            {...{ phoneNumber, setPhoneNumber, onSubmit, isLoading }}
            validatePhone={validatePhoneNumber}
          />
        </TabsContent>
        <TabsContent value="login" className="pt-6">
          <AuthForm
            isLogin={true}
            {...{ phoneNumber, setPhoneNumber, onSubmit, isLoading }}
            validatePhone={validatePhoneNumber}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col items-center justify-center space-y-2 mt-auto text-gray-500 pt-6">
        {networkStatus === "offline" && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>You appear to be offline</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm">
            Your privacy and security are our priority
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PhoneStep;
