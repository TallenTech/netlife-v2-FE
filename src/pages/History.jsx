import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Download, Share2, FileText, HeartPulse, FilePlus, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import { serviceRequestForms } from '@/data/serviceRequestForms';
import { useNavigate } from 'react-router-dom';

const tabs = ['Services', 'Screening', 'Records'];

const History = () => {
  const [activeTab, setActiveTab] = useState('Services');
  const [historyItems, setHistoryItems] = useState({ Services: [], Screening: [], Records: [] });
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const firstName = profile?.username?.split(' ')[0] || '';
  const usernameElement = <span className="username-gradient">{firstName}</span>;

  useEffect(() => {
    if (!profile) return;

    const loadHistory = () => {
      const services = [];
      const screening = [];
      const records = [];
      
      console.log('Loading history for profile:', profile?.id, profile?.username);
      
      // Debug: Show all localStorage keys
      console.log('All localStorage keys:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`  ${i}: ${key}`);
      }

      // Load Service Requests
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('service_request_')) {
          const item = JSON.parse(localStorage.getItem(key));
          console.log('Found service request:', key, 'stored profile ID:', item.profile?.id, 'current profile ID:', profile.id);
          if(item.profile && item.profile.id === profile.id) {
              const serviceId = key.split('_')[2];
              const timestamp = parseInt(key.split('_')[3]);
              const formConfig = serviceRequestForms[serviceId];
              const recordItem = {
                id: key,
                title: formConfig?.title || 'Service Request',
                date: new Date(timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
                status: item.savedToDatabase ? 'Submitted' : 'Saved Locally',
                icon: HeartPulse,
                data: item,
                type: 'service_request',
              };
              services.push(recordItem);
              records.push(recordItem);
          }
        }
        
        // Load Screening Results
        if (key.startsWith('screening_results_')) {
          const item = JSON.parse(localStorage.getItem(key));
          const keyParts = key.split('_');
          const serviceId = keyParts[2];
          const profileId = keyParts[3];
          
          console.log('Found screening result:', key, 'stored profile ID:', profileId, 'current profile ID:', profile.id);
          
          if (profileId === profile.id || profileId === 'anonymous') {
            const recordItem = {
              id: key,
              title: 'Health Screening Results',
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
              status: 'Complete',
              result: `${item.score}% Eligibility Score`,
              eligibility: item.eligible ? 'Eligible' : 'Not Eligible',
              icon: FileText,
              data: item,
              type: 'screening_results',
            };
            screening.push(recordItem);
            records.push(recordItem);
          }
        }
      }

      // Load Health Survey Data
      const surveyData = localStorage.getItem(`netlife_health_survey_${profile.id}`);
      if (surveyData) {
        const parsedSurvey = JSON.parse(surveyData);
        const surveyRecord = {
          id: `health_survey_result_${profile.id}`,
          title: 'Health Risk Assessment',
          date: new Date(parsedSurvey.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: '2-digit' }),
          status: 'Complete',
          result: `${parsedSurvey.score}/10 Score`,
          icon: FileText,
          data: parsedSurvey,
          type: 'health_survey',
        };
        screening.push(surveyRecord);
        records.push(surveyRecord);
      }

      setHistoryItems({
        Services: services.sort((a, b) => new Date(b.data.completedAt) - new Date(a.data.completedAt)),
        Screening: screening.sort((a, b) => new Date(b.data?.completedAt || Date.now()) - new Date(a.data?.completedAt || Date.now())),
        Records: records.sort((a, b) => new Date(b.data?.completedAt || Date.now()) - new Date(a.data?.completedAt || Date.now())),
      });
    };

    loadHistory();
  }, [profile]);

  const handleShare = async (item) => {
    const shareUrl = `${window.location.origin}/records/${item.id}`;
    const shareData = {
      title: `My NetLife Record: ${item.title}`,
      text: `View my health record from NetLife, shared securely.`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link Copied!',
        description: 'A shareable link to your record has been copied to your clipboard.',
      });
    }
  };

  const handleDownload = (item) => {
    toast({
      title: "Generating PDF...",
      description: "Your record is being prepared for download."
    });

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`NetLife Health Record: ${item.title}`, 14, 22);

    doc.setFontSize(12);
    doc.text(`User: ${profile?.username || 'User'}`, 14, 32);
    doc.text(`Date: ${item.date}`, 14, 38);
    
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    doc.setFontSize(10);
    let y = 55;

    if (item.type === 'service_request') {
      Object.entries(item.data.request).forEach(([key, value]) => {
        const fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(`${fieldLabel}:`, 14, y);
        doc.text(String(value), 60, y);
        y += 7;
      });
    } else if (item.type === 'health_survey') {
        doc.text(`Prevention Score: ${item.data.score}/10`, 14, y);
        y += 10;
        doc.text('Recommendations:', 14, y);
        y += 7;
        item.data.recommendations.forEach(rec => {
            doc.text(`- ${rec}`, 18, y);
            y += 7;
        });
    }
    
    doc.save(`netlife-record-${item.title.replace(/\s+/g, '-')}.pdf`);
  };


  const handleItemClick = (item) => {
    navigate(`/records/${item.id}`);
  };

  const renderEmptyState = (tab) => {
    const messages = {
      Services: { title: "No Service History", message: "You haven't requested any services yet. Explore our services to get started.", cta: "Go to Services", action: () => navigate('/services'), icon: HeartPulse},
      Screening: { title: "No Screening History", message: "You haven't completed any health screenings. Take a survey to assess your health.", cta: "Take a Survey", action: () => navigate(`/survey/${profile?.id || 'main'}`), icon: FileText },
      Records: { title: "No Health Records", message: "Your submitted forms and results will appear here.", cta: "Go to Dashboard", action: () => navigate('/dashboard'), icon: FilePlus },
    };
    const { title, message, cta, action, icon: Icon } = messages[tab];
    return (
      <div className="text-center py-16 px-6 bg-gray-50 rounded-2xl">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center mb-4"><Icon size={32} /></div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 mt-2 mb-6">{message}</p>
        <Button onClick={action}>{cta}</Button>
      </div>
    );
  };

  return (
    <>
      <Helmet><title>Health History - NetLife</title></Helmet>
      <div className="p-4 md:p-6 bg-white min-h-screen">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">Health History</h1>
          <p className="text-gray-500">Hi {usernameElement}, here's a summary of your activities.</p>
        </header>

        <div className="bg-gray-100 p-1 rounded-full flex justify-around items-center mb-6">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === tab ? 'bg-white text-primary shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {historyItems[activeTab].length > 0 ? (
            historyItems[activeTab].map(item => (
              <div key={item.id} className="bg-white border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div onClick={() => handleItemClick(item)} className="flex justify-between items-start cursor-pointer">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-primary/10 text-primary p-3 rounded-full"><item.icon size={20} /></div>
                      <div>
                        <h3 className="font-bold text-gray-800">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.status === 'Complete' || item.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{item.status}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                </div>
                {(item.result || item.eligibility) && (
                  <>
                    <div className="border-t my-3"></div>
                    {item.result && (
                      <p className="text-sm text-gray-600">Result: <span className="font-semibold text-gray-800">{item.result}</span></p>
                    )}
                    {item.eligibility && (
                      <p className="text-sm text-gray-600">Eligibility: <span className={`font-semibold ${item.eligibility === 'Eligible' ? 'text-green-600' : 'text-red-600'}`}>{item.eligibility}</span></p>
                    )}
                  </>
                )}
                <div className="border-t my-3"></div>
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleShare(item)}>
                        <Share2 size={14} className="mr-2" /> Share
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(item)}>
                        <Download size={14} className="mr-2" /> Download
                    </Button>
                </div>
              </div>
            ))
          ) : (
            renderEmptyState(activeTab)
          )}
        </div>
      </div>
    </>
  );
};

export default History;