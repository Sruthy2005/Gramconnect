import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

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
    } else if (window.location.pathname.startsWith('/community')) {
      const targetHash = '#dashboard/hub';
      window.history.replaceState(null, '', `/${targetHash}`);
      setRoute(targetHash);
    } else if (window.location.pathname.startsWith('/admin/complaints')) {
      const subpath = window.location.pathname.substring(17);
      const targetHash = subpath ? `#admin/complaints${subpath}` : '#admin/complaints';
      window.history.replaceState(null, '', `/${targetHash}`);
      setRoute(targetHash);
    } else if (window.location.pathname.startsWith('/admin/community')) {
      const subpath = window.location.pathname.substring(16);
      const targetHash = subpath ? `#admin/community${subpath}` : '#admin/community';
      window.history.replaceState(null, '', `/${targetHash}`);
      setRoute(targetHash);
    } else if (window.location.pathname.startsWith('/admin/dashboard') || window.location.pathname === '/admin') {
      const targetHash = '#admin';
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

  // Centralized Google Identity Services Initialization
  useEffect(() => {
    let checkInterval;
    const initGoogleGsi = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        clearInterval(checkInterval);
        console.log('[DEV] Centralized Google Identity Services Initializing...');
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response) => {
            console.log('[DEV] Centralized Google Auth Callback triggered.');
            if (window.handleGoogleLoginSuccess) {
              window.handleGoogleLoginSuccess(response);
            } else {
              console.warn('[DEV] Centralized Google Auth callback fired, but handleGoogleLoginSuccess is not set.');
            }
          }
        });
      }
    };

    initGoogleGsi();
    checkInterval = setInterval(initGoogleGsi, 100);

    return () => clearInterval(checkInterval);
  }, []);


  // Central Auth Routing Protection (Requirement 3, 4, 5 & Admin Role Guard)
  useEffect(() => {
    if (!loading) {
      if (user) {
        const isAdmin = user.role && (user.role.toLowerCase() === 'admin');

        // Authenticated: Prevent viewing auth pages
        if (route === '#login' || route === '#register' || route === '#forgot-password') {
          const dest = isAdmin ? 'admin/dashboard' : 'dashboard';
          window.location.replace(`/${dest}`);
          setRoute(isAdmin ? '#admin' : '#dashboard');
        }

        // Citizens should not access admin section
        if (route.startsWith('#admin') && !isAdmin) {
          window.location.replace('/dashboard');
          setRoute('#dashboard');
        }

        // Admins should navigate to admin workspace
        if (route.startsWith('#dashboard') && isAdmin) {
          window.location.replace('/admin/dashboard');
          setRoute('#admin');
        }
      } else {
        // Unauthenticated: Prevent viewing protected pages
        if (route.startsWith('#dashboard') || route.startsWith('#admin')) {
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

  if (route.startsWith('#admin')) {
    return <AdminDashboard />;
  }

  return <LandingPage />;
}
