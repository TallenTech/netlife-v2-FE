import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, BellOff, Trash2, Download, UserX, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


const Privacy = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [privacySettings, setPrivacySettings] = useState({
        anonymousMode: false,
        autoDeleteDays: '30',
        silentNotifications: true,
        fakeAccountMode: false,
    });

    const handleSettingChange = (key, value) => {
        setPrivacySettings(prev => ({...prev, [key]: value}));
        toast({
            title: "Setting Updated",
            description: "Your privacy setting has been saved."
        })
    };

    const handleAccountAction = (action) => {
        toast({
            title: "Action Initiated",
            description: `Your request to ${action} has been received. This feature is a prototype.`
        });
    }

    const handleLogout = () => {
        localStorage.clear();
        toast({
            title: 'Account Deleted',
            description: 'Your account and data have been permanently deleted.',
            variant: 'destructive'
        });
        navigate('/');
        window.location.reload();
    };

    return (
        <>
            <Helmet>
                <title>Privacy & Security - NetLife</title>
            </Helmet>
            <div className="p-6 bg-gray-50 min-h-screen">
                <header className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate(-1)}>
                        <ChevronLeft size={24} />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Privacy & Security</h1>
                </header>

                <div className="bg-white p-6 rounded-2xl border mb-6">
                    <h2 className="text-lg font-bold mb-4">Privacy Controls</h2>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="anonymous-mode" className="font-medium text-gray-800">Anonymous Mode</label>
                                <p className="text-sm text-gray-500">Hide personal information</p>
                            </div>
                            <Switch id="anonymous-mode" checked={privacySettings.anonymousMode} onCheckedChange={(val) => handleSettingChange('anonymousMode', val)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-gray-800">Auto-delete Data</label>
                                <p className="text-sm text-gray-500">Delete survey data automatically</p>
                            </div>
                            <Select value={privacySettings.autoDeleteDays} onValueChange={(val) => handleSettingChange('autoDeleteDays', val)}>
                                <SelectTrigger className="w-32 h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">After 7 days</SelectItem>
                                    <SelectItem value="30">After 30 days</SelectItem>
                                    <SelectItem value="90">After 90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="silent-notifications" className="font-medium text-gray-800">Silent Notifications</label>
                                <p className="text-sm text-gray-500">Disguise health alerts</p>
                            </div>
                            <Switch id="silent-notifications" checked={privacySettings.silentNotifications} onCheckedChange={(val) => handleSettingChange('silentNotifications', val)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="fake-account" className="font-medium text-gray-800">Fake Account Mode</label>
                                <p className="text-sm text-gray-500">Load generic dashboard</p>
                            </div>
                            <Switch id="fake-account" checked={privacySettings.fakeAccountMode} onCheckedChange={(val) => handleSettingChange('fakeAccountMode', val)} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border mb-6">
                    <h2 className="text-lg font-bold mb-4 text-destructive">Account Actions</h2>
                    <div className="space-y-3">
                         <Button variant="outline" className="w-full justify-start" onClick={() => handleAccountAction('Download All Data')}>
                             <Download size={16} className="mr-2" /> Download All Data
                         </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full justify-start">
                                    <Trash2 size={16} className="mr-2" /> Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Privacy;