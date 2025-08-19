import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const AutoLogoutWarning = () => {
    const [showWarning, setShowWarning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(300); // 5 minutes in seconds
    const { logout, isAuthenticated } = useAuth();

    useEffect(() => {
        const handleWarning = (event) => {
            setShowWarning(true);
            setRemainingTime(Math.floor(event.detail.remainingTime / 1000));
        };

        window.addEventListener('showAutoLogoutWarning', handleWarning);

        return () => {
            window.removeEventListener('showAutoLogoutWarning', handleWarning);
        };
    }, []);

    useEffect(() => {
        if (!showWarning) return;

        const interval = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    logout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showWarning, logout]);

    // Hide warning when user is no longer authenticated
    useEffect(() => {
        if (!isAuthenticated && showWarning) {
            setShowWarning(false);
            setRemainingTime(300);
        }
    }, [isAuthenticated, showWarning]);

    const handleStayLoggedIn = () => {
        setShowWarning(false);
        // Dispatch an activity event to reset the timer
        window.dispatchEvent(new Event('mousemove'));
    };

    const handleLogoutNow = () => {
        logout();
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Hide warning if user is no longer authenticated
    if (!showWarning || !isAuthenticated) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Session Timeout Warning
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">
                            You will be automatically logged out due to inactivity in:
                        </p>
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <Clock className="w-5 h-5 text-red-500" />
                            <span className="text-2xl font-bold text-red-500">
                                {formatTime(remainingTime)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            To stay logged in, click "Stay Logged In" or perform any action.
                        </p>
                    </div>

                    <div className="flex space-x-3">
                        <Button
                            variant="outline"
                            onClick={handleLogoutNow}
                            className="flex-1"
                        >
                            Logout Now
                        </Button>
                        <Button
                            onClick={handleStayLoggedIn}
                            className="flex-1 bg-primary hover:bg-primary/90"
                        >
                            Stay Logged In
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AutoLogoutWarning;
