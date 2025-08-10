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
  const { profile } = useAuth();
  const handleFieldSave = (fieldName, newValue) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
  };
  const userAge = calculateAge(profile?.birthDate);
  const firstName = profile?.username?.split(' ')[0] || '';
  const renderAvatar = () => {
    if (!profile) {
      return <AvatarFallback className="text-2xl">?</AvatarFallback>;
    }
    if (profile.profilePhoto) {
      return <AvatarImage src={profile.profilePhoto} alt={profile.username} />;
    }
    if (profile.avatar) {
      return <AvatarFallback className="text-2xl bg-transparent">{getAvatarEmoji(profile.avatar)}</AvatarFallback>;
    }
    return <AvatarFallback className="text-2xl">{firstName.charAt(0).toUpperCase()}</AvatarFallback>;
  };
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.5
  }} className="space-y-6 pb-24">
      <div className="p-4 bg-white rounded-xl border-2 border-gray-100">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
                {renderAvatar()}
            </Avatar>
            <div>
                <h3 className="font-bold text-lg text-gray-900">Personal Info</h3>
                <p className="text-sm text-gray-500">Fetched from your profile.</p>
            </div>
        </div>
        <div className="mt-4 space-y-3 text-base text-gray-700">
          <p><strong>Name:</strong> {profile?.username || 'N/A'}</p>
          <p><strong>Gender:</strong> {profile?.gender || 'N/A'}</p>
          {userAge && <p><strong>Age:</strong> {userAge} years</p>}
          <p><strong>Phone:</strong> {profile?.phoneNumber || 'N/A'}</p>
          <p><strong>Location:</strong> {`${profile?.subCounty || ''}${profile?.subCounty ? ', ' : ''}${profile?.district || 'N/A'}`}</p>
        </div>
      </div>

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

      <div className="flex items-start space-x-3 mt-6 p-4 bg-primary/5 rounded-lg">
        <Checkbox id="consent" checked={consent} onCheckedChange={setConsent} className="mt-1" />
        <label htmlFor="consent" className="text-sm text-gray-700">
          I confirm that the information provided is accurate and I consent to NetLife processing this request.
        </label>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="p-4 max-w-[428px] mx-auto">
            <Button 
              onClick={onSubmit} 
              disabled={!consent || submitting} 
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
        </div>
      </div>

      {/* Desktop Submit Button */}
      <div className="hidden md:block mt-8">
        <Button 
          onClick={onSubmit} 
          disabled={!consent || submitting} 
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed text-white"
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