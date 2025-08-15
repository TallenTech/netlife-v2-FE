import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Save, FileText, Image, Download, Eye } from 'lucide-react';
import DateTimePicker from '@/components/ui/DateTimePicker';
import AttachmentViewer from '@/components/AttachmentViewer';

const EditableField = ({ field, value, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const hasOptions = field.type === 'radio' || field.type === 'select';
    
    // Handle object values (like location data and file attachments)
    const getDisplayValue = (val) => {
        if (typeof val === 'object' && val !== null) {
            if (val.address) {
                return val.address;
            }
            // Handle file attachments
            if (val.path || val.relativePath) {
                return null; // Will be handled by file preview component
            }
            return JSON.stringify(val);
        }
        
        // Handle datetime display
        if (field.type === 'datetime-local' && val) {
            const date = new Date(val);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            return `${dateStr} at ${timeStr}`;
        }
        
        return val || '';
    };
    
    // Check if this is a file attachment
    const isFileAttachment = (val) => {
        return typeof val === 'object' && val !== null && (val.path || val.relativePath);
    };
    
    // Get file info for display
    const getFileInfo = (val) => {
        if (!isFileAttachment(val)) return null;
        
        const fileName = val.path || val.relativePath || 'Unknown file';
        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        
        return {
            name: fileName,
            extension: fileExtension,
            isImage,
            url: val.path || val.relativePath
        };
    };
    
    const displayValue = getDisplayValue(value);
    const fileInfo = getFileInfo(value);

    const handleSave = () => {
        onSave(currentValue);
        setIsEditing(false);
    };

    const handleOpen = () => {
        setCurrentValue(value);
        setIsEditing(true);
    }

    // Handle file attachment display
    if (isFileAttachment(value)) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {fileInfo.isImage ? (
                            <Image className="h-5 w-5 text-blue-600" />
                        ) : (
                            <FileText className="h-5 w-5 text-gray-600" />
                        )}
                        <div>
                            <p className="font-medium text-gray-900">{fileInfo.name}</p>
                            <p className="text-sm text-gray-500">
                                {fileInfo.extension.toUpperCase()} file
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(fileInfo.url, '_blank')}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}>
                            <Edit className="h-4 w-4 text-primary" />
                        </Button>
                    </div>
                </div>
                
                {/* File preview for images */}
                {fileInfo.isImage && (
                    <div className="mt-3">
                        <img 
                            src={fileInfo.url} 
                            alt={fileInfo.name}
                            className="max-w-full h-32 object-cover rounded-lg border"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>
        );
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

    // Handle datetime editing
    if (field.type === 'datetime-local') {
        return (
            <>
                <div className="flex items-center justify-between">
                    <span>{displayValue}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}>
                        <Edit className="h-4 w-4 text-primary" />
                    </Button>
                </div>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Edit {field.label}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <DateTimePicker
                                value={currentValue || ''}
                                onChange={setCurrentValue}
                                label=""
                                placeholder="Choose date and time"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
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