import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Save } from 'lucide-react';

const EditableField = ({ field, value, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const hasOptions = field.type === 'radio' || field.type === 'select';
    
    // Handle object values (like location data)
    const getDisplayValue = (val) => {
        if (typeof val === 'object' && val !== null) {
            if (val.address) {
                return val.address;
            }
            return JSON.stringify(val);
        }
        return val || '';
    };
    
    const displayValue = getDisplayValue(value);

    const handleSave = () => {
        onSave(currentValue);
        setIsEditing(false);
    };

    const handleOpen = () => {
        setCurrentValue(value);
        setIsEditing(true);
    }

    if (hasOptions) {
        return (
            <>
                <div className="flex items-center justify-between">
                    <span>{displayValue}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}><Edit className="h-4 w-4 text-primary" /></Button>
                </div>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit {field.label}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                        {field.options.map(option => (
                            <label key={option} htmlFor={`edit-${field.name}-${option}`} className="flex items-center space-x-3 p-3 my-2 bg-gray-100 rounded-lg cursor-pointer transition-all border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                <input
                                type="radio"
                                id={`edit-${field.name}-${option}`}
                                name={`edit-${field.name}`}
                                value={option}
                                checked={currentValue === option}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                className="form-radio h-5 w-5 text-primary focus:ring-primary"
                                />
                                <span className="flex-1 text-base font-medium text-gray-800">{option}</span>
                            </label>
                        ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="h-10" />
                <Button size="icon" onClick={handleSave} className="h-10 w-10 bg-green-500 hover:bg-green-600"><Save className="h-5 w-5" /></Button>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-between">
            <span>{displayValue}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 text-primary" /></Button>
        </div>
    );
};

export default EditableField;