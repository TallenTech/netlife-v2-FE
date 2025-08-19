import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useUserData } from '@/contexts/UserDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FileUpload from '@/components/FileUpload';

const HealthRecords = () => {
    const { userData, updateUserData, activeProfile } = useUserData();
    const [recordName, setRecordName] = useState('');
    const [recordFile, setRecordFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const records = activeProfile?.healthRecords || [];

    const onFileSelect = useCallback((file) => {
        if (file) {
            setRecordFile(file);
            if (!recordName) {
                setRecordName(file.name.split('.').slice(0, -1).join('.'));
            }
        } else {
            setRecordFile(null);
        }
    }, [recordName]);

    const handleUpload = () => {
        if (!recordName.trim() || !recordFile) {
            toast({ title: 'Missing information', description: 'Please provide a name and select a file.', variant: 'destructive' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const newRecord = { name: recordName, type: recordFile.type, size: recordFile.size, dataUrl: e.target.result, uploadedAt: new Date().toISOString() };
            const updatedRecords = [...records, newRecord];

            if (activeProfile.isMain) {
                updateUserData({ ...userData, healthRecords: updatedRecords });
            } else {
                const updatedDependents = userData.dependents.map(d =>
                    d.id === activeProfile.id ? { ...d, healthRecords: updatedRecords } : d
                );
                updateUserData({ ...userData, dependents: updatedDependents });
            }

            toast({ title: 'Record Uploaded', description: `${recordName} has been saved.` });
            setRecordName('');
            setRecordFile(null);
        };
        reader.readAsDataURL(recordFile);
    };

    const handleDelete = (indexToDelete) => {
        const updatedRecords = records.filter((_, index) => index !== indexToDelete);
        if (activeProfile.isMain) {
            updateUserData({ ...userData, healthRecords: updatedRecords });
        } else {
            const updatedDependents = userData.dependents.map(d =>
                d.id === activeProfile.id ? { ...d, healthRecords: updatedRecords } : d
            );
            updateUserData({ ...userData, dependents: updatedDependents });
        }
        toast({ title: 'Record Deleted', description: 'The record has been removed.' });
    };

    const handlePreview = (record) => {
        setPreview(record);
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <>
            <Helmet><title>Health Records - NetLife</title></Helmet>
            <div className="py-4 md:py-6 bg-gray-50 min-h-screen">
                <header className="flex items-center space-x-4 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft /></Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Health Records for {activeProfile.username}</h1>
                        <p className="text-sm text-gray-500">Securely upload and manage documents.</p>
                    </div>
                </header>

                <div className="bg-white p-6 rounded-2xl border mb-6">
                    <h2 className="font-bold mb-4">Upload New Record</h2>
                    <div className="space-y-4">
                        <Input placeholder="Record name (e.g., Lab Results)" value={recordName} onChange={(e) => setRecordName(e.target.value)} />
                        <FileUpload onFileSelect={onFileSelect} />
                        <Button onClick={handleUpload} className="w-full">Upload Record</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="font-bold text-lg">My Records</h2>
                    {records.length > 0 ? records.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center space-x-3">
                                <FileText className="text-primary" />
                                <div>
                                    <p className="font-semibold">{record.name}</p>
                                    <p className="text-xs text-gray-500">{formatBytes(record.size)} - {new Date(record.uploadedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Button size="icon" variant="ghost" onClick={() => handlePreview(record)}><Eye size={16} /></Button>
                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(index)}><Trash2 size={16} /></Button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-8">No records uploaded yet.</p>
                    )}
                </div>

                <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{preview?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 max-h-[70vh] overflow-auto">
                            {preview?.type.startsWith('image/') ? (
                                <img src={preview.dataUrl} alt={preview.name} className="max-w-full h-auto rounded-lg" />
                            ) : (
                                <iframe src={preview?.dataUrl} title={preview?.name} className="w-full h-[60vh]" />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default HealthRecords;