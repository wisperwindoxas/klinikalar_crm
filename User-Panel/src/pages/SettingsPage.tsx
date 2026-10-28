import React, { useState, useEffect } from 'react';
import { UserApiClient } from '../api/client';
import { SettingsView } from '../views/SettingsView';

export const SettingsPage: React.FC = () => {
  const [clinicData, setClinicData] = useState<any>(null);

  useEffect(() => {
    loadClinic();
  }, []);

  const loadClinic = async () => {
    try {
      const res = await UserApiClient.getCurrentClinic();
      setClinicData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return <SettingsView clinicData={clinicData} onRefresh={loadClinic} />;
};
