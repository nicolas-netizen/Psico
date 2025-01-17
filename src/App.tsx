import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/user/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ManagePlans from './components/admin/ManagePlans';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Precios from './pages/Precios';
import { useAuth } from './context/AuthContext';
import TestForm from './components/admin/TestForm';
import PlanList from './components/plans/PlanList';

// Componente para redireccionar basado en el rol
const RoleBasedRedirect = () => {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
};

const AppContent = () => {
  const location = useLocation();
  const showFooter = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected user routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/precios" element={<PlanList />} />
          </Route>

          {/* Protected admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/planes"
            element={
              <AdminRoute>
                <ManagePlans />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tests/create"
            element={
              <AdminRoute>
                <TestForm onTestCreated={() => {}} onClose={() => {}} />
              </AdminRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <ToastContainer position="bottom-right" />
      </AuthProvider>
    </Router>
  );
};

export default App;