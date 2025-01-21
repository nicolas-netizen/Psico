import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/user/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminRoute from './components/auth/AdminRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import TestTakingPage from './components/test/TestTakingPage';
import TestResultsPage from './components/test/TestResultsPage';
import PlanList from './components/plans/PlanList';
import Home from './pages/Home';

// Componente protegido que requiere autenticación
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();
  const showFooter = location.pathname === '/';

  return (
    <div className="App min-h-screen flex flex-col">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={currentUser ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/test/:testId" element={
            <PrivateRoute>
              <TestTakingPage />
            </PrivateRoute>
          } />
          <Route path="/test-results/:resultId" element={
            <PrivateRoute>
              <TestResultsPage />
            </PrivateRoute>
          } />
          <Route path="/plans" element={
            <PrivateRoute>
              <PlanList />
            </PrivateRoute>
          } />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;