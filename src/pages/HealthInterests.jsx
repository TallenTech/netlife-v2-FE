import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, RefreshCw } from 'lucide-react';
import { useHealthInterests } from '@/hooks/useHealthInterests';

const HealthInterests = () => {
    const [selectedInterests, setSelectedInterests] = useState([]);
    const { toast } = useToast();
    const navigate = useNavigate();

    const {
        availableInterestsArray,
        userSelectedInterests,
        interestsList,
        isLoading,
        isUpdating,
        availableError,
        userError,
        isInterestSelected,
        toggleInterest,
        updateInterests,
        refetchAvailable,
        refetchUser
    } = useHealthInterests();

    // Initialize selected interests from user data
    React.useEffect(() => {
        if (userSelectedInterests.length > 0) {
            setSelectedInterests([...userSelectedInterests]);
        }
    }, [userSelectedInterests]);

    const handleToggleInterest = (interest) => {
        setSelectedInterests(prev => {
            const index = prev.indexOf(interest);
            if (index > -1) {
                // Remove interest if already selected
                return prev.filter(item => item !== interest);
            } else {
                // Add interest if not selected
                return [...prev, interest];
            }
        });
    };

    const handleSave = async () => {
        try {
            await updateInterests(selectedInterests);

            toast({
                title: 'Interests Updated',
                description: 'Your content preferences have been saved.',
            });
            navigate('/account');
        } catch (error) {
            toast({
                title: 'Update Failed',
                description: error.message || 'Could not save your interests. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleRefresh = () => {
        refetchAvailable();
        refetchUser();
    };

    return (
        <>
            <Helmet>
                <title>Health Interests - NetLife</title>
            </Helmet>
            <div className="py-4 md:py-6 bg-gray-50 min-h-screen">
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/account')}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Health Interests</h1>
                            <p className="text-sm text-gray-500">
                                Select multiple topics to personalize your feed. ({selectedInterests.length} selected)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50"
                        title="Refresh interests"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </header>

                {isLoading ? (
                    <div className="bg-white p-8 rounded-2xl border">
                        <div className="flex items-center justify-center space-x-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-gray-600">Loading health interests...</span>
                        </div>
                    </div>
                ) : availableError || userError ? (
                    <div className="bg-white p-6 rounded-2xl border">
                        <div className="text-center space-y-4">
                            <div className="text-red-500">
                                <p className="font-semibold">Failed to load health interests</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {availableError?.message || userError?.message || 'Please try refreshing the page.'}
                                </p>
                            </div>
                            <Button onClick={handleRefresh} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-2xl border">
                        {interestsList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {interestsList.map((interest) => (
                                    <button
                                        key={interest.name}
                                        onClick={() => handleToggleInterest(interest.name)}
                                        className={`p-4 rounded-lg border-2 text-center font-medium transition-all duration-200 relative ${selectedInterests.includes(interest.name)
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: interest.color }}
                                            ></div>
                                            <span className="font-semibold">{interest.name}</span>
                                        </div>
                                        {selectedInterests.includes(interest.name) && (
                                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center">
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <p>No health interests available.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8">
                    <Button
                        onClick={handleSave}
                        disabled={isUpdating || isLoading}
                        className="w-full"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Interests'
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
};

export default HealthInterests;