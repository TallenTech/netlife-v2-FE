import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ValidationSummary = ({ errors, stepConfig, formData }) => {
  const visibleFields = stepConfig.fields.filter(field => 
    !field.condition || field.condition(formData)
  );
  
  const requiredFields = visibleFields.filter(field => field.required);
  const completedFields = requiredFields.filter(field => {
    const value = formData[field.name];
    return value && value !== '' && (!Array.isArray(value) || value.length > 0);
  });
  
  const missingFields = requiredFields.filter(field => {
    const value = formData[field.name];
    return !value || value === '' || (Array.isArray(value) && value.length === 0);
  });

  if (requiredFields.length === 0) {
    return null; // No required fields in this step
  }

  const isComplete = missingFields.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border-2 ${
        isComplete 
          ? 'bg-green-50 border-green-200' 
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {isComplete ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        )}
        
        <div className="flex-1">
          <h4 className={`font-semibold text-sm ${
            isComplete ? 'text-green-800' : 'text-amber-800'
          }`}>
            {isComplete 
              ? 'All required fields completed!' 
              : `${missingFields.length} required field${missingFields.length > 1 ? 's' : ''} remaining`
            }
          </h4>
          
          <div className="mt-2 text-sm">
            <div className={`${isComplete ? 'text-green-700' : 'text-amber-700'}`}>
              Progress: {completedFields.length} of {requiredFields.length} completed
            </div>
            
            <AnimatePresence>
              {!isComplete && missingFields.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <div className="text-amber-700 font-medium mb-1">Still needed:</div>
                  <ul className="space-y-1">
                    {missingFields.map(field => (
                      <li key={field.name} className="text-amber-600 text-xs flex items-center gap-1">
                        <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                        {field.label}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ValidationSummary;