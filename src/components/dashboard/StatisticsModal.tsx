import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  X,
  Award,
  History as HistoryIcon,
  UserCheck,
  Building2,
  AlertTriangle,
  Briefcase,
  Calendar,
  Timer,
  Users as UsersIcon,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatDate, getLatestQualifications } from "../../lib/utils";
import EmployeeDetails from "../employees/EmployeeDetails";
import { useEmployeeQualifications } from "../../hooks/useEmployeeQualifications";
import { useDepartments } from "../../hooks/useDepartments";
import { useJobTitles } from "../../hooks/useJobTitles";
import { useQualifications } from "../../hooks/useQualifications";
import { hasHRPermissions } from "../../store/slices/authSlice";
import { RootState } from "../../store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  employees: Array<any>;
  type: "all" | "completed" | "pending" | "expiring";
}

// Modal für abgelaufene Qualifikation
function ExpiredQualificationModal({ qualification, employee, onClose }: { qualification: any, employee: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Qualifikationsdetails</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{qualification?.Name || 'Unbekannte Qualifikation'}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gültig bis: {qualification?.ValidityInMonth === 999 ? 'Läuft nie ab' : formatDate(qualification.toQualifyUntil)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-900 dark:text-white">Mitarbeiter: {employee?.FullName || employee?.fullName || employee?.Name || employee?.name || employee?.EmployeeID}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalnummer: {employee?.StaffNumber || employee?.staffNumber || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsModal({  
  isOpen,
  onClose,
  title,
  employees = [],
  type,
}: Props) {
  const { employee: currentEmployee } = useSelector((state: RootState) => state.auth);
  const isHRAdmin = hasHRPermissions(currentEmployee);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [expandedQualifications, setExpandedQualifications] = useState<Set<number | undefined>>(new Set());
  const [selectedQualificationType, setSelectedQualificationType] = useState<'all' | 'Pflicht' | 'Job' | 'Zusatz'>('all');
  const { data: departmentsData } = useDepartments();
  const { data: jobTitlesData } = useJobTitles();
  const { data: qualificationsData } = useQualifications();
  const { data: allEmployeeQualifications } = useEmployeeQualifications();
  const itemsPerPage = 10;
  const [selectedExpiredQual, setSelectedExpiredQual] = useState<any | null>(null);
  const [selectedExpiredEmployee, setSelectedExpiredEmployee] = useState<any | null>(null);
  // Filter employees based on their qualification status and selected filters
  const filteredEmployees = employees.filter((employee) => {
    // Get qualifications for this employee and get only the latest ones
    const employeeQuals = Array.isArray(allEmployeeQualifications)
      ? getLatestQualifications(allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID))
      : [];

    // Department filter
    if (selectedDepartment !== 'all' && employee.Department !== selectedDepartment) {
      return false;
    }

    // For pending (expired) qualifications, only show employees with expired qualifications
    switch (type) {
      case "completed":
        return employeeQuals.some((qual: any) => {
          // Get qualification details to check if it never expires
          const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
          
          // If qualification never expires (999 months), always count as completed
          if (qualification?.ValidityInMonth === 999) {
            return true;
          }
          
          // Check if qualification has a valid isQualifiedUntil date
          if (qual.isQualifiedUntil) {
            const qualifiedUntilDate = new Date(qual.isQualifiedUntil);
            const now = new Date();
            const sixtyDaysFromNow = new Date(now);
            sixtyDaysFromNow.setDate(now.getDate() + 60);
            return qualifiedUntilDate > sixtyDaysFromNow;
          }
          return false;
        });
      case "pending":
        // Show only employees with expired qualifications (including 2 weeks grace period)
        return employeeQuals.some((qual: any) => {
          // Get qualification details to check if it never expires
          const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
          
          // If qualification never expires (999 months), never count as pending
          if (qualification?.ValidityInMonth === 999) {
            return false;
          }
          
          // Check if qualification has isQualifiedUntil and it's expired + 2 weeks
          if (qual.isQualifiedUntil) {
            console.log(qual);
            const qualifiedUntilDate = new Date(qual.isQualifiedUntil);
            const twoWeeksAfterExpiry = new Date(qualifiedUntilDate);
            twoWeeksAfterExpiry.setDate(qualifiedUntilDate.getDate() + 14);
            return twoWeeksAfterExpiry <= new Date();
          }
          // If no isQualifiedUntil, check toQualifyUntil for grace period + 2 weeks
          if (qual.ToQualifyUntil || qual.toQualifyUntil) {
            console.log('Checking toQualifyUntil:', qual);
            const expiryDate = new Date(qual.ToQualifyUntil || qual.toQualifyUntil);
            const twoWeeksAfterExpiry = new Date(expiryDate);
            twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
            const now = new Date();
            const isExpired = twoWeeksAfterExpiry <= now;
            return isExpired;
          }
          return false;
        });
      case "expiring":
        return employeeQuals.some((qual: any) => {
          // Get qualification details to check if it never expires
          const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
          
          // If qualification never expires (999 months), never count as expiring
          if (qualification?.ValidityInMonth === 999) {
            return false;
          }
          
          // Check if qualification has isQualifiedUntil and is expiring within 60 days or within 14-day grace period
          if (qual.isQualifiedUntil) {
            const qualifiedUntilDate = new Date(qual.isQualifiedUntil);
            const now = new Date();
            const sixtyDaysFromNow = new Date(now);
            sixtyDaysFromNow.setDate(now.getDate() + 60);
            const twoWeeksAfterExpiry = new Date(qualifiedUntilDate);
            twoWeeksAfterExpiry.setDate(qualifiedUntilDate.getDate() + 14);
            return qualifiedUntilDate <= sixtyDaysFromNow && twoWeeksAfterExpiry > now;
          }
          // If no isQualifiedUntil, check toQualifyUntil for grace period
          if (qual.ToQualifyUntil || qual.toQualifyUntil) {
            const expiryDate = new Date(qual.ToQualifyUntil || qual.toQualifyUntil);
            const now = new Date();
            const sixtyDaysFromNow = new Date(now);
            sixtyDaysFromNow.setDate(now.getDate() + 60);
            const twoWeeksAfterExpiry = new Date(expiryDate);
            twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
            return expiryDate <= sixtyDaysFromNow && twoWeeksAfterExpiry > now;
          }
          return false;
        });
      default:
        return true;
    }
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Section: Abgelaufene Qualifikationen (alle)
  const now = new Date();
  let expiredQualifications: any[] = [];
  if (type === 'pending' && Array.isArray(allEmployeeQualifications)) {
    expiredQualifications = getLatestQualifications(allEmployeeQualifications.filter((qual: any) => {
      // Get qualification details to check if it never expires
      const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
      
      // If qualification never expires (999 months), never count as expired
      if (qualification?.ValidityInMonth === 999) {
        return false;
      }
      
      const expiryDate = new Date(qual.toQualifyUntil);
      return expiryDate <= now;
    }));
  }

  let expiringQualifications: any[] = [];
  if (type === 'expiring' && Array.isArray(allEmployeeQualifications)) {
    const sixtyDaysFromNow = new Date(now);
    sixtyDaysFromNow.setDate(now.getDate() + 60);
    expiringQualifications = getLatestQualifications(allEmployeeQualifications.filter((qual: any) => {
      // Get qualification details to check if it never expires
      const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
      
      // If qualification never expires (999 months), never count as expiring
      if (qualification?.ValidityInMonth === 999) {
        return false;
      }
      
      const expiryDate = new Date(qual.toQualifyUntil);
      return expiryDate <= sixtyDaysFromNow && expiryDate > now;
    }));
  }


  // Hilfsfunktion, um Mitarbeiter zu einer Qualifikation zu finden
  const findEmployeeByQual = (qual: any) => {
    return employees.find((emp: any) => emp.ID == qual.EmployeeID);
  };

  const toggleQualification = (qualId: number | undefined) => {
    if (qualId === undefined) return;
    setExpandedQualifications(prev => {
      const next = new Set(prev);
      if (next.has(qualId)) {
        next.delete(qualId);
      } else {
        next.add(qualId);
      }
      return next;
    });
  };

  const renderContent = () => {
    if (type === 'all') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.ID}
              className="bg-white dark:bg-[#181818] p-4 rounded-lg shadow cursor-pointer hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all duration-200"
              onClick={() => setSelectedEmployee(employee)}
            >
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                  <span className="text-sm font-medium dark:text-gray-900">
                    {employee.FullName.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{employee.FullName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.Department}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{employee.StaffNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For qualification-related views (completed, pending, expiring)
    return (
      <div className="space-y-6">
        {/* Filter für Qualifikationstypen */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedQualificationType('all')}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors ${
              selectedQualificationType === 'all'
                ? 'bg-primary text-white dark:bg-gray-700 dark:text-white'
                : 'bg-white dark:bg-[#181818] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Alle Qualifikationstypen
          </button>
          <button
            onClick={() => setSelectedQualificationType('Pflicht')}
            className={`px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium transition-colors ${
              selectedQualificationType === 'Pflicht'
                ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-white border-red-300 dark:border-red-600'
                : 'bg-white dark:bg-[#181818] text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-300 dark:border-red-600'
            }`}
          >
            Pflichtqualifikationen
          </button>
          <button
            onClick={() => setSelectedQualificationType('Job')}
            className={`px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md text-sm font-medium transition-colors ${
              selectedQualificationType === 'Job'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white border-blue-300 dark:border-blue-600'
                : 'bg-white dark:bg-[#181818] text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 border-blue-300 dark:border-blue-600'
            }`}
          >
            Positionsqualifikationen
          </button>
          <button
            onClick={() => setSelectedQualificationType('Zusatz')}
            className={`px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium transition-colors ${
              selectedQualificationType === 'Zusatz'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white border-purple-300 dark:border-purple-600'
                : 'bg-white dark:bg-[#181818] text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 border-purple-300 dark:border-purple-600'
            }`}
          >
            Zusatzfunktionen
          </button>
        </div>

        {/* Qualifikationsliste */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {type === 'completed' ? 'Aktive Qualifikationen' :
             type === 'pending' ? 'Abgelaufene Qualifikationen' :
             'Ablaufende Qualifikationen'}
          </h3>
          <div className="space-y-4">
            {Array.from(new Set(filteredEmployees.flatMap(employee => {
              const employeeQuals = Array.isArray(allEmployeeQualifications)
                ? getLatestQualifications(allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID))
                : [];
              return employeeQuals.filter((qual: any) => {
                // Prioritize isQualifiedUntil if it exists, otherwise fall back to toQualifyUntil
                const expiryDate = qual.isQualifiedUntil 
                  ? new Date(qual.isQualifiedUntil)
                  : (qual.ToQualifyUntil || qual.toQualifyUntil) 
                    ? new Date(qual.ToQualifyUntil || qual.toQualifyUntil)
                    : null;
                
                if (!expiryDate) return false;
                
                const now = new Date();
                const sixtyDaysFromNow = new Date(now);
                sixtyDaysFromNow.setDate(now.getDate() + 60);
                
                // Get qualification details to check if it never expires
                const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                
                // If qualification never expires (999 months), handle specially
                if (qualification?.ValidityInMonth === 999) {
                  if (type === 'completed') return true; // Always active
                  if (type === 'pending' || type === 'expiring') return false; // Never expiring or expired
                  return false;
                }
                
                if (type === 'completed') {
                  // Für aktive Qualifikationen: Nur die, die noch länger als 60 Tage gültig sind
                  return expiryDate > sixtyDaysFromNow;
                }
                if (type === 'pending') {
                  // Für abgelaufene Qualifikationen: Nur die, die nach 2 Wochen Grace Period abgelaufen sind
                  const twoWeeksAfterExpiry = new Date(expiryDate);
                  twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
                  return twoWeeksAfterExpiry <= now;
                }
                if (type === 'expiring') {
                  // Für ablaufende Qualifikationen: Zeige die, die in den nächsten 60 Tagen ablaufen ODER bereits abgelaufen sind, aber noch innerhalb der 14-Tage-Grace-Period liegen
                  const twoWeeksAfterExpiry = new Date(expiryDate);
                  twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
                  return (expiryDate <= sixtyDaysFromNow && expiryDate > now) || (expiryDate <= now && twoWeeksAfterExpiry > now);
                }
                return false;
              }).map(qual => {
                const qualification = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                return qualification?.ID;
              });
            }))).map(qualId => {
              const qualification = qualificationsData?.find(q => q.ID === qualId);
              if (!qualification || !qualification.ID) return null;

              // Filter nach Qualifikationstyp
              if (selectedQualificationType !== 'all' && qualification.Herkunft !== selectedQualificationType) {
                return null;
              }

              const employeesWithQual = filteredEmployees.filter(employee => {
                const employeeQuals = Array.isArray(allEmployeeQualifications)
                  ? getLatestQualifications(allEmployeeQualifications.filter((qual: any) => qual.EmployeeID == employee.ID))
                  : [];
                return employeeQuals.some((qual: any) => {
                  // Prioritize isQualifiedUntil if it exists, otherwise fall back to toQualifyUntil
                  const expiryDate = qual.isQualifiedUntil 
                    ? new Date(qual.isQualifiedUntil)
                    : (qual.ToQualifyUntil || qual.toQualifyUntil) 
                      ? new Date(qual.ToQualifyUntil || qual.toQualifyUntil)
                      : null;
                  
                  if (!expiryDate) return false;
                  
                  const now = new Date();
                  const sixtyDaysFromNow = new Date(now);
                  sixtyDaysFromNow.setDate(now.getDate() + 60);
                  
                  // Get qualification details to check if it never expires
                  const qualificationDetails = qualificationsData?.find(q => q.ID === parseInt(qual.QualificationID));
                  
                  // If qualification never expires (999 months), handle specially
                  if (qualificationDetails?.ValidityInMonth === 999) {
                    if (type === 'completed') return parseInt(qual.QualificationID) === qualification.ID; // Always active
                    if (type === 'pending' || type === 'expiring') return false; // Never expiring or expired
                    return false;
                  }
                  
                  if (type === 'completed') {
                    // Für aktive Qualifikationen: Nur die, die noch länger als 60 Tage gültig sind
                    return expiryDate > sixtyDaysFromNow && parseInt(qual.QualificationID) === qualification.ID;
                  }
                  if (type === 'pending') {
                    // Für abgelaufene Qualifikationen: Nur die, die nach 2 Wochen Grace Period abgelaufen sind
                    const twoWeeksAfterExpiry = new Date(expiryDate);
                    twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
                    return twoWeeksAfterExpiry <= now && parseInt(qual.QualificationID) === qualification.ID;
                  }
                  if (type === 'expiring') {
                    // Für ablaufende Qualifikationen: Zeige die, die in den nächsten 60 Tagen ablaufen ODER bereits abgelaufen sind, aber noch innerhalb der 14-Tage-Grace-Period liegen
                    const twoWeeksAfterExpiry = new Date(expiryDate);
                    twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
                    return ((expiryDate <= sixtyDaysFromNow && expiryDate > now) || (expiryDate <= now && twoWeeksAfterExpiry > now)) && parseInt(qual.QualificationID) === qualification.ID;
                  }
                  return false;
                });
              });

              const isExpanded = expandedQualifications.has(qualification.ID);

              let typeBadge = {
                label: '',
                style: ''
              };

              switch (qualification.Herkunft) {
                case 'Pflicht':
                  typeBadge = {
                    label: 'Pflichtqualifikation',
                    style: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  };
                  break;
                case 'Job':
                  typeBadge = {
                    label: 'Positionsqualifikation',
                    style: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  };
                  break;
                case 'Zusatz':
                  typeBadge = {
                    label: 'Zusatzfunktion',
                    style: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  };
                  break;
              }

              return (
                <div key={qualification.ID} className="bg-white dark:bg-[#121212] rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    onClick={() => toggleQualification(qualification.ID)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {qualification.Name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {qualification.Description || 'Keine Beschreibung verfügbar'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {employeesWithQual.length} Mitarbeiter
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge.style}`}>
                          {typeBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-[#181818]">
                      <div className="space-y-2">
                        {employeesWithQual.map(employee => {
                          const employeeQual = Array.isArray(allEmployeeQualifications)
                            ? getLatestQualifications(allEmployeeQualifications.filter((qual: any) => 
                                qual.EmployeeID == employee.ID && parseInt(qual.QualificationID) === qualification.ID
                              ))[0]
                            : null;

                          if (!employeeQual) return null;
                          // Prioritize isQualifiedUntil if it exists, otherwise fall back to toQualifyUntil
                          const expiryDate = employeeQual.isQualifiedUntil 
                            ? new Date(employeeQual.isQualifiedUntil)
                            : new Date(employeeQual.toQualifyUntil || employeeQual.ToQualifyUntil);
                          const now = new Date();
                          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          let statusClass = '';
                          let statusText = '';

                          if (type === 'completed') {
                            statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                            statusText = qualification?.ValidityInMonth === 999 ? 'Läuft nie ab' : `Noch ${daysUntilExpiry} Tage gültig`;
                          } else if (type === 'pending') {
                            statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                            // Add 14 days grace period to the expiry date for calculation
                            const gracePeriodExpiry = new Date(expiryDate);
                            gracePeriodExpiry.setDate(expiryDate.getDate() + 14);
                            const daysSinceGraceExpiry = Math.ceil((now.getTime() - gracePeriodExpiry.getTime()) / (1000 * 60 * 60 * 24));
                            statusText = `Seit ${daysSinceGraceExpiry} Tagen abgelaufen (inkl. 14 Tage Karenz)`;
                          } else if (type === 'expiring') {
                            statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                            if (qualification?.ValidityInMonth === 999) {
                              statusText = 'Läuft nie ab';
                            } else if (daysUntilExpiry < 0) {
                              // Qualifikation ist bereits abgelaufen, aber noch in der Weiterqualifizierungsphase
                              const twoWeeksAfterExpiry = new Date(expiryDate);
                              twoWeeksAfterExpiry.setDate(expiryDate.getDate() + 14);
                              const daysInGracePeriod = Math.ceil((twoWeeksAfterExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              statusText = `Weiterqualifizierung läuft in ${daysInGracePeriod} Tagen ab`;
                            } else {
                              statusText = `Läuft in ${daysUntilExpiry} Tagen ab`;
                            }
                          }

                          return (
                            <div key={employee.ID} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors" onClick={() => setSelectedEmployee(employee)}>
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-primary text-white dark:bg-gray dark:text-primary flex items-center justify-center">
                                  <span className="text-xs font-medium dark:text-gray-900">
                                    {employee.FullName.split(' ').map((n: string) => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {employee.FullName}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {employee.Department}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Gültig bis: {qualification?.ValidityInMonth === 999 ? 'Läuft nie ab' : formatDate(employeeQual.isQualifiedUntil || employeeQual.toQualifyUntil || employeeQual.ToQualifyUntil)}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                                  {statusText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#121212] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Filters - Only show for HR admins */}
        {type === 'all' && isHRAdmin && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="block w-full sm:w-48 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white text-sm"
              >
                <option value="all">Alle Abteilungen</option>
                {departmentsData?.map((dept) => (
                  <option key={dept.ID} value={dept.Department}>
                    {dept.Department}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {type === "pending" 
                  ? "Keine abgelaufenen Qualifikationen gefunden"
                  : type === "expiring"
                  ? "Keine ablaufenden Qualifikationen in den nächsten 60 Tagen gefunden"
                  : type === "completed"
                  ? "Keine aktiven Qualifikationen (mehr als 60 Tage gültig) gefunden"
                  : "Keine Mitarbeiter gefunden"}
              </p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdate={() => {}}
          approvals={[]}
          trainings={[]}
          handleApproveTraining={() => {}}
          handleRejectTraining={() => {}}
        />
      )}
      {selectedExpiredQual && (
        <ExpiredQualificationModal
          qualification={selectedExpiredQual}
          employee={selectedExpiredEmployee}
          onClose={() => {
            setSelectedExpiredQual(null);
            setSelectedExpiredEmployee(null);
          }}
        />
      )}
    </div>
  );
}