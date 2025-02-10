import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import type { Employee } from '../types';

export const sendQualificationExpiryNotification = (employee: Employee, qualificationName: string, daysUntilExpiry: number) => {
  store.dispatch(
    addNotification({
      userId: employee.id,
      type: 'warning',
      title: 'Qualifikation läuft bald ab',
      message: `Ihre Qualifikation "${qualificationName}" läuft in ${daysUntilExpiry} Tagen ab. Bitte erneuern Sie diese zeitnah.`,
    })
  );
};

export const sendTrainingApprovalNotification = (employee: Employee, trainingTitle: string, approved: boolean) => {
  store.dispatch(
    addNotification({
      userId: employee.id,
      type: approved ? 'success' : 'error',
      title: approved ? 'Schulung genehmigt' : 'Schulung abgelehnt',
      message: `Ihre Schulungsanfrage für "${trainingTitle}" wurde ${
        approved ? 'genehmigt' : 'abgelehnt'
      }.`,
    })
  );
};

export const sendMandatoryTrainingReminder = (employee: Employee, trainingTitle: string) => {
  store.dispatch(
    addNotification({
      userId: employee.id,
      type: 'warning',
      title: 'Pflichtschulung erforderlich',
      message: `Sie müssen die Pflichtschulung "${trainingTitle}" absolvieren. Bitte melden Sie sich zeitnah an.`,
    })
  );
};

export const sendQualificationUpdateNotification = (employee: Employee, qualificationName: string) => {
  store.dispatch(
    addNotification({
      userId: employee.id,
      type: 'info',
      title: 'Qualifikation aktualisiert',
      message: `Ihre Qualifikation "${qualificationName}" wurde erfolgreich aktualisiert.`,
    })
  );
};