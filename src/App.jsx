import React, { useState, useEffect, Suspense, lazy } from 'react';
import { CartProvider } from './context/CartContext';
import StoreApp from './components/mercat/StoreApp';
import CityLanding from './components/landing/CityLanding';

// Code-splitting asíncrono para el Portal de Control (0 KB agregados a la carga pública)
const AdminPortal = lazy(() => import('./components/admin/AdminPortal'));

function isPortalRoute() {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    hash === '#portal-k' ||
    hash.startsWith('#portal-k') ||
    path === '/portal-k' ||
    path.startsWith('/portal-k') ||
    params.get('view') === 'portal-k'
  );
}

export default function App() {
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      if (isPortalRoute()) return 'portal-k';
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'store' || window.location.hash === '#store') return 'store';
      if (params.get('view') === 'landing' || window.location.hash === '#landing') return 'landing';
    }
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#portal-k') {
        setView('portal-k');
      } else if (hash === '#landing') {
        setView('landing');
      } else if (hash === '#store') {
        setView('store');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectStore = () => {
    window.location.hash = '#store';
    setView('store');
  };

  const handleBackToLanding = () => {
    window.location.hash = '#landing';
    setView('landing');
  };

  const handleGoToStore = () => {
    window.location.hash = '#store';
    setView('store');
  };

  return (
    <CartProvider>
      {view === 'portal-k' ? (
        <Suspense
          fallback={
            <div className="min-h-screen min-h-[100dvh] bg-stone-950 text-white flex flex-col items-center justify-center p-4">
              <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">
                Cargando Portal de Control...
              </p>
            </div>
          }
        >
          <AdminPortal onBackToStore={handleGoToStore} />
        </Suspense>
      ) : view === 'store' ? (
        <StoreApp onBackToLanding={handleBackToLanding} />
      ) : (
        <CityLanding onSelectStore={handleSelectStore} />
      )}
    </CartProvider>
  );
}
