import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/ProtectedRoute';
import UserDashboard from './components/user/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useGlobalAuth } from './hooks/useGlobalAuth';
import ScrollToTop from './components/ScrollToTop';
import Precios from './pages/Precios';
import Resources from './pages/Resources';
import './styles/grid-pattern.css';

const DashboardRouter = () => {
  const { userRole } = useGlobalAuth();
  return userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/precios"
                element={<Precios />}
              />
              <Route
                path="/recursos"
                element={<Resources />}
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;