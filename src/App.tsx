import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useGlobalAuth } from './hooks/useGlobalAuth';
import ErrorBoundary from './components/ErrorBoundary';

// Page imports
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/user/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { TestsPage } from './pages/TestsPage';
import Plans from './components/Plans';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Precios from './pages/Precios';
import Resources from './pages/Resources';

// Styles and additional imports
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/grid-pattern.css';

const DashboardRouter = () => {
  const { userRole, isAuthenticated } = useGlobalAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              {userRole === 'admin' ? <AdminDashboard /> : <Dashboard />}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/precios" 
          element={
            <ProtectedRoute>
              <Precios />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/recursos" 
          element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/plans" 
          element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          } 
        />
        {userRole === 'admin' && (
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        )}
        <Route 
          path="/tests" 
          element={
            <ProtectedRoute>
              <TestsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<DashboardRouter />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;