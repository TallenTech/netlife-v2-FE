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
    // Handle different record types
    if (recordId.startsWith('db_')) {
      // Database records - we need to reconstruct the data
      // For now, show a message that this feature is coming soon
      setRecord({ 
        type: 'database_record',
        message: 'Database record viewing is coming soon. Please check your history for now.'
      });
    } else {
      // localStorage records
      const item = localStorage.getItem(recordId);
      if (item) {
          const parsedItem = JSON.parse(item);
          setRecord(parsedItem);
          const profileId = parsedItem.profile?.id || parsedItem.profileId;
          const foundProfile = allProfiles.find(p => p.id === profileId);
          setProfile(foundProfile);
      }
    }
  }, [recordId, allProfiles]);

  const isServiceRequest = recordId.startsWith('service_request_');
  const isHealthSurvey = recordId.startsWith('health_survey_result_');
  const isScreeningResult = recordId.startsWith('screening_results_');
  const isDatabaseRecord = recordId.startsWith('db_');
  
  let title = "Record Details";
  let recordData = null;

  if (record) {
    if (record.type === 'database_record') {
      title = "Database Record";
      recordData = record;
    } else if (isServiceRequest) {
      const serviceId = recordId.split('_')[2];
      const formConfig = serviceRequestForms[serviceId];
      title = formConfig?.title || "Service Request";
      recordData = record.request;
    } else if (isHealthSurvey) {
      title = "Health Risk Assessment";
      recordData = record;
    } else if (isScreeningResult) {
      // Handle screening results
      const serviceId = recordId.split('_')[2];
      const formConfig = serviceRequestForms[serviceId];
      title = formConfig ? `${formConfig.title} - Screening` : "Service Screening";
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

  const renderScreeningResult = () => (
    <div className="space-y-6">
      <div className="text-center bg-primary/10 p-6 rounded-2xl">
        <p className="font-semibold text-primary">Eligibility Score</p>
        <p className="text-6xl font-bold text-primary my-1">{recordData.score}%</p>
        <p className="text-primary/80">
          {recordData.eligible ? 'Eligible for service' : 'Not currently eligible'}
        </p>
      </div>
      
      {recordData.answers && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Screening Answers</h3>
          <div className="space-y-3">
            {Object.entries(recordData.answers).map(([questionIndex, answer], index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-gray-500">Question {parseInt(questionIndex) + 1}</p>
                <p className="text-lg text-gray-800 capitalize">{String(answer)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Completed:</strong> {recordData.completedAt ? new Date(recordData.completedAt).toLocaleString() : 'Recently'}
        </p>
      </div>
    </div>
  );

  const renderDatabaseRecord = () => (
    <div className="text-center py-10 px-6 bg-blue-50 rounded-2xl border border-blue-200">
      <HeartPulse className="mx-auto h-12 w-12 text-blue-500 mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-2">Database Record</h3>
      <p className="text-gray-600 mb-4">{recordData.message}</p>
      <Button onClick={() => navigate('/history')} variant="outline">
        Back to History
      </Button>
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
                  <strong>Status:</strong> {
                    isServiceRequest ? 'Submitted' : 
                    isScreeningResult ? 'Complete' :
                    isDatabaseRecord ? 'Stored' :
                    'Complete'
                  }
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              {record.type === 'database_record' && renderDatabaseRecord()}
              {isServiceRequest && renderServiceRequest()}
              {isHealthSurvey && renderHealthSurvey()}
              {isScreeningResult && renderScreeningResult()}
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