import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import type { User } from '../types';

export const sendQualificationExpiryNotification = (user: User, qualificationName: string, daysUntilExpiry: number) => {
  store.dispatch(
    addNotification({
      userId: user.id,
      type: 'warning',
      title: 'Qualifikation läuft bald ab',
      message: `Ihre Qualifikation "${qualificationName}" läuft in ${daysUntilExpiry} Tagen ab. Bitte erneuern Sie diese zeitnah.`,
    })
  );
};

export const sendTrainingApprovalNotification = (user: User, trainingTitle: string, approved: boolean) => {
  store.dispatch(
    addNotification({
      userId: user.id,
      type: approved ? 'success' : 'error',
      title: approved ? 'Schulung genehmigt' : 'Schulung abgelehnt',
      message: `Ihre Schulungsanfrage für "${trainingTitle}" wurde ${
        approved ? 'genehmigt' : 'abgelehnt'
      }.`,
    })
  );
};

export const sendMandatoryTrainingReminder = (user: User, trainingTitle: string) => {
  store.dispatch(
    addNotification({
      userId: user.id,
      type: 'warning',
      title: 'Pflichtschulung erforderlich',
      message: `Sie müssen die Pflichtschulung "${trainingTitle}" absolvieren. Bitte melden Sie sich zeitnah an.`,
    })
  );
};

export const sendQualificationUpdateNotification = (user: User, qualificationName: string) => {
  store.dispatch(
    addNotification({
      userId: user.id,
      type: 'info',
      title: 'Qualifikation aktualisiert',
      message: `Ihre Qualifikation "${qualificationName}" wurde erfolgreich aktualisiert.`,
    })
  );
};