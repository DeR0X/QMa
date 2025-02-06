/* import type { AuditLog } from '../types';

export const logAction = (
  userId: string,
  action: string,
  details: string,
  performedBy: string,
  category: AuditLog['category']
): void => {
  const auditLog: AuditLog = {
    id: Date.now().toString(),
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
    performedBy,
    category,
  };

  // In a real application, this would be sent to a backend API
  console.log('Audit Log:', auditLog);
}; */