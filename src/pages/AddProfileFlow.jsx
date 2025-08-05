import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileSetup from '@/components/ProfileSetup';
import HealthSurvey from '@/components/HealthSurvey';
import { useUserData } from '@/contexts/UserDataContext';
import { useToast } from '@/components/ui/use-toast';

const AddProfileFlow = () => {
    const [step, setStep] = useState('profile');
    const [newProfileId, setNewProfileId] = useState(null);
    const { switchProfile } = useUserData();
    const navigate = useNavigate();
    const { toast } = useToast();
    const location = useLocation();

    // Check for edit mode
    const searchParams = new URLSearchParams(location.search);
    const editProfileId = searchParams.get('edit');

    useEffect(() => {
        if (editProfileId) {
            // For now, editing just redirects to survey. Can be expanded later.
            setNewProfileId(editProfileId);
            setStep('survey');
        }
    }, [editProfileId]);

    const handleDependentCreate = (createdProfileId) => {
        setNewProfileId(createdProfileId);
        setStep('survey');
        navigate(`/survey/${createdProfileId}`);
    };
    
    const handleSurveyComplete = () => {
        toast({
            title: "Profile Setup Complete!",
            description: "The new profile is ready to use.",
        });
        if (newProfileId) {
            switchProfile(newProfileId);
        }
        navigate('/dashboard');
    };

    if (step === 'profile' && !editProfileId) {
        return (
            <ProfileSetup 
                isNewDependent={true} 
                onDependentCreate={handleDependentCreate} 
                onBack={() => navigate('/account/manage-profiles')}
            />
        );
    }
    
    // The survey component is rendered by the main App router at /survey/:profileId
    // This component's job is just to navigate there.
    // The HealthSurvey component itself will handle its completion and call onComplete.
    // So we just need a placeholder here until the navigation completes.
    
    // Let's create a completion component for the flow
    if (step === 'survey' && editProfileId) {
        // This flow is for editing. We just redirect to the survey.
        navigate(`/survey/${editProfileId}`);
        return <div>Redirecting to survey...</div>
    }

    return <div>Loading...</div>;
};

export default AddProfileFlow;