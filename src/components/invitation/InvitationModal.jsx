import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Copy, MessageCircle, Users, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { invitationService } from '@/services/invitationService';

const InvitationModal = ({ isOpen, onClose, userId }) => {
    const { toast } = useToast();
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            loadReferralData();
        }
    }, [isOpen, userId]);

    const loadReferralData = async () => {
        setIsLoading(true);
        try {
            const result = await invitationService.getUserReferralData(userId);
            if (result.success) {
                setReferralData(result.data);
            } else {
                toast({
                    title: "Error",
                    description: "Could not load your referral data.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load referral data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleWhatsAppShare = () => {
        if (!referralData?.referral_code) return;

        invitationService.shareViaWhatsApp(referralData.referral_code);

        toast({
            title: "Shared via WhatsApp",
            description: "Your invitation has been shared!",
        });

        onClose();
    };

    const handleCopyLink = async () => {
        if (!referralData?.referral_code) return;

        const success = await invitationService.copyInvitationLink(referralData.referral_code);

        if (success) {
            setCopied(true);
            toast({
                title: "Link Copied",
                description: "Invitation link copied to clipboard!",
            });

            setTimeout(() => setCopied(false), 2000);
        } else {
            toast({
                title: "Copy Failed",
                description: "Could not copy link to clipboard.",
                variant: "destructive",
            });
        }
    };

    const getInvitationLink = () => {
        if (!referralData?.referral_code) return '';
        return invitationService.generateInvitationLink(referralData.referral_code);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Invite Friends</h2>
                                <p className="text-sm text-gray-500">Share NetLife with others</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading your invitation data...</p>
                            </div>
                        ) : (
                            <>
                                {/* Invitation Link */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Your Invitation Link
                                    </label>
                                    <div className="flex space-x-2">
                                        <Input
                                            value={getInvitationLink()}
                                            readOnly
                                            className="flex-1 text-sm"
                                        />
                                        <Button
                                            onClick={handleCopyLink}
                                            variant="outline"
                                            size="sm"
                                            className={copied ? "bg-green-50 border-green-200 text-green-700" : ""}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Share Buttons */}
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleWhatsAppShare}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        size="lg"
                                    >
                                        <MessageCircle className="w-5 h-5 mr-2" />
                                        Share via WhatsApp
                                    </Button>

                                    <Button
                                        onClick={handleCopyLink}
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Copy className="w-5 h-5 mr-2" />
                                        Copy Link
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InvitationModal;
