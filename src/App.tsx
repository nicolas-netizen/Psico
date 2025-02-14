import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/animations/SplashScreen';
import { createInitialQuestions, createInitialPlans } from './services/firestore';
import { Toaster } from 'react-hot-toast';

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
import TestScreen from './components/TestScreen';
import Results from './components/Results';
import TestManager from './components/admin/TestManager';
import AdminRoute from './components/auth/AdminRoute';

// Rutas protegidas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
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
    const initializeApp = async () => {
      try {
        // Crear preguntas y planes iniciales si no existen
        await Promise.all([
          createInitialQuestions(),
          createInitialPlans()
        ]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Simular un tiempo de carga mínimo
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/test/:testId" 
                element={
                  <PrivateRoute>
                    <TestTakingPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/test/:testId/results" 
                element={
                  <PrivateRoute>
                    <TestResultsPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/test/:testId?" 
                element={
                  <PrivateRoute>
                    <TestScreen />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/results" 
                element={
                  <PrivateRoute>
                    <Results />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/planes" 
                element={
                  <PrivateRoute>
                    <PlanList />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/calculadora-baremo" 
                element={
                  <PrivateRoute>
                    <BaremoCalculatorPage />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;