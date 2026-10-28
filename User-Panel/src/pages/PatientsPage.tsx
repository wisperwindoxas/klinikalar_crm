import React, { useState, useEffect } from 'react';
import { UserApiClient } from '../api/client';
import { PatientsView } from '../views/PatientsView';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await UserApiClient.getPatients();
      setPatients(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  return <PatientsView patients={patients} onRefresh={loadPatients} />;
};
