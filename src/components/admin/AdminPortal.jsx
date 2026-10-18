import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminPortal({ onBackToStore }) {
  const [session, setSession] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsCheckingAuth(false);
      return;
    }

    // 1. Obtener sesión activa al montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsCheckingAuth(false);
    });

    // 2. Suscribirse a cambios de estado de autenticación (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsCheckingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-stone-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">
          Verificando sesión segura...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <AdminLogin
        onLoginSuccess={(newSession) => setSession(newSession)}
        onBackToStore={onBackToStore}
      />
    );
  }

  return (
    <AdminDashboard
      user={session.user}
      onLogout={handleLogout}
      onGoToStore={onBackToStore}
    />
  );
}
