import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = () => {
            try {
                const profileData = localStorage.getItem('netlife_profile');
                if (profileData) {
                    const parsedData = JSON.parse(profileData);
                    const surveyKey = `netlife_health_survey_${parsedData.id || 'main'}`;
                    const surveyCompleted = localStorage.getItem(surveyKey);
                    
                    if (surveyCompleted) {
                        setUser(parsedData);
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error("Auth check failed", error);
                localStorage.clear();
            } finally {
                setIsLoading(false);
            }
        };

        checkUser();
    }, []);

    const login = useCallback((profileData) => {
        setIsLoading(true);
        try {
            localStorage.setItem('netlife_profile', JSON.stringify(profileData));
            const surveyKey = `netlife_health_survey_${profileData.id || 'main'}`;
            if (!localStorage.getItem(surveyKey)) {
                localStorage.setItem(surveyKey, JSON.stringify({ completed: true, timestamp: Date.now() }));
            }
            setUser(profileData);
            setIsAuthenticated(true);
            navigate('/dashboard');
        } catch (error) {
            console.error("Login failed:", error);
            toast({ title: 'Login Error', description: 'Could not log you in.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [navigate, toast]);

    const logout = useCallback(() => {
        setIsLoading(true);
        toast({
          title: 'Logged Out',
          description: 'You have been logged out securely.',
        });
        localStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
        navigate('/welcome');
        setIsLoading(false);
    }, [navigate, toast]);

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};