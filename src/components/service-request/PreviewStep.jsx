import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { calculateAge, getAvatarEmoji } from '@/lib/utils';
import EditableField from './EditableField';
const PreviewStep = ({
  formData,
  setFormData,
  formConfig,
  goToStep,
  onSubmit,
  submitting = false,
  submitError = null
}) => {
  const [consent, setConsent] = useState(false);
  const {
    profile,
    activeProfile
  } = useAuth();
  const handleFieldSave = (fieldName, newValue) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
  };

  // Check if requesting for someone else (managed profile)
  const isRequestingForOther = activeProfile?.id !== profile?.id;
  
  const userAge = calculateAge(activeProfile?.birthDate || activeProfile?.date_of_birth);
  
  const renderAvatar = (profileData) => {
    if (profileData?.profilePhoto) {
      return <AvatarImage src={profileData.profilePhoto} alt={profileData.full_name || profileData.username} />;
    }
    if (profileData?.avatar) {
      return <AvatarFallback className="text-2xl bg-transparent">{getAvatarEmoji(profileData.avatar)}</AvatarFallback>;
    }
    const name = (profileData?.full_name || profileData?.username)?.split(' ')[0] || '';
    return <AvatarFallback className="text-2xl">{name.charAt(0).toUpperCase()}</AvatarFallback>;
  };
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.5
  }} className="space-y-6 pb-20 md:pb-8">
      {/* Account Owner Info - Always shown */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-100">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
                {renderAvatar(profile)}
            </Avatar>
            <div>
                <h3 className="font-bold text-lg text-gray-900">Account Owner</h3>
                <p className="text-sm text-gray-500">Main account holder submitting this request.</p>
            </div>
        </div>
        <div className="mt-4 space-y-3 text-base text-gray-700">
          <p><strong>Name:</strong> {profile?.full_name || profile?.username}</p>
          <p><strong>Phone:</strong> {profile?.phoneNumber || profile?.whatsapp_number}</p>
          <p><strong>Location:</strong> {`${profile?.subCounty || profile?.sub_county || ''}${(profile?.subCounty || profile?.sub_county) ? ', ' : ''}${profile?.district}`}</p>
        </div>
      </div>

      {/* Service Recipient Info - Only shown when requesting for someone else */}
      {isRequestingForOther && (
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                  {renderAvatar(activeProfile)}
              </Avatar>
              <div>
                  <h3 className="font-bold text-lg text-blue-900">Service Recipient</h3>
                  <p className="text-sm text-blue-600">Person receiving this service.</p>
              </div>
          </div>
          <div className="mt-4 space-y-3 text-base text-blue-800">
            <p><strong>Name:</strong> {activeProfile?.full_name || activeProfile?.username}</p>
            <p><strong>Gender:</strong> {activeProfile?.gender}</p>
            {userAge && <p><strong>Age:</strong> {userAge} years</p>}
            <p><strong>Date of Birth:</strong> {activeProfile?.date_of_birth ? new Date(activeProfile.date_of_birth).toLocaleDateString() : (activeProfile?.birthDate ? new Date(activeProfile.birthDate).toLocaleDateString() : 'Not specified')}</p>
          </div>
        </div>
      )}

      {/* Personal Info - Only shown when requesting for self (main user) */}
      {!isRequestingForOther && (
        <div className="p-4 bg-white rounded-xl border-2 border-gray-100">
          <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                  {renderAvatar(activeProfile)}
              </Avatar>
              <div>
                  <h3 className="font-bold text-lg text-gray-900">Personal Info</h3>
                  <p className="text-sm text-gray-500">Fetched from your profile.</p>
              </div>
          </div>
          <div className="mt-4 space-y-3 text-base text-gray-700">
            <p><strong>Name:</strong> {activeProfile?.full_name || activeProfile?.username}</p>
            <p><strong>Gender:</strong> {activeProfile?.gender}</p>
            {userAge && <p><strong>Age:</strong> {userAge} years</p>}
            <p><strong>Phone:</strong> {activeProfile?.phoneNumber || activeProfile?.whatsapp_number}</p>
            <p><strong>Location:</strong> {`${activeProfile?.subCounty || activeProfile?.sub_county || ''}${(activeProfile?.subCounty || activeProfile?.sub_county) ? ', ' : ''}${activeProfile?.district}`}</p>
          </div>
        </div>
      )}

      {formConfig.steps.map((stepConfig, index) => <div key={index} className="p-4 bg-white rounded-xl border-2 border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-gray-900">{stepConfig.title}</h3>
            <Button variant="ghost" size="sm" onClick={() => goToStep(index)}><Edit className="h-4 w-4 mr-2" /> Go back & Edit</Button>
          </div>
          <div className="mt-2 space-y-3 text-base">
            {stepConfig.fields.map(field => {
          if (formData[field.name]) {
            return <div key={field.name} className="py-2 border-b last:border-none">
                        <p className="font-semibold text-gray-600 mb-1">{field.label}</p>
                        <EditableField field={field} value={formData[field.name]} onSave={newValue => handleFieldSave(field.name, newValue)} />
                    </div>;
          }
          return null;
        })}
          </div>
        </div>)}

      <div className="mt-6 p-4 bg-primary/5 rounded-lg">
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="consent" 
            checked={consent} 
            onCheckedChange={setConsent} 
            className="mt-0.5 flex-shrink-0" 
          />
          <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
            I confirm that the information provided is accurate and I consent to NetLife processing this request.
          </label>
        </div>
      </div>
      
      {/* Error message */}
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Submission failed:</strong> {submitError}
          </p>
          <p className="text-xs text-red-600 mt-1">
            Your request has been saved locally and you can try submitting again later.
          </p>
        </div>
      )}

      {/* Mobile Submit Button */}
      <div className="block md:hidden">
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 safe-area-inset-bottom">
          <div className="p-4 max-w-[428px] mx-auto">
            <Button 
              onClick={onSubmit} 
              disabled={!consent || submitting} 
              className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                  <span className="text-sm sm:text-base">Submitting...</span>
                </div>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Submit Button */}
      <div className="hidden md:block mt-8">
        <Button 
          onClick={onSubmit} 
          disabled={!consent || submitting} 
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200"
        >
          {submitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Submitting...
            </div>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </motion.div>;
};
export default PreviewStep;