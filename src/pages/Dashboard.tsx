import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Calendar, Award, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { RootState } from '../store';
import { trainings, bookings, qualifications, employees, jobTitles } from '../data/mockData';
import { formatDate, calculateExpirationDate, isExpiringSoon } from '../lib/utils';
import { hasHRPermissions } from '../store/slices/authSlice';
import { sendQualificationExpiryNotification } from '../lib/notifications';
import TrainingStatistics from '../components/dashboard/TrainingStatistics';
import QualificationDetails from '../components/dashboard/QualificationDetails';
import type { Qualification, Employee, EmployeeFilters } from '../types';
import { useEmployees } from '../hooks/useEmployees';

interface DashboardStats {
  totalEmployees: number;
  completedTrainings: number;
  pendingTrainings: number;
  expiringQualifications: number;
}

export default function Dashboard() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const isHR = hasHRPermissions(employee);
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);

/*   console.log("Current employee ", employee); */
  // Fetch employees data using the same hook as Employees page
  const filters: EmployeeFilters = {
    page: 1,
    limit: 10,
    sortBy: 'SurName',
    sortOrder: 'asc',
    department: employee?.DepartmentID?.toString(),
  };

  const { 
    data: employeesData, 
    isLoading, 
    error 
  } = useEmployees(filters);

  useEffect(() => {
    if (employee) {
      const jobTitle = jobTitles.find(jt => jt.id === employee.JobTitleID?.toString());
      const userQuals = qualifications.filter(qual => jobTitle?.qualificationIDs.includes(qual.id));
      
      userQuals.forEach(qual => {
        const lastTraining = bookings
          .filter(b => b.userId === employee.ID.toString() && b.status === 'abgeschlossen')
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

        if (lastTraining?.completedAt) {
          const expirationDate = calculateExpirationDate(lastTraining.completedAt, qual.validityInMonth);
          if (isExpiringSoon(expirationDate)) {
            const daysUntilExpiry = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            sendQualificationExpiryNotification(employee, qual.name, daysUntilExpiry);
          }
        }
      });
    }
  }, [employee]);

  if (!employee) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-gray-500 dark:text-gray-400">Laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg text-red-500">Fehler beim Laden der Daten</p>
      </div>
    );
  }

  const userBookings = bookings.filter(booking => booking.userId === employee.ID);
  const jobTitle = jobTitles.find(jt => jt.id === employee.JobTitleID?.toString());
  const userQualifications = qualifications.filter(qual => jobTitle?.qualificationIDs.includes(qual.id));

  const stats = [
    { 
      name: 'Abgeschlossene Schulungen', 
      value: userBookings.filter(b => b.status === 'abgeschlossen').length,
      icon: CheckCircle 
    },
    { 
      name: 'Ausstehende Schulungen', 
      value: userBookings.filter(b => b.status === 'genehmigt').length,
      icon: Clock 
    },
    { 
      name: 'Verfügbare Schulungen', 
      value: trainings.length - userBookings.length,
      icon: Calendar 
    },
  ];

  const getQualificationStatus = (qualId: string) => {
    const employeeQual = userQualifications.find((qual) => qual.id === qualId);
    if (!employeeQual) return 'inactive';

    const lastTraining = userBookings
      .filter(b => b.status === 'abgeschlossen')
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    const expiryDate = lastTraining && lastTraining.completedAt
      ? calculateExpirationDate(lastTraining.completedAt, employeeQual.validityInMonth)
      : new Date();
    const today = new Date();
    const twoMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());

    if (expiryDate <= twoMonthsFromNow) return 'expired';
    return 'active';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'expiring':
        return 'Läuft bald ab';
      case 'expired':
        return 'Abgelaufen';
      default:
        return 'Inaktiv';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {employee.fullName}
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
                <stat.icon className="h-8 w-8 text-primary" />
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
                <span>Position: {jobTitle?.jobTitle}</span>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {userQualifications.map((qual) => {
                const lastTraining = userBookings
                  .filter(b => b.status === 'abgeschlossen' && trainings.find(t => t.id === b.trainingId)?.id)
                  .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

                const expirationDate = lastTraining?.completedAt
                  ? calculateExpirationDate(lastTraining.completedAt, qual.validityInMonth)
                  : null;

                return (
                  <div key={qual.id} className="flex flex-col sm:flex-row items-center justify-between">
                    <div className="flex-1">
                      <h3 
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary"
                        onClick={() => setSelectedQual(qual)}
                      >
                        {qual.name}
                      </h3>
                      {expirationDate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Gültig bis {formatDate(expirationDate)}
                        </p>
                      )}
                    </div>
                    <div className="ml-0 sm:ml-4 mt-2 sm:mt-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(getQualificationStatus(qual.id))}`}>
                        {getStatusText(getQualificationStatus(qual.id))}
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