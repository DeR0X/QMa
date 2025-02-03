import { PERMISSIONS } from '../constants';
import type { DocumentUploadFormData } from '../../../types';
import { Building2, X } from 'lucide-react';

interface Props {
  formData: DocumentUploadFormData;
  onUpdate: (newData: DocumentUploadFormData) => void;
  departments: Array<{ name: string }>;
}

export default function DepartmentAccess({ formData, onUpdate, departments }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Wählen Sie die Abteilungen und deren Berechtigungen aus
        </p>
        <select
          value=""
          onChange={(e) => {
            const dept = e.target.value;
            if (dept && !formData.metadata.accessControl.allowedDepartments.includes(dept)) {
              onUpdate({
                ...formData,
                metadata: {
                  ...formData.metadata,
                  accessControl: {
                    ...formData.metadata.accessControl,
                    allowedDepartments: [...formData.metadata.accessControl.allowedDepartments, dept],
                    permissions: {
                      ...formData.metadata.accessControl.permissions,
                      view: [
                        ...((formData.metadata.accessControl.permissions as Record<string, string[]>).view || []),
                        dept,
                      ],
                    } as unknown as DocumentUploadFormData['metadata']['accessControl']['permissions'],
                  },
                }
              });
            }
          }}
          className="w-64 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
        >
          <option value="">Abteilung hinzufügen...</option>
          {departments
            .filter(dept => !formData.metadata.accessControl.allowedDepartments.includes(dept.name))
            .map(dept => (
              <option key={dept.name} value={dept.name}>{dept.name}</option>
            ))}
        </select>
      </div>

      {/* Abteilungszugriffsrechte */}
      <div className="space-y-4">
        {formData.metadata.accessControl.allowedDepartments.map(deptName => (
          <div key={deptName} className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {deptName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdate({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      accessControl: {
                        ...formData.metadata.accessControl,
                        allowedDepartments: formData.metadata.accessControl.allowedDepartments
                          .filter(d => d !== deptName),
                        permissions: Object.fromEntries(
                          Object.entries(formData.metadata.accessControl.permissions)
                            .map(([key, values]) => [
                              key,
                              (values as string[]).filter(v => v !== deptName)
                            ])
                        ) as DocumentUploadFormData['metadata']['accessControl']['permissions']
                      }
                    }
                  });
                }}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PERMISSIONS.map(permission => (
                <label key={permission.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={
                      ((formData.metadata.accessControl.permissions as Record<string, string[]>)[permission.value] || [])
                        .includes(deptName)
                    }
                    onChange={(e) => {
                      const permissions = formData.metadata.accessControl.permissions as Record<string, string[]>;
                      const currentPermissions = permissions[permission.value] || [];
                      const newPermissions = e.target.checked
                        ? [...currentPermissions, deptName]
                        : currentPermissions.filter(name => name !== deptName);

                      onUpdate({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          accessControl: {
                            ...formData.metadata.accessControl,
                            permissions: {
                              ...permissions,
                              [permission.value]: newPermissions,
                            } as unknown as DocumentUploadFormData['metadata']['accessControl']['permissions'],
                          },
                        }
                      });
                    }}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {permission.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}

        {formData.metadata.accessControl.allowedDepartments.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#181818] rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Keine Abteilungen ausgewählt</p>
            <p className="text-sm">Wählen Sie oben Abteilungen aus, um Zugriffsrechte zu vergeben</p>
          </div>
        )}
      </div>
    </div>
  );
}