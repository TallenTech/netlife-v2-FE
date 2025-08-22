import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import NetLifeLogo from "./NetLifeLogo";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isPartiallyAuthenticated, isLoading, error } =
    useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="mb-8">
            <NetLifeLogo className="w-32 h-32 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Connection Issue
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We had trouble loading your profile. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-10 py-4 rounded-xl font-semibold hover:bg-primary/90 transition-colors duration-200 shadow-lg text-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isPartiallyAuthenticated) {
    return <Navigate to="/welcome/profile-setup" replace />;
  }

  if (isAuthenticated) {
    return children;
  }

  return <Navigate to="/welcome" replace />;
};

export default ProtectedRoute;
