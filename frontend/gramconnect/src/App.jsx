import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import PanchayatAdminDashboard from './components/PanchayatAdminDashboard';

/** Returns true if role is a main admin or super admin (full access) */
const isMainAdmin = (role) =>
  role && ['admin', 'Admin', 'SUPER_ADMIN', 'super_admin'].includes(role);

/** Returns true if role is a panchayat-level admin */
const isPanchayatAdmin = (role) =>
  role && ['panchayat_admin', 'PANCHAYAT_ADMIN'].includes(role);

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
    } else if (window.location.pathname.startsWith('/panchayat-admin')) {
      const targetHash = '#panchayat-admin';
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


  // Central Auth Routing Protection
  useEffect(() => {
    if (!loading) {
      if (user) {
        const adminUser = isMainAdmin(user.role);
        const panchayatAdminUser = isPanchayatAdmin(user.role);

        // Authenticated: Prevent viewing auth pages
        if (route === '#login' || route === '#register' || route === '#forgot-password') {
          if (adminUser) {
            window.location.replace('/admin/dashboard');
            setRoute('#admin');
          } else if (panchayatAdminUser) {
            window.location.replace('/#panchayat-admin');
            setRoute('#panchayat-admin');
          } else {
            window.location.replace('/dashboard');
            setRoute('#dashboard');
          }
        }

        // Citizens should not access admin sections
        if (route.startsWith('#admin') && !adminUser && !panchayatAdminUser) {
          window.location.replace('/dashboard');
          setRoute('#dashboard');
        }

        // Panchayat admins should not access main admin section
        if (route.startsWith('#admin') && panchayatAdminUser && !adminUser) {
          window.location.replace('/#panchayat-admin');
          setRoute('#panchayat-admin');
        }

        // Main admins should navigate to admin workspace
        if (route.startsWith('#dashboard') && adminUser) {
          window.location.replace('/admin/dashboard');
          setRoute('#admin');
        }

        // Panchayat admins sent to /dashboard should go to panchayat-admin
        if (route.startsWith('#dashboard') && panchayatAdminUser) {
          window.location.replace('/#panchayat-admin');
          setRoute('#panchayat-admin');
        }
      } else {
        // Unauthenticated: Prevent viewing protected pages
        if (route.startsWith('#dashboard') || route.startsWith('#admin') || route.startsWith('#panchayat-admin')) {
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

  if (route.startsWith('#panchayat-admin')) {
    return <PanchayatAdminDashboard />;
  }

  if (route.startsWith('#dashboard')) {
    return <UserDashboard />;
  }

  if (route.startsWith('#admin')) {
    return <AdminDashboard />;
  }

  return <LandingPage />;
}
