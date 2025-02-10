import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  GraduationCap, Calendar, AlertTriangle, 
  BookOpen, Award, X, CheckCircle, 
  CalendarCheck, PieChart, Users, Clock,
  Building2
} from 'lucide-react';
import { RootState } from '../store';
import { trainings, bookings, qualifications, employees, jobTitles, departments } from '../data/mockData';
import { formatDate, calculateExpirationDate, isExpiringSoon } from '../lib/utils';
import { hasHRPermissions } from '../store/slices/authSlice';
import type { Qualification } from '../types';
import { sendQualificationExpiryNotification } from '../lib/notifications';

function StatisticsModal({ 
  isOpen, 
  onClose, 
  title, 
  employees, 
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  employees: Array<any>; 
  type: 'all' | 'completed' | 'pending' | 'expiring';
}) {
  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            Abgeschlossen
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-4 h-4 mr-1" />
            Ausstehend
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Ablaufend
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[#181818]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mitarbeiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abteilung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-[#141616]">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {employee.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.staffNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {departments.find(d => d.id === employee.departmentID)?.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {jobTitles.find(jt => jt.id === employee.jobTitleID)?.jobTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {type === 'expiring' && employee.expiringQualifications?.map((qual: any) => (
                      <div key={qual.id} className="text-sm text-gray-500 dark:text-gray-400">
                        {qual.name} - Läuft ab am {formatDate(qual.expirationDate)}
                      </div>
                    ))}
                    {type === 'completed' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {employee.completedTrainings} abgeschlossene Schulungen
                      </div>
                    )}
                    {type === 'pending' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {employee.pendingTrainings} ausstehende Schulungen
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrainingStatistics({ departmentFilter = 'all' }) {
  const [selectedStat, setSelectedStat] = useState<'all' | 'completed' | 'pending' | 'expiring' | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  const allUsers = employees.filter(u => 
    departmentFilter === 'all' || u.departmentID === departmentFilter
  );

  const stats = {
    totalEmployees: allUsers.length,
    completedTrainings: 0,
    pendingTrainings: 0,
    expiringQualifications: 0,
  };

  // Process employee data
  const employeesWithStats = allUsers.map(employee => {
    const jobTitle = jobTitles.find(jt => jt.id === employee.jobTitleID);
    const requiredQuals = jobTitle ? jobTitle.qualificationIDs : [];
    const employeeQuals = qualifications.filter(qual => requiredQuals.includes(qual.id));

    // Calculate qualification status
    const qualStatus = employeeQuals.map(qual => {
      const lastTraining = bookings
        .filter(b => b.userId === employee.id && b.status === 'abgeschlossen')
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

      if (!lastTraining?.completedAt) return { ...qual, status: 'missing' };

      const expirationDate = calculateExpirationDate(lastTraining.completedAt, qual.validityInMonth);
      return {
        ...qual,
        status: expirationDate < new Date() ? 'expired' :
                isExpiringSoon(expirationDate) ? 'expiring' : 'active',
        expirationDate
      };
    });

    const completedTrainings = bookings.filter(
      b => b.userId === employee.id && b.status === 'abgeschlossen'
    ).length;
    const pendingTrainings = bookings.filter(
      b => b.userId === employee.id && b.status === 'ausstehend'
    ).length;
    const expiringQuals = qualStatus.filter(q => q.status === 'expiring' || q.status === 'expired');

    stats.completedTrainings += completedTrainings;
    stats.pendingTrainings += pendingTrainings;
    stats.expiringQualifications += expiringQuals.length;

    return {
      ...employee,
      completedTrainings,
      pendingTrainings,
      expiringQualifications: expiringQuals,
      qualifications: qualStatus,
    };
  });

  // Filter employees based on selected stat
  const getFilteredEmployees = () => {
    switch (selectedStat) {
      case 'all':
        return employeesWithStats;
      case 'completed':
        return employeesWithStats.filter(e => e.completedTrainings > 0);
      case 'pending':
        return employeesWithStats.filter(e => e.pendingTrainings > 0);
      case 'expiring':
        return employeesWithStats.filter(e => e.expiringQualifications.length > 0);
      default:
        return [];
    }
  };

  const statCards = [
    {
      title: 'Mitarbeiter',
      value: stats.totalEmployees,
      icon: Users,
      type: 'all' as const,
      color: 'text-gray-400',
    },
    {
      title: 'Abgeschlossen',
      value: stats.completedTrainings,
      icon: CheckCircle,
      type: 'completed' as const,
      color: 'text-green-500',
    },
    {
      title: 'Ausstehend',
      value: stats.pendingTrainings,
      icon: Clock,
      type: 'pending' as const,
      color: 'text-yellow-500',
    },
    {
      title: 'Ablaufend',
      value: stats.expiringQualifications,
      icon: AlertTriangle,
      type: 'expiring' as const,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <PieChart className="h-5 w-5 mr-2" />
          Schulungsstatistik
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 dark:bg-[#181818] dark:hover:bg-[#1a1a1a] dark:border-gray-700"
        >
          {showDetails ? 'Übersicht anzeigen' : 'Details anzeigen'}
        </button>
      </div>

      {!showDetails ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                onClick={() => setSelectedStat(stat.type)}
                className="bg-gray-50 dark:bg-[#121212] p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <Icon className={`h-5 w-5 mr-2 ${stat.color}`} />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </span>
                </div>
                <p className={`mt-2 text-2xl font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {departments.map(dept => (
            <div key={dept.id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 dark:bg-[#121212] p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedDepartments(prev => 
                  prev.includes(dept.id) 
                    ? prev.filter(id => id !== dept.id)
                    : [...prev, dept.id]
                )}
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {dept.department}
                  </h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {employeesWithStats.filter(e => e.departmentID === dept.id).length} Mitarbeiter
                  </span>
                </div>
              </div>
              {expandedDepartments.includes(dept.id) && (
                <div className="p-4">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Mitarbeiter
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Position
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Abgeschlossen
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Ausstehend
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Ablaufend
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {employeesWithStats
                        .filter(e => e.departmentID === dept.id)
                        .map(employee => (
                          <tr key={employee.id}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {employee.fullName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                              {jobTitles.find(jt => jt.id === employee.jobTitleID)?.jobTitle}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {employee.completedTrainings}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                {employee.pendingTrainings}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                {employee.expiringQualifications.length}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={selectedStat !== null}
        onClose={() => setSelectedStat(null)}
        title={selectedStat === 'all' ? 'Alle Mitarbeiter' :
              selectedStat === 'completed' ? 'Abgeschlossene Schulungen' :
              selectedStat === 'pending' ? 'Ausstehende Schulungen' :
              'Ablaufende Qualifikationen'}
        employees={getFilteredEmployees()}
        type={selectedStat || 'all'}
      />
    </div>
  );
}

export default function Dashboard() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const isHR = hasHRPermissions(employee);
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);

  useEffect(() => {
    if (employee) {
      // Get qualifications based on job title
      const jobTitle = jobTitles.find(jt => jt.id === employee.jobTitleID);
      const userQuals = qualifications.filter(qual => jobTitle?.qualificationIDs.includes(qual.id));
      
      // Check for expiring qualifications and send notifications
      userQuals.forEach(qual => {
        const lastTraining = bookings
          .filter(b => b.userId === employee.id && b.status === 'abgeschlossen')
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

  const userBookings = bookings.filter(booking => booking.userId === employee.id);
  const jobTitle = jobTitles.find(jt => jt.id === employee.jobTitleID);
  const userQualifications = qualifications.filter(qual => jobTitle?.qualificationIDs.includes(qual.id));

  // Calculate expiring qualifications (2 months warning)
  const expiringQualifications = userQualifications.filter(qual => {
    const lastTraining = userBookings
      .filter(b => b.status === 'abgeschlossen' && trainings.find(t => t.id === b.trainingId)?.id)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    if (!lastTraining?.completedAt) return false;

    const expirationDate = calculateExpirationDate(lastTraining.completedAt, qual.validityInMonth);
    return isExpiringSoon(expirationDate);
  });

  const pendingBookings = userBookings.filter(b => b.status === 'ausstehend');

  const stats = [
    { 
      name: 'Abgeschlossen Schulungen', 
      value: userBookings.filter(b => b.status === 'abgeschlossen').length,
      icon: CheckCircle 
    },
    { 
      name: 'Genehmigte Schulungen', 
      value: userBookings.filter(b => b.status === 'genehmigt').length,
      icon: CalendarCheck 
    },
    { 
      name: 'Verfügbare Schulungen', 
      value: trainings.length - userBookings.length,
      icon: BookOpen 
    },
  ];

  return (
    <div className="space-y-6">
      {isHR && <TrainingStatistics />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {employee.fullName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Ihre Qualifikationen
              </h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Building2 className="h-4 w-4 mr-1" />
                Position: {jobTitle?.jobTitle}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {userQualifications.map((qual) => {
                const lastTraining = userBookings
                  .filter(b => b.status === 'abgeschlossen' && trainings
                    .find(t => t.id === b.trainingId)?.id)
                  .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

                const expirationDate = lastTraining?.completedAt
                  ? calculateExpirationDate(lastTraining.completedAt, qual.validityInMonth)
                  : null;

                return (
                  <div key={qual.id} className="flex items-center justify-between">
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
                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expirationDate && expirationDate > new Date()
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {expirationDate && expirationDate > new Date() ? 'Aktiv' : 'Abgelaufen'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#121212] rounded-lg p-6 max-w-md w-full m-4 relative">
            <button
              onClick={() => setSelectedQual(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {selectedQual.name}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300">
              {selectedQual.description}
            </p>
            
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Gültigkeitsdauer: {selectedQual.validityInMonth} Monate</p>
              <p className="mt-2">Erforderliche Schulungen:</p>
              <ul className="list-disc list-inside mt-1">
                {selectedQual.requiredTrainings.map(trainingId => {
                  const training = trainings.find(t => t.id === trainingId);
                  return training && (
                    <li key={trainingId}>{training.title}</li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}