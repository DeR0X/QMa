import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Calendar, Award, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { RootState } from '../store';
import { formatDate, calculateExpirationDate, isExpiringSoon } from '../lib/utils';
import { hasPermission } from '../store/slices/authSlice';
import { sendQualificationExpiryNotification } from '../lib/notifications';
import TrainingStatistics from '../components/dashboard/TrainingStatistics';
import QualificationDetails from '../components/dashboard/QualificationDetails';
import type { Employee, EmployeeFilters, Qualification } from '../types';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeQualifications } from '../hooks/useEmployeeQualifications';
import { useJobTitles } from '../hooks/useJobTitles';
import { useQualifications } from '../hooks/useQualifications';

interface DashboardStats {
  totalEmployees: number;
  completedTrainings: number;
  expiringQualifications: number;
}

export default function Dashboard() {
  const { employee } = useSelector((state: RootState) => state.auth);
  console.log(employee);
  const isHR = hasPermission(employee, 'HR');
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);
  const { data: jobTitlesData } = useJobTitles();
  const { data: qualificationsData } = useQualifications();
  const { data: employeeQualificationsData, isLoading: isLoadingQualifications } = useEmployeeQualifications(employee?.ID ? employee.ID.toString() : '');

  useEffect(() => {
    if (employee?.ID) {
      const employeeId = employee.ID.toString();
      const employeeQuals = employeeQualificationsData || [];
      const qualifications = qualificationsData || [];

      employeeQuals.forEach((qual:any) => {
        const qualification = qualifications.find(q => q.ID?.toString() === qual.qualificationID);
        if (qualification) {
          const expiryDate = new Date(qual.toQualifyUntil);
          if (isExpiringSoon(expiryDate)) {
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            sendQualificationExpiryNotification(employee, qualification.Name, daysUntilExpiry);
          }
        }
      });
    }
  }, [employee, employeeQualificationsData, qualificationsData]);

  if (!employee) return null;

  if (isLoadingQualifications) {
    return <div>Loading...</div>;
  }


  const jobTitle = employee.JobTitle;
  const userQualifications = employeeQualificationsData || [];

  const stats = [
    { 
      name: 'Aktive Qualifikationen', 
      value: userQualifications.filter((qual:any) => {
        if (!qual.toQualifyUntil) return false;
        const expiryDate = new Date(qual.toQualifyUntil);
        return expiryDate > new Date();
      }).length,
      icon: Award,
      color: 'text-green-500'
    },
    {
      name: 'Auslaufende Qualifikationen',
      value: userQualifications.filter((qual:any) => {
        if (!qual.toQualifyUntil) return false;
        const expiryDate = new Date(qual.toQualifyUntil);
        const twoMonthsFromNow = new Date();
        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
        return expiryDate > new Date() && expiryDate <= twoMonthsFromNow;
      }).length,
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      name: 'Abgelaufene Qualifikationen',
      value: userQualifications.filter((qual:any) => {
        if (!qual.toQualifyUntil) return false;
        const expiryDate = new Date(qual.toQualifyUntil);
        return expiryDate <= new Date();
      }).length,
      icon: AlertCircle,
      color: 'text-red-500'
    }
  ];

  const getQualificationStatus = (qual: any) => {
    if (!qual.toQualifyUntil) return { status: 'inactive' };
    const expiryDate = new Date(qual.toQualifyUntil);
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    const qualification = qualificationsData?.find(q => q.ID?.toString() === qual.qualificationID);
    if (!qualification) return { status: 'inactive' };

    return {
      qualification,
      expiryDate,
      daysUntilExpiry: Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      isExpired: expiryDate <= today,
      isExpiringSoon: expiryDate > today && expiryDate <= twoMonthsFromNow,
      status: expiryDate <= today ? 'expired' : expiryDate <= twoMonthsFromNow ? 'expiring' : 'active'
    };
  };

  const handleQualificationClick = (qual: any) => {
    const qualification = qualificationsData?.find(q => q.ID?.toString() === qual.qualificationID);
    if (qualification) {
      setSelectedQual({
        id: qualification.ID?.toString() || '',
        name: qualification.Name,
        description: qualification.Description,
        requiredQualifications: [],
        validityInMonth: qualification.ValidityInMonth,
        isMandatory: qualification.IsMandatory
      });
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {employee.FullName}
        </h1>
      </div>

      {isHR && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Detaillierte Übersicht aller Schulungen, Teilnehmer und Qualifikationen im Unternehmen. 
                Verfolgen Sie den Fortschritt, identifizieren Sie Schulungsbedarf und planen Sie zukünftige Maßnahmen.
              </p>
            </div>
          </div>
          <TrainingStatistics />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ihre Schulungsübersicht und bevorstehende Sitzungen
          </p>
        </div>
        <GraduationCap className="h-8 w-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] p-6 shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Bevorstehende Schulungen
            </h2>
            <div className="mt-6 flow-root">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Keine bevorstehenden Schulungen geplant
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Ihre Qualifikationen
              </h2>
              <div className="mt-2 sm:mt-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Building2 className="h-4 w-4 mr-1" />
                <span>Position: {jobTitle}</span>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {userQualifications.map((qual : any) => {
                const status = getQualificationStatus(qual);
                if (!status) return null;

                return (
                  <div key={qual.id} className="flex flex-col sm:flex-row items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary"
                        onClick={() => handleQualificationClick(qual)}
                      >
                        {status.qualification?.Name || 'Unbekannte Qualifikation'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gültig bis {status.expiryDate ? formatDate(status.expiryDate) : 'N/A'}
                      </p>
                    </div>
                    <div className="ml-0 sm:ml-4 mt-2 sm:mt-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status.status)}`}>
                        {status.isExpired ? 'Abgelaufen' : status.isExpiringSoon ? `${status.daysUntilExpiry} Tage` : 'Gültig'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {userQualifications.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Keine Qualifikationen für Ihre aktuelle Position erforderlich
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedQual && (
        <QualificationDetails
          qualification={selectedQual}
          onClose={() => setSelectedQual(null)}
        />
      )}
    </div>
  );
}