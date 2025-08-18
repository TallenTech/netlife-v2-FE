import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

const allInterests = [
    'HIV Prevention', 'PrEP & PEP', 'Living with HIV', 'Mental Wellness',
    'Sexual Health', 'Nutrition', 'Fitness', 'Relationships', 'STI Awareness'
];

const HealthInterests = () => {
    const { activeProfile, updateProfile } = useAuth();
    const [selectedInterests, setSelectedInterests] = useState([]);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Load existing health interests from localStorage or profile
    useEffect(() => {
        const storedInterests = localStorage.getItem(`health_interests_${activeProfile?.id}`);
        if (storedInterests) {
            setSelectedInterests(JSON.parse(storedInterests));
        } else if (activeProfile?.health_interests) {
            setSelectedInterests(activeProfile.health_interests);
        }
    }, [activeProfile]);

    const handleToggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const handleSave = async () => {
        try {
            // Save to localStorage for immediate access
            localStorage.setItem(`health_interests_${activeProfile?.id}`, JSON.stringify(selectedInterests));

            // Update profile in database if possible
            if (updateProfile) {
                await updateProfile({ health_interests: selectedInterests });
            }

            toast({
                title: 'Interests Updated',
                description: 'Your content preferences have been saved.',
            });
            navigate('/account');
        } catch (error) {
            toast({
                title: 'Update Failed',
                description: 'Could not save your interests. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <>
            <Helmet>
                <title>Health Interests - NetLife</title>
            </Helmet>
            <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
                <header className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={() => navigate('/account')}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Health Interests</h1>
                        <p className="text-sm text-gray-500">Select topics to personalize your feed.</p>
                    </div>
                </header>

                <div className="bg-white p-6 rounded-2xl border">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {allInterests.map(interest => (
                            <button
                                key={interest}
                                onClick={() => handleToggleInterest(interest)}
                                className={`p-4 rounded-lg border-2 text-center font-semibold transition-all duration-200 relative ${selectedInterests.includes(interest)
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-primary/50'
                                    }`}
                            >
                                {interest}
                                {selectedInterests.includes(interest) && (
                                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center">
                                        <Check size={12} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <Button onClick={handleSave} className="w-full">Save Interests</Button>
                </div>
            </div>
        </>
    );
};

export default HealthInterests;