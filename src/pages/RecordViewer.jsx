import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Calendar, CheckCircle, HeartPulse, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/contexts/UserDataContext';
import { serviceRequestForms } from '@/data/serviceRequestForms';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarEmoji } from '@/lib/utils';

const RecordViewer = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { allProfiles } = useUserData();

  const [record, setRecord] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const item = localStorage.getItem(recordId);
    if (item) {
        const parsedItem = JSON.parse(item);
        setRecord(parsedItem);
        const profileId = parsedItem.profile?.id || parsedItem.profileId;
        const foundProfile = allProfiles.find(p => p.id === profileId);
        setProfile(foundProfile);
    }
  }, [recordId, allProfiles]);

  const isServiceRequest = recordId.startsWith('service_request_');
  const isHealthSurvey = recordId.startsWith('health_survey_result_');
  
  let title = "Record Details";
  let recordData = null;

  if (record) {
    if (isServiceRequest) {
      const serviceId = recordId.split('_')[2];
      const formConfig = serviceRequestForms[serviceId];
      title = formConfig?.title || "Service Request";
      recordData = record.request;
    } else if (isHealthSurvey) {
      title = "Health Risk Assessment";
      recordData = record;
    }
  }

  const renderAvatar = (p) => {
    if (p?.profilePhoto) {
        return <AvatarImage src={p.profilePhoto} alt={p.username} />
    }
    if (p?.avatar) {
        return <AvatarFallback className="text-2xl bg-transparent">{getAvatarEmoji(p.avatar)}</AvatarFallback>
    }
    return <AvatarFallback>{p?.username?.charAt(0).toUpperCase()}</AvatarFallback>
  }

  const renderServiceRequest = () => (
    <div className="space-y-6">
      {Object.entries(recordData || {}).map(([key, value]) => {
        if (!value) return null;
        let displayValue = value;
        if (typeof value === 'object' && value.name) {
          displayValue = value.name;
        } else if (typeof value !== 'string') {
          displayValue = String(value);
        }

        const fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return (
          <div key={key}>
            <p className="text-sm font-semibold text-gray-500">{fieldLabel}</p>
            <p className="text-lg text-gray-800">{displayValue}</p>
          </div>
        );
      })}
    </div>
  );

  const renderHealthSurvey = () => (
    <div className="space-y-6">
      <div className="text-center bg-primary/10 p-6 rounded-2xl">
        <p className="font-semibold text-primary">Prevention Score</p>
        <p className="text-6xl font-bold text-primary my-1">{recordData.score}/10</p>
        <p className="text-primary/80">A great result!</p>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Recommendations</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {recordData.recommendations?.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
  
  const renderEmptyRecord = () => (
    <div className="text-center py-10 px-6 bg-yellow-50 rounded-2xl border border-yellow-200">
      <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
      <h3 className="mt-4 text-lg font-semibold text-yellow-800">Record Not Found</h3>
      <p className="mt-2 text-sm text-yellow-600">
        The record you are looking for could not be found. It might have been deleted or the link is incorrect.
      </p>
      <Button onClick={() => navigate('/history')} className="mt-6">Go Back to History</Button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{title} - NetLife Records</title>
      </Helmet>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <header className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
        </header>

        {recordData && profile ? (
          <div className="bg-white p-6 rounded-2xl border space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b">
              <Avatar className="h-16 w-16">
                {renderAvatar(profile)}
              </Avatar>
              <div>
                <h2 className="font-bold text-lg text-gray-900"><span className="username-gradient">{profile.username}</span></h2>
                <p className="text-sm text-gray-500">Record Summary</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-primary" />
                <div>
                  <strong>Date:</strong> {new Date(record.completedAt || record.request?.timestamp || Date.now()).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                {isServiceRequest ? <HeartPulse size={16} className="text-primary" /> : <CheckCircle size={16} className="text-primary" />}
                <div>
                  <strong>Status:</strong> {isServiceRequest ? 'Submitted' : 'Complete'}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              {isServiceRequest && renderServiceRequest()}
              {isHealthSurvey && renderHealthSurvey()}
            </div>
          </div>
        ) : (
          renderEmptyRecord()
        )}
      </div>
    </>
  );
};

export default RecordViewer;