import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Calendar, Award, Building2, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { RootState } from '../store';
import { formatDate, calculateExpirationDate, isExpiringSoon, getLatestQualifications } from '../lib/utils';
import { hasPermission } from '../store/slices/authSlice';
import { sendQualificationExpiryNotification } from '../lib/notifications';
import TrainingStatistics from '../components/dashboard/TrainingStatistics';
import type { Employee, EmployeeFilters, Qualification } from '../types';
import { useEmployees } from '../hooks/useEmployees';
import { useEmployeeQualifications } from '../hooks/useEmployeeQualifications';
import { useJobTitles } from '../hooks/useJobTitles';
import { useQualifications } from '../hooks/useQualifications';
import { useTrainings } from '../hooks/useTrainings';

interface DashboardStats {
  totalEmployees: number;
  completedTrainings: number;
  expiringQualifications: number;
}

export default function Dashboard() {
  const { employee } = useSelector((state: RootState) => state.auth);
  const isHR = hasPermission(employee, 'hr');
  const isAdmin = hasPermission(employee, 'admin');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'pflicht' | 'job' | 'additional'>('all');
  const { data: jobTitlesData } = useJobTitles();
  const { data: qualificationsData } = useQualifications();
  const { data: employeeQualificationsData = [], isLoading: isLoadingQualifications } = useEmployeeQualifications(employee?.ID ? employee.ID.toString() : '');
  const { data: assignedTrainings, isLoading: isLoadingTrainings } = useTrainings(employee?.ID ? employee.ID.toString() : '');

  useEffect(() => {
    if (employee?.ID) {
      const employeeId = employee.ID.toString();
      const employeeQuals = Array.isArray(employeeQualificationsData) ? employeeQualificationsData : [];
      const qualifications = qualificationsData || [];

      employeeQuals.forEach((qual:any) => {
        if (!qual || !qual.QualificationID) return;
        const qualification = qualifications.find(q => q?.ID === qual.QualificationID);
        if (qualification && qualification.Name && qual.toQualifyUntil) {
          const expiryDate = new Date(qual.toQualifyUntil);
          if (!isNaN(expiryDate.getTime()) && isExpiringSoon(expiryDate)) {
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
  // Filter out qualifications that no longer exist in qualificationsData and use getLatestQualifications
  const employeeQualifications = getLatestQualifications(
    (Array.isArray(employeeQualificationsData) ? employeeQualificationsData : []).filter((qual: any) => {
      return qual?.QualificationID && qualificationsData?.some(q => q?.ID === qual.QualificationID)
    })
  );

  // Update the filteredQualifications to include type filtering
  const filteredQualifications = employeeQualifications.filter(qual => {
    if (!qual?.QualificationID) return false;
    const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
    if (!qualification) return false;

    // If qualification never expires (999 months), handle specially
    if (qualification.ValidityInMonth === 999) {
      let statusMatch = false;
      switch (selectedFilter) {
        case 'active':
          statusMatch = true; // Always active
          break;
        case 'expiring':
        case 'expired':
          statusMatch = false; // Never expiring or expired
          break;
        default:
          statusMatch = true;
      }
      
      // Type filtering
      let typeMatch = false;
      switch (selectedTypeFilter) {
        case 'pflicht':
          typeMatch = qualification.Herkunft === "Pflicht";
          break;
        case 'job':
          typeMatch = qualification.JobTitle !== null;
          break;
        case 'additional':
          typeMatch = qualification.Herkunft === "Zusatz";
          break;
        default:
          typeMatch = true;
      }

      return statusMatch && typeMatch;
    }

    // Status filtering for qualifications that do expire
    const expiryDate = qual.isQualifiedUntil 
      ? new Date(qual.isQualifiedUntil)
      : qual.toQualifyUntil 
        ? new Date(qual.toQualifyUntil)
        : null;
    
    if (!expiryDate || isNaN(expiryDate.getTime())) return false;
    
    const now = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(now.getMonth() + 2);

    let statusMatch = false;
    switch (selectedFilter) {
      case 'active':
        statusMatch = expiryDate > twoMonthsFromNow;
        break;
      case 'expiring':
        statusMatch = expiryDate <= twoMonthsFromNow && expiryDate > now;
        break;
      case 'expired':
        statusMatch = expiryDate <= now;
        break;
      default:
        statusMatch = true;
    }

    // Type filtering
    let typeMatch = false;
    switch (selectedTypeFilter) {
      case 'pflicht':
        typeMatch = qualification.Herkunft === "Pflicht";
        break;
      case 'job':
        typeMatch = qualification.JobTitle !== null;
        break;
      case 'additional':
        typeMatch = qualification.Herkunft === "Zusatz";
        break;
      default:
        typeMatch = true;
    }

    return statusMatch && typeMatch;
  });

  // Calculate counts for type filters
  const typeFilterCounts = {
    mandatory: employeeQualifications.filter(qual => {
      if (!qual?.QualificationID) return false;
      const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
      return qualification?.Herkunft === "Pflicht";
    }).length,
    job: employeeQualifications.filter(qual => {
      if (!qual?.QualificationID) return false;
      const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
      return qualification?.JobTitle !== null && qualification?.IsMandatory !== true;
    }).length,
    additional: employeeQualifications.filter(qual => {
      if (!qual?.QualificationID) return false;
      const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
      return qualification?.Herkunft === "Zusatz" && qualification?.IsMandatory !== true;
    }).length
  };

  // Calculate qualification statistics
  const qualificationStats = {
    active: employeeQualifications.filter(qual => {
      if (!qual?.QualificationID) return false;
      const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
      
      // If qualification never expires (999 months), always count as active
      if (qualification?.ValidityInMonth === 999) {
        return true;
      }
      
      const expiryDate = qual.isQualifiedUntil 
        ? new Date(qual.isQualifiedUntil)
        : qual.toQualifyUntil 
          ? new Date(qual.toQualifyUntil)
          : null;
      
      if (!expiryDate || isNaN(expiryDate.getTime())) return false;
      
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(new Date().getMonth() + 2);
      return expiryDate > twoMonthsFromNow;
    }).length,
    
    expiring: employeeQualifications.filter(qual => {
      if (!qual?.QualificationID) return false;
      const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
      
      // If qualification never expires (999 months), never count as expiring
      if (qualification?.ValidityInMonth === 999) {
        return false;
      }
      
      const expiryDate = qual.isQualifiedUntil 
        ? new Date(qual.isQualifiedUntil)
        : qual.toQualifyUntil 
          ? new Date(qual.toQualifyUntil)
          : null;
      
      if (!expiryDate || isNaN(expiryDate.getTime())) return false;
      
      const now = new Date();
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(now.getMonth() + 2);
      return expiryDate <= twoMonthsFromNow && expiryDate > now;
    }).length,
    
    expired: employeeQualifications.filter(qual => {
      if (!qual?.QualificationID) return false;
      const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
      
      // If qualification never expires (999 months), never count as expired
      if (qualification?.ValidityInMonth === 999) {
        return false;
      }
      
      const expiryDate = qual.isQualifiedUntil 
        ? new Date(qual.isQualifiedUntil)
        : qual.toQualifyUntil 
          ? new Date(qual.toQualifyUntil)
          : null;
      
      if (!expiryDate || isNaN(expiryDate.getTime())) return false;
      
      return expiryDate <= new Date();
    }).length
  };

  // Update the filteredQualifications logic to handle the status text
  const getQualificationStatus = (qual: any) => {
    if (!qual?.QualificationID) return '';
    const qualification = qualificationsData?.find(q => q?.ID === qual.QualificationID);
    
    // If qualification never expires (999 months), always show as "Aktiv"
    if (qualification?.ValidityInMonth === 999) {
      return 'Aktiv';
    }
    
    const expiryDate = qual.isQualifiedUntil 
      ? new Date(qual.isQualifiedUntil)
      : qual.toQualifyUntil 
        ? new Date(qual.toQualifyUntil)
        : null;
    
    if (!expiryDate || isNaN(expiryDate.getTime())) return 'Erforderlich';
    
    const now = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(now.getMonth() + 2);
    
    if (expiryDate > twoMonthsFromNow) {
      return 'Aktiv';
    } else if (expiryDate <= twoMonthsFromNow && expiryDate > now) {
      // If the qualification was never completed (no qualifiedFrom date), show "Erforderlich"
      return qual.qualifiedFrom ? 'Auslaufend' : 'Erforderlich';
    } else {
      return 'Abgelaufen';
    }
  };

  const getQualificationStatusColor = (qual: any) => {
    const status = getQualificationStatus(qual);
    
    switch (status) {
      case 'Aktiv':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Auslaufend':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'Erforderlich':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'Abgelaufen':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {employee.FullName}
          <span className="ml-2 text-lg font-normal text-gray-500 dark:text-gray-400">
            ({employee.Department})
          </span>
        </h1>
      </div>

      {(isHR || isAdmin || employee.isSupervisor === 1) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isHR || isAdmin
                  ? 'Detaillierte Übersicht aller Schulungen, Teilnehmer und Qualifikationen im Unternehmen. Verfolgen Sie den Fortschritt, identifizieren Sie Schulungsbedarf und planen Sie zukünftige Maßnahmen.'
                  : 'Übersicht der Schulungen und Qualifikationen Ihrer Mitarbeiter. Verfolgen Sie den Fortschritt und identifizieren Sie Schulungsbedarf in Ihrem Team.'}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white dark:bg-[#181818] shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Bevorstehende Schulungen
            </h2>
            <div className="mt-6 flow-root">
              {isLoadingTrainings ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Lade Schulungen...
                </p>
              ) : assignedTrainings?.filter(training => !training.completed).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Keine bevorstehenden Schulungen geplant
                </p>
              ) : (
                <div className="space-y-4">
                  {assignedTrainings
                    ?.filter(training => !training.completed)
                    .sort((a, b) => {
                      // Sortiere nach Datum, wobei null/undefined Datumsangaben ans Ende kommen
                      const dateA = a.trainingDate ? new Date(a.trainingDate).getTime() : Number.MAX_SAFE_INTEGER;
                      const dateB = b.trainingDate ? new Date(b.trainingDate).getTime() : Number.MAX_SAFE_INTEGER;
                      return dateA - dateB;
                    })
                    .map(training => (
                      <div
                        key={training.ID}
                        className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {training.Name}
                              </h3>
                              {training.isMandatory && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                  Pflichtschulung
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {training.Description}
                            </p>
                            {training.trainingDate && (
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Termin: {new Date(training.trainingDate).toLocaleDateString()}
                              </p>
                            )}
                            <div className="mt-2 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Noch zu absolvieren
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Qualifications Section */}
        <div className="bg-white dark:bg-[#121212] rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Ihre Qualifikationen
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Übersicht Ihrer aktuellen und bevorstehenden Qualifikationen
                </p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>

            {/* Status Filter Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-primary text-white dark:bg-blue-600 dark:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Alle ({employeeQualifications.length})
              </button>
              <button
                onClick={() => setSelectedFilter('active')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Aktiv ({qualificationStats.active})
              </button>
              <button
                onClick={() => setSelectedFilter('expiring')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === 'expiring'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Auslaufend ({qualificationStats.expiring})
              </button>
              <button
                onClick={() => setSelectedFilter('expired')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedFilter === 'expired'
                    ? 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Abgelaufen ({qualificationStats.expired})
              </button>
            </div>

            {/* Type Filter Buttons - New Design */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qualifikationstypen
                </h3>
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    selectedTypeFilter === 'all'
                      ? 'bg-primary text-white shadow-sm hover:bg-primary/90 dark:bg-blue-600 dark:hover:bg-blue-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <svg 
                    className={`w-4 h-4 ${selectedTypeFilter === 'all' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 6h16M4 12h16m-7 6h7" 
                    />
                  </svg>
                  Alle anzeigen
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedTypeFilter('pflicht')}
                  className={`flex items-center p-3 rounded-lg border transition-all ${
                    selectedTypeFilter === 'pflicht'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : 'border-gray-200 hover:border-red-200 hover:bg-red-50/50 dark:border-gray-700 dark:hover:border-red-800 dark:hover:bg-red-900/10'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        selectedTypeFilter === 'pflicht' ? 'bg-red-500' : 'bg-red-300'
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedTypeFilter === 'pflicht'
                          ? 'text-red-800 dark:text-red-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Pflicht
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {typeFilterCounts.mandatory} Qualifikationen
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTypeFilter('job')}
                  className={`flex items-center p-3 rounded-lg border transition-all ${
                    selectedTypeFilter === 'job'
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:border-blue-800 dark:hover:bg-blue-900/10'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        selectedTypeFilter === 'job' ? 'bg-blue-500' : 'bg-blue-300'
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedTypeFilter === 'job'
                          ? 'text-blue-800 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                                                        Position
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {typeFilterCounts.job} Qualifikationen
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTypeFilter('additional')}
                  className={`flex items-center p-3 rounded-lg border transition-all ${
                    selectedTypeFilter === 'additional'
                      ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
                      : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50 dark:border-gray-700 dark:hover:border-purple-800 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        selectedTypeFilter === 'additional' ? 'bg-purple-500' : 'bg-purple-300'
                      }`} />
                      <span className={`text-sm font-medium ${
                        selectedTypeFilter === 'additional'
                          ? 'text-purple-800 dark:text-purple-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Zusatz
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {typeFilterCounts.additional} Qualifikationen
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Qualifications List */}
          <div className="p-4 sm:p-6">
            {filteredQualifications.length > 0 ? (
              <div className="space-y-4">
                {filteredQualifications.map((qual) => {
                  const qualification = qualificationsData?.find(q => q.ID === qual.QualificationID);
                  if (!qualification) return null;

                  const status = getQualificationStatus(qual);
                  const statusColor = getQualificationStatusColor(qual);

                  return (
                    <div
                      key={`qualification-${qual.QualificationID}`}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            {qualification.Name}
                          </h5>
                          {/* Qualifikationstyp Tags */}
                          {qualification.Herkunft === "Pflicht" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                              Pflichtqualifikation
                            </span>
                          )}
                          {qualification.Herkunft === "Zusatz" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                              Zusatzfunktion
                            </span>
                          )}
                          {qualification.JobTitle && qualification.Herkunft !== "Pflicht" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                                              Positionsqualifikation
                            </span>
                          )}
                          {/* Karenztage Tag - nur anzeigen wenn Qualifikation nicht "läuft nie ab" */}
                          {qual.toQualifyUntil && new Date(qual.toQualifyUntil) > new Date() && !qual.isQualifiedUntil && qualification.ValidityInMonth !== 999 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                              Karenztage bis {formatDate(qual.toQualifyUntil)}
                            </span>
                          )}
                          {/* Absolviert Tag - nur anzeigen wenn nicht abgelaufen */}
                          {qual.qualifiedFrom && status !== 'Abgelaufen' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                              Absolviert am {formatDate(qual.qualifiedFrom)}
                            </span>
                          )}
                          {/* Abgelaufen Tag */}
                          {status === 'Abgelaufen' && (() => {
                            const expiryDate = new Date(qual.isQualifiedUntil ? qual.isQualifiedUntil : qual.toQualifyUntil);
                            const now = new Date();
                            // Add 14 days grace period to the expiry date for calculation
                            const gracePeriodExpiry = new Date(expiryDate);
                            gracePeriodExpiry.setDate(expiryDate.getDate() + 14);
                            const daysSinceGraceExpiry = Math.floor((now.getTime() - gracePeriodExpiry.getTime()) / (1000 * 60 * 60 * 24));
                            
                            // Nur anzeigen, wenn tatsächlich abgelaufen (nach Karenzzeit)
                            return daysSinceGraceExpiry > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                Abgelaufen seit {daysSinceGraceExpiry} {daysSinceGraceExpiry === 1 ? 'Tag' : 'Tagen'} (inkl. 14 Tage Karenz)
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Gültig seit: {qual.qualifiedFrom ? formatDate(qual.qualifiedFrom) : "noch nicht abgeschlossen"}
                          </p>
                          {qual.toQualifyUntil && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Gültig bis: {qualification.ValidityInMonth >= 999 ? 'Läuft nie ab' : formatDate(qual.isQualifiedUntil ? qual.isQualifiedUntil : qual.toQualifyUntil)}
                            </p>
                          )}
                          {qualification.ValidityInMonth < 999 && (qual.isQualifiedUntil || qual.toQualifyUntil) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Weiterqualifizierung bis: {formatDate(new Date(new Date(qual.isQualifiedUntil || qual.toQualifyUntil).getTime() + (14 * 24 * 60 * 60 * 1000)))} (inkl. + 14 Tage)
                            </p>
                          )}
                          
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Keine Qualifikationen gefunden
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedFilter === 'all'
                    ? 'Sie haben noch keine Qualifikationen.'
                    : selectedFilter === 'active'
                    ? 'Sie haben keine aktiven Qualifikationen.'
                    : selectedFilter === 'expiring'
                    ? 'Sie haben keine auslaufenden Qualifikationen.'
                    : 'Sie haben keine abgelaufenen Qualifikationen.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}