import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/animations/SplashScreen';

// Componentes de autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Componentes principales
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './components/user/Dashboard';
import TestTakingPage from './pages/TestTakingPage';
import TestResultsPage from './components/test/TestResultsPage';
import PlanList from './components/plans/PlanList';
import Home from './pages/Home';
import Admin from './pages/Admin';
import BaremoCalculatorPage from './pages/BaremoCalculatorPage';
import TestResults from './components/test/TestResults';
import TestPortal from './pages/user/TestPortal';
import TakeTest from './pages/user/TakeTest';
import AdminDashboard from './components/admin/AdminDashboard';

// Rutas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isAdmin } = useAuth();
  return currentUser && isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

// Componente para manejar el layout
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow pt-16">
        {children}
      </div>
      {!isAuthPage && <Footer />}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular un tiempo de carga
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas de usuario */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/test-portal" 
              element={
                <PrivateRoute>
                  <TestPortal />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/test/:testId" 
              element={
                <PrivateRoute>
                  <TakeTest />
                </PrivateRoute>
              } 
            />
            
            {/* Rutas de administrador */}
            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;