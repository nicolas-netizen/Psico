import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { createInitialPlans, updateExistingPlans } from './services/firestore';
import { Toaster } from 'react-hot-toast';

// Componentes de autenticación
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './pages/ResetPassword';

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

// Rutas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
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
      {!isAdminPage && !isTestPage && !isAuthPage && <Footer />}
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
            <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
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
                <Layout>
                  <PlansPage />
                </Layout>
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
              path="/test/:testId" 
              element={
                <PrivateRoute>
                  <Layout>
                    <TestTakingPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route 
              path="/test-results/:testId" 
              element={
                <PrivateRoute>
                  <Layout>
                    <TestResultsPage />
                  </Layout>
                </PrivateRoute>
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
                <PrivateRoute>
                  <Layout>
                    <CustomTestCreator />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;