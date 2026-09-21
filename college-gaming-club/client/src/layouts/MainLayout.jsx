import React, { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { prefetchAppResources } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const location = useLocation();
  const { user, isAuthenticated, loading, isStaff } = useAuth();

  // Prefetch data in background on initial layout load so subsequent pages load instantly
  useEffect(() => {
    prefetchAppResources();
  }, []);

  // Admin and staff users ONLY have the Admin Panel, not the player/student website
  if (!loading && isAuthenticated && isStaff) {
    return <Navigate to="/admin" replace />;
  }

  const hideFooterRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#07090e] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* GLOBAL CINEMATIC ESPORTS BACKGROUND ACROSS ALL PAGES */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base dark canvas */}
        <div className="absolute inset-0 bg-[#07090e]" />

        {/* Ambient stadium lighting */}
        <div
          className="absolute inset-0 bg-cover bg-top opacity-20 mix-blend-screen"
          style={{
            backgroundImage: "url('/assets/gaming-hero-bg.png')",
          }}
        />

        {/* Esports stadium perspective glow and depth lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_10%,rgba(6,182,212,0.14),transparent_75%)]" />
        <div className="absolute top-1/4 -left-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#07090e] via-[#07090e]/80 to-transparent" />
      </div>

      <Navbar />
      <main className="relative z-10 flex-grow pt-20 sm:pt-24">
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default MainLayout;

