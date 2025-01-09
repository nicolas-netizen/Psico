import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import TestTakingPage from './components/test/TestTakingPage';
import TestResultsPage from './components/test/TestResultsPage';
import AptitudeTestSelection from './components/test/AptitudeTestSelection';

// Styles and additional imports
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/grid-pattern.css';

const ConditionalFooter: React.FC = () => {
  const location = useLocation();
  
  // Do not show footer on take-test page
  if (location.pathname === '/take-test') {
    return null;
  }
  
  return <Footer />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        {(authContext) => (
          <>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {authContext.isAuthenticated ? (
                      <Route 
                        path="*" 
                        element={
                          <ErrorBoundary>
                            <Routes>
                              <Route 
                                path="/dashboard" 
                                element={
                                  <ProtectedRoute>
                                    {authContext.userRole === 'admin' ? <AdminDashboard /> : <Dashboard />}
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
                              {authContext.userRole === 'admin' && (
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
                              <Route 
                                path="/take-test" 
                                element={
                                  <ProtectedRoute>
                                    <TestTakingPage />
                                  </ProtectedRoute>
                                } 
                              />
                              <Route 
                                path="/test-results" 
                                element={
                                  <ProtectedRoute>
                                    <TestResultsPage />
                                  </ProtectedRoute>
                                } 
                              />
                              <Route 
                                path="/aptitude-tests" 
                                element={
                                  <ProtectedRoute>
                                    <AptitudeTestSelection />
                                  </ProtectedRoute>
                                } 
                              />
                              <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                          </ErrorBoundary>
                        } 
                      />
                    ) : (
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    )}
                  </Routes>
                </ErrorBoundary>
              </main>
              <ConditionalFooter />
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
          </>
        )}
      </AuthProvider>
    </Router>
  );
};

export default App;