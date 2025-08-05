import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserData } from '@/contexts/UserDataContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { calculateAge, getAvatarEmoji } from '@/lib/utils';
import EditableField from './EditableField';
const PreviewStep = ({
  formData,
  setFormData,
  formConfig,
  goToStep,
  onSubmit
}) => {
  const [consent, setConsent] = useState(false);
  const {
    activeProfile
  } = useUserData();
  const handleFieldSave = (fieldName, newValue) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
  };
  const userAge = calculateAge(activeProfile?.birthDate);
  const firstName = activeProfile?.username?.split(' ')[0] || '';
  const renderAvatar = () => {
    if (activeProfile.profilePhoto) {
      return <AvatarImage src={activeProfile.profilePhoto} alt={activeProfile.username} />;
    }
    if (activeProfile.avatar) {
      return <AvatarFallback className="text-2xl bg-transparent">{getAvatarEmoji(activeProfile.avatar)}</AvatarFallback>;
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
          <p><strong>Name:</strong> {activeProfile.username}</p>
          <p><strong>Gender:</strong> {activeProfile.gender}</p>
          {userAge && <p><strong>Age:</strong> {userAge} years</p>}
          <p><strong>Phone:</strong> {activeProfile.phoneNumber}</p>
          <p><strong>Location:</strong> {`${activeProfile.subCounty || ''}${activeProfile.subCounty ? ', ' : ''}${activeProfile.district}`}</p>
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
      
      <div className="mt-auto p-4 sm:p-6 bg-white border-t fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto">
        <Button onClick={onSubmit} disabled={!consent} className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 rounded-xl font-bold">
          Submit Request
        </Button>
      </div>
    </motion.div>;
};
export default PreviewStep;