import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, AlertCircle } from 'lucide-react';
import LocationSearch from '@/components/LocationSearch';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/components/ui/use-toast';
import { useUserData } from '@/contexts/UserDataContext';

const ServiceRequestStep = ({ stepConfig, formData, handleInputChange }) => {
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const { activeProfile } = useUserData();

  const validateDateTime = (value) => {
    if (!value) return "This field is required.";

    const selectedDate = new Date(value);
    const now = new Date();
    
    const minDate = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
    const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

    if (selectedDate < minDate) {
      return "Date must be at least 6 hours from now.";
    }
    if (selectedDate > maxDate) {
      return "Date must be within the next 60 days.";
    }
    return "";
  };

  const handleFieldChange = (name, value) => {
    handleInputChange(name, value);
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const onDateChange = (e) => {
    const { name, value } = e.target;
    const error = validateDateTime(value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
      toast({
        title: "Invalid Date",
        description: error,
        variant: "destructive",
      });
    } else {
        const newErrors = {...errors};
        delete newErrors[name];
        setErrors(newErrors);
    }
    handleFieldChange(name, value);
  };

  const handleLocationSelect = (field, locationData) => {
    // Enhanced location data processing
    const processedLocation = {
      address: locationData.address || locationData,
      coordinates: locationData.coordinates || null,
      details: locationData.details || null,
      timestamp: new Date().toISOString()
    };
    
    handleFieldChange(field.name, processedLocation);
  };

  const validateDeliveryMethod = (method) => {
    const validMethods = ['Home Delivery', 'Facility pickup', 'Community Group Delivery', 'Pick-up from facility'];
    return validMethods.includes(method);
  };

  const ErrorMessage = ({ field }) => {
    return errors[field] ? (
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-red-600 flex items-center gap-1 mt-1"
      >
        <AlertCircle size={14} /> {errors[field]}
      </motion.p>
    ) : null;
  }

  const renderField = (field) => {
    if (field.condition && !field.condition(formData)) return null;

    switch (field.type) {
      case 'radio':
        return (
          <div key={field.name} className="space-y-3">
            <Label className="text-base">{field.label}</Label>
            <div className="space-y-2">
              {field.options.map(option => (
                <label key={option} htmlFor={`${field.name}-${option}`} className="flex items-center space-x-3 p-4 bg-gray-100 rounded-lg cursor-pointer transition-all border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                  <input
                    type="radio"
                    id={`${field.name}-${option}`}
                    name={field.name}
                    value={option}
                    checked={formData[field.name] === option}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="form-radio h-5 w-5 text-primary focus:ring-primary focus:ring-2"
                  />
                  <span className="flex-1 text-base font-medium text-gray-800">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base">{field.label}</Label>
            <Select onValueChange={(value) => handleFieldChange(field.name, value)} value={formData[field.name]}>
              <SelectTrigger id={field.name} className="h-14 text-base">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        );
      case 'file':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base">{field.label}</Label>
            <FileUpload 
              onFileSelect={(file) => handleFieldChange(field.name, file)}
              healthRecords={activeProfile?.healthRecords || []}
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base">{field.label}</Label>
            <textarea
              id={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full min-h-[120px] p-3 bg-gray-100 rounded-lg border border-gray-200 focus:ring-primary focus:border-primary text-base"
            />
          </div>
        );
      case 'map':
        return <LocationSearch key={field.name} field={field} value={formData[field.name]} onLocationSelect={(val) => handleLocationSelect(field, val)} />;
      case 'datetime-local':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base">{field.label}</Label>
            <Input id={field.name} name={field.name} type="datetime-local" value={formData[field.name] || ''} onChange={onDateChange} className="h-14 text-base" />
            <ErrorMessage field={field.name} />
          </div>
        );
      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base">{field.label}</Label>
            <Input id={field.name} type={field.type} placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} className="h-14 text-base" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <h2 className="text-3xl font-bold text-gray-800">{stepConfig.title}</h2>
      {stepConfig.fields.map(renderField)}
    </motion.div>
  );
};

export default ServiceRequestStep;