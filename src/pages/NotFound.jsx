import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import NetLifeLogo from "@/components/NetLifeLogo";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found</title>
      </Helmet>
      <div className="mobile-container bg-white">
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-8">
            <AlertTriangle className="w-24 h-24 text-red-400 mx-auto" />
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-500 max-w-sm mb-8">
            Oops! The page you are looking for does not exist. It might have
            been moved or deleted.
          </p>
          <div className="w-full max-w-xs">
            <Link to={isAuthenticated ? "/dashboard" : "/welcome"}>
              <Button className="w-full h-12 text-lg">
                {isAuthenticated ? "Go to Dashboard" : "Go to Welcome Page"}
              </Button>
            </Link>
          </div>
          <div className="mt-20">
            <NetLifeLogo className="w-16 h-16 opacity-50" />
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
