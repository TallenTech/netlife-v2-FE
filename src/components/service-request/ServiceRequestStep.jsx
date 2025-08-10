import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, AlertCircle } from 'lucide-react';
import LocationSearch from '@/components/LocationSearch';
import FileUpload from '@/components/FileUpload';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ServiceRequestStep = ({ stepConfig, formData, handleInputChange }) => {
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const { activeProfile } = useAuth();

  // Validation functions for different field types
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

  const validateQuantity = (value) => {
    if (value === '' || value === null || value === undefined) {
      return ""; // Optional field
    }
    
    const num = typeof value === 'number' ? value : parseInt(value);
    
    if (isNaN(num)) {
      return "Please enter a valid number.";
    }
    
    if (num < 1) {
      return "Quantity must be at least 1.";
    }
    
    if (num > 10) {
      return "Maximum quantity is 10.";
    }
    
    return "";
  };

  const validateRequired = (value, fieldName) => {
    if (!value || value === '') {
      return `${fieldName} is required.`;
    }
    return "";
  };

  const validateTextArea = (value, maxLength = 500) => {
    if (value && value.length > maxLength) {
      return `Maximum ${maxLength} characters allowed.`;
    }
    return "";
  };

  const handleFieldChange = (name, value, field) => {
    handleInputChange(name, value);
    
    // Real-time validation
    let error = "";
    
    if (field?.type === 'number' && name === 'quantity') {
      error = validateQuantity(value);
    } else if (field?.type === 'textarea') {
      error = validateTextArea(value);
    } else if (field?.required && !value) {
      error = validateRequired(value, field.label);
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
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
            <Label className="text-base font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-3">
              {field.options.map(option => {
                const isSelected = formData[field.name] === option;
                return (
                  <label 
                    key={option} 
                    htmlFor={`${field.name}-${option}`} 
                    className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 min-h-[60px] ${
                      isSelected 
                        ? 'border-primary bg-primary/10 shadow-sm' 
                        : errors[field.name]
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        id={`${field.name}-${option}`}
                        name={field.name}
                        value={option}
                        checked={isSelected}
                        onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary bg-primary' 
                          : 'border-gray-400 bg-white'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        )}
                      </div>
                    </div>
                    <span className={`flex-1 text-base font-medium transition-colors duration-200 ${
                      isSelected ? 'text-primary' : 'text-gray-800'
                    }`}>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
            <ErrorMessage field={field.name} />
          </div>
        );
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => handleFieldChange(field.name, value, field)} value={formData[field.name] || ""}>
              <SelectTrigger 
                id={field.name} 
                className={`h-14 text-base bg-gray-50 border-2 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="z-50 max-h-60 overflow-y-auto">
                {field.options.map(option => (
                  <SelectItem 
                    key={option} 
                    value={option}
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 text-base"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ErrorMessage field={field.name} />
          </div>
        );
      case 'file':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <FileUpload 
              onFileSelect={(file) => handleFieldChange(field.name, file, field)}
              healthRecords={activeProfile?.healthRecords || []}
            />
            <ErrorMessage field={field.name} />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <textarea
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                placeholder={field.placeholder}
                className={`w-full min-h-[120px] p-4 bg-gray-50 rounded-xl border-2 hover:border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base transition-all duration-200 resize-none ${
                  errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                maxLength={500}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {(formData[field.name] || '').length}/500
              </div>
            </div>
            <ErrorMessage field={field.name} />
          </div>
        );
      case 'map':
        return <LocationSearch key={field.name} field={field} value={formData[field.name]} onLocationSelect={(val) => handleLocationSelect(field, val)} />;
      case 'datetime-local':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input 
              id={field.name} 
              name={field.name} 
              type="datetime-local" 
              value={formData[field.name] || ''} 
              onChange={onDateChange} 
              className={`h-14 text-base bg-gray-50 border-2 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            {!errors[field.name] && (
              <p className="text-xs text-gray-500">Select a date at least 6 hours from now</p>
            )}
            <ErrorMessage field={field.name} />
          </div>
        );
      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-base font-semibold text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input 
                id={field.name} 
                type={field.type} 
                placeholder={field.placeholder} 
                value={formData[field.name] || ''} 
                onChange={(e) => {
                  const value = field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
                  handleFieldChange(field.name, value, field);
                }} 
                className={`h-14 text-base bg-gray-50 border-2 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors[field.name] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                min={field.type === 'number' && field.name === 'quantity' ? 1 : undefined}
                max={field.type === 'number' && field.name === 'quantity' ? 10 : undefined}
              />
              {field.type === 'number' && field.name === 'quantity' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  1-10
                </div>
              )}
            </div>
            {field.type === 'number' && field.name === 'quantity' && !errors[field.name] && (
              <p className="text-xs text-gray-500">Enter a number between 1 and 10</p>
            )}
            <ErrorMessage field={field.name} />
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
      className="space-y-8 pb-8"
    >
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{stepConfig.title}</h2>
        <p className="text-gray-600">Please fill in the required information below.</p>
      </div>
      <div className="space-y-6">
        {stepConfig.fields.map(renderField)}
      </div>
    </motion.div>
  );
};

export default ServiceRequestStep;