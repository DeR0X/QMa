import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoginForm from '../components/auth/LoginForm';
import AppLayout from '../components/layout/AppLayout';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Trainings from '../pages/Trainings';
import Documents from '../pages/Documents';
import Qualifications from '../pages/Qualifications';
import QualificationOverview from '../pages/QualificationOverview';
import TrainingHistory from '../pages/TrainingHistory';
import AdditionalFunctions from '../pages/AdditionalFunctions';
import UserManagement from '../pages/UserManagement';
import { usePermissionGuard } from '../hooks/usePermissionCheck';

// Protected Route component with permission checking
function ProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission: string;
}) {
  const hasPermission = usePermissionGuard(requiredPermission);
  
  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function AppRoutes() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      
      <Route element={<AppLayout />}>
        <Route 
          path="/" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/mitarbeiter" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="employees">
                <Employees />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/schulungen" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="trainings">
                <Trainings />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/training-history" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="trainings">
                <TrainingHistory />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/qualifikationen" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="qualifications">
                <Qualifications />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/qualifikationsuebersicht" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="qualifications_or_supervisor">
                <QualificationOverview />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/zusatzfunktionen" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="additional">
                <AdditionalFunctions />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/dokumente" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="documents">
                <Documents />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/verwaltung" 
          element={
            isAuthenticated ? (
              <ProtectedRoute requiredPermission="admin">
                <UserManagement />
              </ProtectedRoute>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}