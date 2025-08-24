import React, { useState, useEffect } from 'react';
import { Users, Gift, TrendingUp } from 'lucide-react';
import { invitationService } from '@/services/invitationService';

const InvitationStats = ({ userId }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadStats();
        }
    }, [userId]);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const result = await invitationService.getInvitationStats(userId);
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Error loading invitation stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white p-4 rounded-2xl border">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="text-center">
                            <div className="h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats?.referralData) {
        return null;
    }

    const { referralData } = stats;
    const conversionRate = referralData.total_invites > 0
        ? Math.round((referralData.successful_invites / referralData.total_invites) * 100)
        : 0;

    return (
        <div className="bg-white p-4 rounded-2xl border">
            <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Invitation Stats</h3>
                    <p className="text-xs text-gray-500">Your referral activity</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-lg font-bold text-primary">
                        {referralData.total_invites}
                    </div>
                    <div className="text-xs text-gray-500">Total Invites</div>
                </div>

                <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                        {referralData.successful_invites}
                    </div>
                    <div className="text-xs text-gray-500">Successful</div>
                </div>

                <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                        {conversionRate}%
                    </div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                </div>
            </div>

            {referralData.successful_invites > 0 && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700">
                            Great job! You've successfully invited {referralData.successful_invites} people.
                        </span>
                    </div>
                </div>
            )}

            {referralData.total_invites === 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-700">
                            Start inviting friends to earn rewards and build your community!
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvitationStats;
