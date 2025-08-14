import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Bell, 
  ChevronLeft, 
  Settings, 
  Trash2, 
  CheckCircle, 
  FileText, 
  HeartPulse, 
  Video,
  RefreshCw,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';
import { formatSmartTime } from '@/utils/timeUtils';
import { motion } from 'framer-motion';

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile, profile } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (profile) {
      loadNotifications();
      setupRealtimeSubscription();
    }

    return () => {
      if (subscription) {
        notificationService.unsubscribeFromNotifications(subscription);
      }
    };
  }, [profile]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { success, data } = await notificationService.getUserNotifications(profile.id);
      
      if (success) {
        setNotifications(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load notifications.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const sub = notificationService.subscribeToNotifications(
      profile.id,
      (payload) => {
        console.log('Notification update:', payload);
        // Reload notifications when there's a change
        loadNotifications();
      }
    );
    setSubscription(sub);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { success } = await notificationService.markAsRead(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { success } = await notificationService.markAllAsRead(profile.id);
      
      if (success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        toast({
          title: 'All Marked as Read',
          description: 'All notifications have been marked as read.',
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const { success } = await notificationService.deleteNotification(notificationId);
      
      if (success) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        toast({
          title: 'Notification Deleted',
          description: 'Notification has been removed.',
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = async () => {
    try {
      // Delete all notifications for the user
      const deletePromises = notifications.map(notif => 
        notificationService.deleteNotification(notif.id)
      );
      
      await Promise.all(deletePromises);
      
      setNotifications([]);
      setDeleteAllDialogOpen(false);
      
      toast({
        title: 'All Notifications Cleared',
        description: 'All notifications have been removed.',
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear all notifications.',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (notification) => {
    const type = notification.type;

    switch (type) {
      case 'service_request':
      case 'service_request_status':
        return <HeartPulse size={20} />;
      case 'screening_result':
        return <FileText size={20} />;
      case 'video':
        return <Video size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationColor = (notification) => {
    const type = notification.type;

    switch (type) {
      case 'service_request':
        return 'bg-blue-100 text-blue-600';
      case 'service_request_status':
        return 'bg-green-100 text-green-600';
      case 'screening_result':
        return 'bg-purple-100 text-purple-600';
      case 'video':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <>
      <Helmet>
        <title>Notifications - NetLife</title>
      </Helmet>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={loadNotifications}
            disabled={loading}
          >
            <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
          </Button>
        </header>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                filter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="text-primary hover:text-primary/80"
            >
              <CheckCircle size={14} className="mr-1" />
              Mark All Read
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDeleteAllDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} className="mr-1" />
              Clear All
            </Button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white p-4 rounded-2xl border flex items-start space-x-4 ${
                  !notification.read ? 'border-primary/50 bg-primary/5' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                  getNotificationColor(notification)
                }`}>
                  {getNotificationIcon(notification)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{notification.title}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatSmartTime(notification.created_at)}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={notification.read}
                      >
                        {notification.read ? (
                          <>
                            <EyeOff size={14} className="mr-2" />
                            Already Read
                          </>
                        ) : (
                          <>
                            <Eye size={14} className="mr-2" />
                            Mark as Read
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">
              {filter === 'unread' ? 'No Unread Notifications' : 
               filter === 'read' ? 'No Read Notifications' : 
               'No Notifications Yet'}
            </h2>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "We'll let you know when there's something new."
                : `No ${filter} notifications to show.`
              }
            </p>
          </div>
        )}

        {/* Delete All Confirmation Dialog */}
        <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Notifications</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all notifications? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className="bg-red-600 hover:bg-red-700"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Notifications;