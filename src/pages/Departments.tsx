import { useState } from 'react';
import { Building2, Plus, TrendingUp, DollarSign, Users } from 'lucide-react';
import type { Department } from '../types';

const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Information Technology',
    head: 'Sarah Chen',
    employeeCount: 45,
    budget: 850000,
    kpis: [
      { metric: 'Project Delivery', value: 92, target: 95 },
      { metric: 'Customer Satisfaction', value: 88, target: 90 },
      { metric: 'Innovation Index', value: 78, target: 85 },
    ],
  },
  {
    id: '2',
    name: 'Human Resources',
    head: 'Michael Brown',
    employeeCount: 15,
    budget: 350000,
    kpis: [
      { metric: 'Employee Satisfaction', value: 85, target: 90 },
      { metric: 'Time to Hire', value: 95, target: 90 },
      { metric: 'Training Completion', value: 88, target: 95 },
    ],
  },
];

export default function Departments() {
  const [departments] = useState<Department[]>(mockDepartments);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Abteilungen
        </h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 dark:bg-[#121212] dark:text-white dark:hover:bg-[#1a1a1a] dark:border-gray-800">
          <Plus className="h-5 w-5 mr-2" />
          Abteilung hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white dark:bg-[#121212] shadow rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {dept.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Head: {dept.head}
                    </p>
                  </div>
                </div>
                <button className="text-sm text-primary hover:text-primary/90 dark:text-white dark:hover:text-gray-300">
                  Details anzeigen
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {dept.employeeCount} Mitarbeier
                  </span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    ${dept.budget.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Leistungskennzahlen (KPI)
                </h3>
                <div className="space-y-4">
                  {dept.kpis.map((kpi) => (
                    <div key={kpi.metric}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {kpi.metric}
                        </span>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {kpi.value}%
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                            / {kpi.target}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(kpi.value / kpi.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}