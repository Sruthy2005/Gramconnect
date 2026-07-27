import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UserDashboard from './components/UserDashboard';

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Translate pathname-based dashboard routes to hash-based representation
    if (window.location.pathname.startsWith('/dashboard')) {
      const subpath = window.location.pathname.substring(10); // e.g. "/report-issue"
      const targetHash = `#dashboard${subpath}`;
      window.history.replaceState(null, '', `/${targetHash}`);
      setRoute(targetHash);
    }

    const handleHashChange = () => {
      setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Central Auth Routing Protection (Requirement 3, 4, 5)
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Authenticated: Prevent viewing auth pages (login, register, forgot-password)
        if (route === '#login' || route === '#register' || route === '#forgot-password') {
          window.location.replace('/#dashboard');
          setRoute('#dashboard');
        }
      } else {
        // Unauthenticated: Prevent viewing protected pages (dashboard and its subpaths)
        if (route.startsWith('#dashboard')) {
          window.location.replace('/#login');
          setRoute('#login');
        }
      }
    }
  }, [user, loading, route]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'var(--font-sans)' }}>
        <span style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'lineDash 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 600 }}>Loading GramConnect...</span>
      </div>
    );
  }

  if (route === '#login') {
    return <LoginPage />;
  }

  if (route === '#register') {
    return <RegisterPage />;
  }

  if (route === '#forgot-password') {
    return <ForgotPasswordPage />;
  }

  if (route.startsWith('#dashboard')) {
    return <UserDashboard />;
  }

  return <LandingPage />;
}
