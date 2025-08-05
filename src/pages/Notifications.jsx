import React from 'react';
import { Helmet } from 'react-helmet';
import { Bell, ChevronLeft, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const notifications = [
  { id: 1, title: 'PrEP Reminder', message: 'Time for your daily PrEP dose.', time: '5m ago', read: false, type: 'reminder' },
  { id: 2, title: 'New Video Available', message: 'Learn about "Safe Practices".', time: '2h ago', read: false, type: 'content' },
  { id: 3, title: 'Survey Results Ready', message: 'Your health survey results are in.', time: '1d ago', read: true, type: 'result' },
  { id: 4, title: 'Service Update', message: 'Your request for STI testing has been confirmed.', time: '2d ago', read: true, type: 'service' },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClearAll = () => {
    toast({
      title: 'Notifications Cleared',
      description: 'All notifications have been removed.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Notifications - NetLife</title>
      </Helmet>
      <div className="p-6 bg-gray-50 min-h-screen">
        <header className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/privacy')}>
            <Settings size={22} />
          </Button>
        </header>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-end">
                <Button variant="link" className="text-primary" onClick={handleClearAll}>
                    <Trash2 size={14} className="mr-1" />
                    Clear All
                </Button>
            </div>
            {notifications.map(notification => (
              <div key={notification.id} className={`bg-white p-4 rounded-2xl border flex items-start space-x-4 ${!notification.read ? 'border-primary/50' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                    notification.type === 'reminder' ? 'bg-blue-100 text-blue-600' :
                    notification.type === 'content' ? 'bg-green-100 text-green-600' :
                    notification.type === 'result' ? 'bg-purple-100 text-purple-600' :
                    'bg-yellow-100 text-yellow-600'
                }`}>
                  <Bell size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                </div>
                {!notification.read && <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1"></div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">No Notifications Yet</h2>
            <p className="text-gray-500">We'll let you know when there's something new.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;