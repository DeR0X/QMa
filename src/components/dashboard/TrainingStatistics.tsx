import { useState } from 'react';
import { 
  PieChart, 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  ChevronDown
} from 'lucide-react';
import StatisticsModal from './StatisticsModal';
import { useEmployees } from '../../hooks/useEmployees';
import { useEmployeeQualifications } from '../../hooks/useEmployeeQualifications';
import type { EmployeeFilters } from '../../types';

interface Props {
  departmentFilter?: string;
}

export default function TrainingStatistics({ departmentFilter }: Props) {
  const [showModal, setShowModal] = useState<string | null>(null);
  const [apiFilters] = useState<EmployeeFilters>({
    department: departmentFilter,
  });

  const { 
    data: employeesData, 
    isLoading: isEmployeesLoading, 
    error: employeesError 
  } = useEmployees(apiFilters);

  if (isEmployeesLoading) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 dark:text-gray-400">Lade Mitarbeiter...</p>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="bg-white dark:bg-[#181818] rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-red-500">Fehler beim Laden der Mitarbeiter</p>
          <p className="text-sm text-red-400">{employeesError.toString()}</p>
        </div>
      </div>
    );
  }

  const totalEmployees = employeesData?.data.length || 0;
  const completedEmployees = employeesData?.data.filter(employee => {
    const { data: qualifications } = useEmployeeQualifications(employee.ID.toString());
    return qualifications && qualifications.length > 0;
  }).length || 0;

  const expiringEmployees = employeesData?.data.filter(employee => {
    const { data: qualifications } = useEmployeeQualifications(employee.ID.toString());
    return qualifications?.some(qual => {
      const expiryDate = new Date(qual.ToQualifyUntil);
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
      return expiryDate <= twoMonthsFromNow && expiryDate > new Date();
    });
  }).length || 0;

  const pendingEmployees = totalEmployees - completedEmployees;

  const stats = [
    {
      id: 'total',
      name: 'Gesamtmitarbeiter',
      value: totalEmployees,
      icon: Users,
      color: 'text-blue-500',
      onClick: () => setShowModal('all')
    },
    {
      id: 'completed',
      name: 'Qualifiziert',
      value: completedEmployees,
      icon: CheckCircle,
      color: 'text-green-500',
      onClick: () => setShowModal('completed')
    },
    {
      id: 'pending',
      name: 'Ausstehend',
      value: pendingEmployees,
      icon: Clock,
      color: 'text-yellow-500',
      onClick: () => setShowModal('pending')
    },
    {
      id: 'expiring',
      name: 'Ablaufend',
      value: expiringEmployees,
      icon: AlertCircle,
      color: 'text-red-500',
      onClick: () => setShowModal('expiring')
    }
  ];

  const getModalEmployees = () => {
    if (!employeesData?.data) return [];

    switch (showModal) {
      case 'all':
        return employeesData.data;
      case 'completed':
        return employeesData.data.filter(employee => {
          const { data: qualifications } = useEmployeeQualifications(employee.ID.toString());
          return qualifications && qualifications.length > 0;
        });
      case 'pending':
        return employeesData.data.filter(employee => {
          const { data: qualifications } = useEmployeeQualifications(employee.ID.toString());
          return !qualifications || qualifications.length === 0;
        });
      case 'expiring':
        return employeesData.data.filter(employee => {
          const { data: qualifications } = useEmployeeQualifications(employee.ID.toString());
          return qualifications?.some(qual => {
            const expiryDate = new Date(qual.ToQualifyUntil);
            const twoMonthsFromNow = new Date();
            twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
            return expiryDate <= twoMonthsFromNow && expiryDate > new Date();
          });
        });
      default:
        return [];
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          onClick={stat.onClick}
          className="bg-white dark:bg-[#181818] overflow-hidden rounded-lg shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors duration-200"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}

      {showModal && (
        <StatisticsModal
          isOpen={!!showModal}
          onClose={() => setShowModal(null)}
          title={stats.find(s => s.id === showModal)?.name || ''}
          employees={getModalEmployees()}
          type={showModal as "all" | "completed" | "pending" | "expiring"}
        />
      )}
    </div>
  );
}