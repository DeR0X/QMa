import { PERMISSIONS } from '../constants';
import type { DocumentUploadFormData } from '../../../types';

interface Props {
  formData: DocumentUploadFormData;
  onUpdate: (newData: DocumentUploadFormData) => void;
  departments: Array<{ name: string }>;
}

export default function DepartmentAccess({ formData, onUpdate, departments }: Props) {
  return (
    <div className="sm:col-span-2 space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Wählen Sie die Abteilungen und deren Berechtigungen aus
      </p>
      {departments.map(dept => (
        <div key={dept.name} className="bg-gray-50 dark:bg-[#181818] p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {dept.name}
            </h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.metadata.accessControl.allowedDepartments.includes(dept.name)}
                onChange={(e) => {
                  onUpdate({
                    ...formData,
                    metadata: {
                      ...formData.metadata,
                      accessControl: {
                        ...formData.metadata.accessControl,
                        allowedDepartments: e.target.checked
                          ? [...formData.metadata.accessControl.allowedDepartments, dept.name]
                          : formData.metadata.accessControl.allowedDepartments.filter(d => d !== dept.name)
                      }
                    }
                  });
                }}
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Abteilung aktivieren
              </span>
            </label>
          </div>
          
          {formData.metadata.accessControl.allowedDepartments.includes(dept.name) && (
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map(permission => (
                <label key={permission.value} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={
                      (formData.metadata.accessControl.permissions as Record<string, string[]>)[permission.value]?.includes(dept.name) || false
                    }
                    onChange={(e) => {
                      const permissions = formData.metadata.accessControl.permissions as Record<string, string[]>;
                      const currentPermissions = permissions[permission.value] || [];
                      const newPermissions = e.target.checked
                        ? [...currentPermissions, dept.name]
                        : currentPermissions.filter(d => d !== dept.name);

                      onUpdate({
                        ...formData,
                        metadata: {
                          ...formData.metadata,
                          accessControl: {
                            ...formData.metadata.accessControl,
                            permissions: {
                              ...permissions,
                              [permission.value]: newPermissions,
                            } as unknown as DocumentUploadFormData['metadata']['accessControl']['permissions']
                          }
                        }
                      });
                    }}
                  />
                  <div className="ml-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {permission.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {permission.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}