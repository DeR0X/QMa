import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoginForm from '../components/auth/LoginForm';
import AppLayout from '../components/layout/AppLayout';
import Dashboard from '../pages/Dashboard';
import Employees from '../pages/Employees';
import Departments from '../pages/Departments';
import Trainings from '../pages/Trainings';
import Documents from '../pages/Documents';
import Qualifications from '../pages/Qualifications';
import TrainingHistory from '../pages/TrainingHistory';

// Temporary placeholder component for development
const PlaceholderComponent = () => (
  <div className="flex min-h-screen items-center justify-center">
    <h1 className="text-2xl font-bold">Coming Soon</h1>
  </div>
);

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
        <Route path="/mitarbeiter" element={<Employees />} />
        <Route path="/abteilungen" element={<Departments />} />
        <Route path="/schulungen" element={<Trainings />} />
        <Route path="/training-history" element={<TrainingHistory />} />
        <Route path="/qualifikationen" element={<Qualifications />} />
        <Route path="/dokumente" element={<Documents />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}