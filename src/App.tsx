import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { createInitialPlans, updateExistingPlans } from './services/firestore';
import { baremoService } from './services/baremoService';
import { Toaster } from 'react-hot-toast';

// Componentes de autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './pages/ResetPassword';
import FirebaseAction from './pages/FirebaseAction';

// Componentes principales
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import TestTakingPage from './pages/TestTakingPage';
import TestResultsPage from './components/test/TestResultsPage';
import Home from './pages/Home';
import Admin from './pages/Admin';
import BaremoCalculatorPage from './pages/BaremoCalculatorPage';
import AdminRoute from './components/auth/AdminRoute';
import CustomTestCreator from './components/CustomTestCreator';
import SolveTest from './components/SolveTest';
import PlansPage from './pages/PlansPage';
import TestReview from './components/TestReview';
import AdminReports from './pages/AdminReports';

// Rutas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Guardar la ruta actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

// Componente para manejar el layout
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isTestPage = location.pathname.includes('solve-test');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <div className={`min-h-screen flex flex-col ${isTestPage ? 'bg-gray-50' : ''}`}>
      {!isAdminPage && <Navbar />}
      <div className={`flex-grow ${!isAdminPage && !isTestPage ? 'pt-16' : 'pt-16'}`}>
        {children}
      </div>
      {!isAdminPage && !isTestPage && <Footer />}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Firebase ya está inicializado en firebaseConfig.ts
        await createInitialPlans();
        await updateExistingPlans();
        await baremoService.initializeBaremoConfig();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#91c26a]"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* Ruta para las acciones de Firebase Auth */}
            <Route path="/__/auth/action" element={<FirebaseAction />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/plans" 
              element={
                <PrivateRoute>
                  <Layout>
                    <PlansPage />
                  </Layout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/baremo" 
              element={
                <PrivateRoute>
                  <Layout>
                    <BaremoCalculatorPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route 
              path="/calculadora-baremo" 
              element={
                <PrivateRoute>
                  <Layout>
                    <BaremoCalculatorPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <AdminRoute>
                  <Layout>
                    <AdminReports />
                  </Layout>
                </AdminRoute>
              }
            />
            <Route 
              path="/admin/*" 
              element={
                <AdminRoute>
                  <Layout>
                    <Admin />
                  </Layout>
                </AdminRoute>
              } 
            />
            <Route 
              path="/test" 
              element={
                <PrivateRoute>
                  <Layout>
                    <SolveTest />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route 
              path="/test/:testId" 
              element={
                <Layout>
                  <PrivateRoute>
                    <TestTakingPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route 
              path="/test-results/:resultId" 
              element={
                <Layout>
                  <PrivateRoute>
                    <TestResultsPage />
                  </PrivateRoute>
                </Layout>
              }
            />
            <Route 
              path="/test-review/:testId" 
              element={
                <PrivateRoute>
                  <Layout>
                    <TestReview />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route 
              path="/custom-test" 
              element={
                <PrivateRoute>
                  <Layout>
                    <CustomTestCreator />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route 
              path="/solve-test/:testId" 
              element={
                <PrivateRoute>
                  <Layout>
                    <SolveTest />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route 
              path="/custom-test-creator" 
              element={
                <Layout>
                  <PrivateRoute>
                    <CustomTestCreator />
                  </PrivateRoute>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;