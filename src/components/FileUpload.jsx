import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
// File upload component with drag-and-drop support and validation

const FileUpload = ({ onFileSelect, previewUrl, className, children, isAvatar = false, healthRecords = [] }) => {
    const [preview, setPreview] = useState(previewUrl);
    const [fileName, setFileName] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            // Clear any previous errors
            setError('');
            
            // Basic client-side validation (detailed validation will happen in API)
            const maxSize = 5 * 1024 * 1024; // 5MB
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload PDF, JPEG, or PNG files only.');
                return;
            }
            
            if (file.size > maxSize) {
                setError('File size must be under 5MB.');
                return;
            }
            
            // File is valid, proceed with processing
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            if (onFileSelect) {
                onFileSelect(file);
            }
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpeg', '.png'], 'application/pdf': ['.pdf'] } });
    
    const handleRemove = (e) => {
        e.stopPropagation();
        setPreview(null);
        setFileName('');
        setError('');
        if (onFileSelect) {
            onFileSelect(null);
        }
    };
    
    const handleRecordSelect = (record) => {
        setFileName(record.name);
        setPreview(record.dataUrl);
        if (onFileSelect) {
            onFileSelect(record);
        }
        setDialogOpen(false);
    }

    if (preview && isAvatar) {
        return (
            <div className="relative w-24 h-24">
                 {children}
                 <button onClick={handleRemove} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 z-10"><X size={14} /></button>
            </div>
        );
    }
    
    if (preview && !isAvatar) {
         return (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    {preview.startsWith('data:image') ? 
                        <img src={preview} alt="Preview" className="h-12 w-12 rounded-md object-cover flex-shrink-0" /> :
                        <FileText className="h-10 w-10 text-primary flex-shrink-0" />
                    }
                    <p className="font-medium text-sm truncate" title={fileName}>{fileName || "Uploaded File"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRemove} className="text-red-500 hover:text-red-600 flex-shrink-0">
                    <X size={18} />
                </Button>
            </div>
         )
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <div
                {...getRootProps({onClick: e => e.preventDefault()})}
                className={cn(
                    "w-full p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 transition-all text-gray-500 ",
                    isDragActive && "border-primary bg-primary/10",
                    className
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center">
                    <UploadCloud className="w-10 h-10 mx-auto mb-3" />
                    <p className="font-semibold text-gray-700">{isDragActive ? "Drop the files here..." : "Drag & drop file here"}</p>
                    <p className="text-sm">or</p>
                    <div className="flex gap-2 mt-2">
                        <Button onClick={(e) => { e.stopPropagation(); document.querySelector('input[type=file]').click(); }}>Browse Device</Button>
                         <DialogTrigger asChild>
                            <Button variant="outline">From My Records</Button>
                        </DialogTrigger>
                    </div>
                    <p className="text-xs mt-2">Images & PDF supported, up to 5MB</p>
                    {error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <X size={14} />
                                {error}
                            </p>
                        </div>
                    )}
                </div>
            </div>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select from Health Records</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {healthRecords.length > 0 ? (
                        <ul className="space-y-2">
                            {healthRecords.map((record, i) => (
                                <li key={i} onClick={() => handleRecordSelect(record)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer">
                                    <FileText className="h-6 w-6 text-primary flex-shrink-0"/>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold truncate">{record.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(record.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No records found.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FileUpload;