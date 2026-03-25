import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CursusPage from './pages/CursusPage';
import CoursPage from './pages/CoursPage';
import FormateursPage from './pages/FormateursPage';
import SallesPage from './pages/SallesPage';
import PromotionsPage from './pages/PromotionsPage';
import OrdonancementPage from './pages/OrdonancementPage';
import CompetencesPage from './pages/CompetencesPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="cursus" element={<CursusPage />} />
            <Route path="cours" element={<CoursPage />} />
            <Route path="formateurs" element={<FormateursPage />} />
            <Route path="salles" element={<SallesPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="ordonnancement" element={<OrdonancementPage />} />
            <Route path="competences" element={<CompetencesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
