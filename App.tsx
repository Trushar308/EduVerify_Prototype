import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import AssignmentDetailsPage from './pages/AssignmentDetailsPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <HashRouter>
      <div className="relative min-h-screen w-full text-slate-200 transition-colors duration-300 antialiased">
        {user && <Header />}
        <main className={`transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/class/:classId" element={user ? <ClassDetailsPage /> : <Navigate to="/login" />} />
            <Route path="/assignment/:assignmentId" element={user ? <AssignmentDetailsPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;